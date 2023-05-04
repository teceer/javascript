import { isRouteErrorResponse, useRouteError } from '@remix-run/react';
import React from 'react';

import { Interstitial } from './Interstitial';

type CatchBoundary = () => JSX.Element;
type ErrorBoundary = ({ error }: { error: Error }) => JSX.Element;

export const ClerkErrorBoundary = (RootCatchBoundary?: CatchBoundary, RootErrorBoundary?: ErrorBoundary) => {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    const { __clerk_ssr_interstitial_html } = error?.data?.clerkState?.__internal_clerk_state || {};
    if (__clerk_ssr_interstitial_html) {
      return <Interstitial html={__clerk_ssr_interstitial_html} />;
    }
    return RootCatchBoundary && <RootCatchBoundary />;
  }
  return RootErrorBoundary && <RootErrorBoundary error={error as Error} />;
};
