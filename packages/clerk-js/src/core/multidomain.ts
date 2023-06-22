import {
  addClerkPrefix,
  handleValueOrFn,
  isHttpOrHttps,
  isValidProxyUrl,
  proxyUrlToAbsoluteURL,
  stripScheme,
} from '@clerk/shared';
import type { ClerkOptions, MultiDomainAndOrProxy } from '@clerk/types';
import type { InstanceType } from '@clerk/types';
import type { BuildUrlWithAuthParams } from '@clerk/types';

import {
  buildURL,
  createCookieHandler,
  errorThrower,
  getClerkQueryParam,
  inBrowser,
  removeClerkQueryParam,
  setDevBrowserJWTInURL,
  stripOrigin,
  windowNavigate,
} from '../utils';
import { CLERK_SATELLITE_URL, CLERK_SYNCED } from './constants';
import type { DevBrowserHandler } from './devBrowserHandler';
import {
  clerkMissingDevBrowserJwt,
  clerkMissingProxyUrlAndDomain,
  clerkMissingSignInUrlAsSatellite,
  clerkRedirectUrlIsMissingScheme,
} from './errors';

export const navigateUtil = async (
  to: string | undefined,
  options?: {
    customNavigate?: ClerkOptions['navigate'];
  },
): Promise<unknown> => {
  const { customNavigate } = options || {};
  if (!to || !inBrowser()) {
    return;
  }

  const toURL = new URL(to, window.location.href);

  if (toURL.origin !== window.location.origin || !customNavigate) {
    windowNavigate(toURL);
    return;
  }

  // React router only wants the path, search or hash portion.
  return await customNavigate(stripOrigin(toURL));
};

export const buildUrlWithAuthUtil = (
  { instanceType, devBrowser }: { instanceType: string; devBrowser: DevBrowserHandler },
  to: string,
  options?: BuildUrlWithAuthParams,
): string => {
  if (instanceType === 'production' || !devBrowser.usesUrlBasedSessionSync()) {
    return to;
  }

  const toURL = new URL(to, window.location.origin);

  if (toURL.origin === window.location.origin) {
    return toURL.href;
  }

  const devBrowserJwt = devBrowser.getDevBrowserJWT();
  if (!devBrowserJwt) {
    return clerkMissingDevBrowserJwt();
  }

  const asQueryParam = !!options?.useQueryParam;

  return setDevBrowserJWTInURL(toURL.href, devBrowserJwt, asQueryParam);
};

export const runMultiDomainSSO = async (
  options: ClerkOptions &
    Omit<MultiDomainAndOrProxy, 'isSatellite'> & {
      instanceType: InstanceType;
    },
  devBrowser: DevBrowserHandler,
) => {
  const {
    isSatellite: isSatelliteVorFn,
    proxyUrl: proxyVorFn,
    domain: domainVorFn,
    isInterstitial,
    signInUrl,
    instanceType,
  } = options;
  const isSatellite = () => {
    if (inBrowser()) {
      return handleValueOrFn(isSatelliteVorFn, new URL(window.location.href), false);
    }
    return false;
  };

  const proxyUrl = () => {
    if (inBrowser()) {
      const _unfilteredProxy = handleValueOrFn(proxyVorFn, new URL(window.location.href));
      if (!isValidProxyUrl(_unfilteredProxy)) {
        errorThrower.throwInvalidProxyUrl({ url: _unfilteredProxy });
      }
      return proxyUrlToAbsoluteURL(_unfilteredProxy);
    }
    return '';
  };

  const domain = () => {
    if (inBrowser()) {
      const strippedDomainString = stripScheme(handleValueOrFn(domainVorFn, new URL(window.location.href)));
      if (instanceType === 'production') {
        return addClerkPrefix(strippedDomainString);
      }
      return strippedDomainString;
    }
    return '';
  };

  const shouldSyncWithPrimary = (): boolean => {
    if (getClerkQueryParam(CLERK_SYNCED) === 'true') {
      if (!isInterstitial) {
        removeClerkQueryParam(CLERK_SYNCED);
      }
      return false;
    }

    if (!isSatellite()) {
      return false;
    }

    const cookieHandler = createCookieHandler();
    return cookieHandler.getClientUatCookie() <= 0;
  };

  const syncWithPrimary = async () => {
    if (instanceType === 'development') {
      const searchParams = new URLSearchParams({
        [CLERK_SATELLITE_URL]: window.location.href,
      });
      const url = buildURL({ base: signInUrl, searchParams }, { stringify: true });
      await navigateUtil(url);
    } else if (instanceType === 'production') {
      let primarySyncUrl;

      if (proxyUrl()) {
        const proxy = new URL(proxyUrl());
        primarySyncUrl = new URL(`${proxy.pathname}/v1/client/sync`, proxy.origin);
      } else if (domain()) {
        primarySyncUrl = new URL(`/v1/client/sync`, `https://${domain()}`);
      }

      primarySyncUrl?.searchParams.append('redirect_url', window.location.href);

      const url = primarySyncUrl?.toString() || '';
      await navigateUtil(url);
    }
  };

  const shouldRedirectToSatellite = (): boolean => {
    if (instanceType === 'production') {
      return false;
    }

    if (isSatellite()) {
      return false;
    }

    const satelliteUrl = getClerkQueryParam(CLERK_SATELLITE_URL);
    return !!satelliteUrl;
  };

  const redirectToSatellite = async (): Promise<unknown> => {
    if (!inBrowser()) {
      return;
    }
    const searchParams = new URLSearchParams({
      [CLERK_SYNCED]: 'true',
    });

    const satelliteUrl = getClerkQueryParam(CLERK_SATELLITE_URL);
    if (!satelliteUrl || !isHttpOrHttps(satelliteUrl)) {
      clerkRedirectUrlIsMissingScheme();
    }

    const backToSatelliteUrl = buildURL(
      { base: getClerkQueryParam(CLERK_SATELLITE_URL) as string, searchParams },
      { stringify: true },
    );
    return navigateUtil(
      buildUrlWithAuthUtil(
        {
          instanceType,
          devBrowser,
        },
        backToSatelliteUrl,
      ),
    );
  };

  /**
   * Code
   */

  /**
   * VALIDATE
   */
  if (isSatellite()) {
    if (instanceType === 'development' && !signInUrl) {
      clerkMissingSignInUrlAsSatellite();
      return true;
    }

    if (proxyUrl() && domain()) {
      clerkMissingProxyUrlAndDomain();
      return true;
    }
  }

  /**
   * Sync/Link
   */
  if (shouldSyncWithPrimary()) {
    await syncWithPrimary();
    return true;
  }

  await devBrowser.setup();

  if (shouldRedirectToSatellite()) {
    await redirectToSatellite();
    return true;
  }

  return false;
};
