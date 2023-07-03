import { expect, test } from '@playwright/test';

import type { Application } from '../adapters/application';
import { configs } from '../configs';
import { createAppPageObject, createSignInComponentPageObject } from '../pageObjects/signInComponent';

test.describe('multiple apps', () => {
  test.describe.configure({ mode: 'parallel' });
  [configs.react.vite].forEach((config, i) => {
    test.describe(`${config.name} (${i})`, () => {
      let app: Application;

      test.beforeAll(async () => {
        app = await config.commit({ stableHash: 'test' });
        // await app.setup();
        await app.withEnv(configs.instances.allEnabled);
        await app.dev({ port: 5001 });
      });

      test.afterAll(async () => {
        await app.stop();
        // await app.teardown();
      });

      test('sign in with email and password', async ({ page: _page }) => {
        const page = createAppPageObject({ page: _page, app });
        const signInPageObject = createSignInComponentPageObject({ page });
        await page.goToStart();
        await signInPageObject.waitForMounted();
        await signInPageObject.setIdentifier('nikos@clerk.dev');
        await signInPageObject.continue();
        await signInPageObject.setPassword('nikos@clerk.devnikos@clerk.dev');
        await signInPageObject.continue();
        page.getByText(/signed in/);
      });

      test('sign in with email and password using password manager', async ({ page: _page }) => {
        const page = createAppPageObject({ page: _page, app });
        const signInPageObject = createSignInComponentPageObject({ page });
        await page.goToStart();
        await signInPageObject.waitForMounted();
        await signInPageObject.setIdentifier('nikos@clerk.dev');
        await signInPageObject.setInstantPassword('nikos@clerk.devnikos@clerk.dev');
        await signInPageObject.continue();
        await expect(page.getByText(/signed in/)).toBeVisible();
      });
    });
  });
});
