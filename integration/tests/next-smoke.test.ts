import { test } from '@playwright/test';

import type { Application } from '../adapters/application.js';
import { emailPasswordInstance } from '../configs/envs.js';
import { nextAppRouterConfig } from '../configs/next.js';

test.describe('Next.js App Router smoke test', () => {
  let app: Application;

  test.beforeAll(async () => {
    console.log('before all');
    app = await nextAppRouterConfig.commit();
    await app.setup();
  });

  test.afterAll(async () => {
    console.log('after all');
    await app.teardown();
  });

  test('signs in', async ({ page }) => {
    console.log('signs in');
    await app.withEnv(emailPasswordInstance);
    const { serverUrl } = await app.dev();
    await page.goto(serverUrl);
  });
});
