import type { BrowserContext, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import type { Application } from '../adapters/application';

export const createAppPageObject = ({ page, app }: { page: Page; app: Application }) => {
  const appPage = Object.create(page) as Page;
  const helpers = {
    goToStart: async () => {
      await page.goto(app.serverUrl);
    },
    goToRelative: async path => {
      await page.goto(new URL(path, app.serverUrl).toString());
    },
    waitForClerkJsLoaded: async () => {
      return page.waitForFunction(() => {
        // @ts-ignore
        return window.Clerk?.isReady();
      });
    },
    waitForClerkComponentMounted: async () => {
      return page.waitForSelector('.cl-rootBox', { state: 'attached' });
    },
  };
  return Object.assign(appPage, helpers);
};

export const createSignInComponentPageObject = ({ page }: { page: Page }) => {
  return {
    waitForMounted: () => {
      return page.waitForSelector('.cl-signIn-root', { state: 'attached' });
    },
    setIdentifier: (val: string) => {
      return page.locator('input[name=identifier]').fill(val);
    },
    continue: () => {
      return page.getByRole('button', { name: 'Continue', exact: true }).click();
    },
    setPassword: (val: string) => {
      return page.locator('input[name=password]').fill(val);
    },
    setInstantPassword: async (val: string) => {
      const passField = page.locator('input[name=password]');
      await passField.fill(val, { force: true });
      await expect(passField).toBeVisible();
    },
    goToSignUp: () => {
      return page.getByRole('link', { name: /sign up/i }).click();
    },
    signInWithOauth: (provider: string) => {
      return page.getByRole('button', { name: new RegExp(`continue with ${provider}`, 'gi') });
    },
  };
};

export const createSignUpComponentPageObject = ({ page }: { page: Page }) => {
  return {
    waitForMounted: () => {
      return page.waitForSelector('.cl-signUp-root', { state: 'attached' });
    },
    setIdentifier: (val: string) => {
      return page.getByLabel(/email address/).fill(val);
    },
    continue: () => {
      return page.getByRole('button', { name: 'Continue', exact: true }).click();
    },
    setPassword: (val: string) => {
      return page.locator('input[name=password]').fill(val);
    },
    setInstantPassword: async (val: string) => {
      const passField = page.locator('input[name=password]');
      await passField.fill(val, { force: true });
      await expect(passField).toBeVisible();
    },
    goToSignUp: () => {
      return page.getByRole('link', { name: /sign up/i }).click();
    },
    signInWithOauth: (provider: string) => {
      return page.getByRole('button', { name: new RegExp(`continue with ${provider}`, 'gi') });
    },
  };
};

export const createEmailServicePageObject = async ({ context }: { context: BrowserContext }) => {
  const page = await context.newPage();
  return {
    getCodeForEmail: async (email: string) => {
      await page.goto('https://mailsac.com/app/#/folder/inbox');
      await page.getByPlaceholder('username').fill('clerkcookie');
      await page.getByPlaceholder('password').fill('rvb8kfc5CXM!vwv@ngx');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.locator('#searchText').fill('clerkcookie+1');
      await page.locator('#searchText').press('Enter');
      const text = await page.locator('td').getByText(email).textContent();
      return text.match(/\d{6}/)?.[0] || '';
    },
  };
};
