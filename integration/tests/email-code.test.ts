import { test } from '@playwright/test';

import type { Application } from '../adapters/application';
import { hash } from '../adapters/helpers';
import { configs } from '../configs';
import {
  createAppPageObject,
  createEmailServicePageObject,
  createSignUpComponentPageObject,
} from '../pageObjects/signInComponent';

test.describe('sign up and sign in with email code', () => {
  test.describe.configure({ mode: 'parallel' });
  [configs.next.appRouter].forEach((config, i) => {
    test.describe(`${config.name} (${i})`, () => {
      test.describe.configure({ mode: 'serial' });
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

      test('sign up', async ({ page: _page, context }) => {
        const email = `clerkcookie+${hash()}@mailsac.com`;
        const page = createAppPageObject({ app, page: _page });
        const signUpPage = createSignUpComponentPageObject({ page });
        await page.goToRelative('/sign-up');
        await signUpPage.waitForMounted();
        await page.getByLabel(/email address/i).fill(email);
        await page.locator('input[name=password]').fill(email);
        await signUpPage.continue();
        const emailServicePage = await createEmailServicePageObject({ context });
        const code = emailServicePage.getCodeForEmail(email);
        console.log(code);
        // await page.getByRole('textbox', { name: 'Enter verification code. Digit 1' }).click();
      });
    });
  });
});
