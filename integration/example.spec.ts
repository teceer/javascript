import { test } from '@playwright/test';

// test('has title', async ({ page }) => {
//   await page.goto('https://playwright.dev/');
//
//   // Expect a title "to contain" a substring.
//   await expect(page).toHaveTitle(/Playwright/);
// });
//
// test('get started link', async ({ page }) => {
//   await page.goto('https://playwright.dev/');
//
//   // Click the get started link.
//   await page.getByRole('link', { name: 'Get started' }).click();
//
//   // Expects the URL to contain intro.
//   await expect(page).toHaveURL(/.*intro/);
// });

test('signs in', async ({ page }) => {
  await page.goto('https://clerk.com/');
  await page.getByRole('link', { name: 'Sign in' }).click();
  await page.getByLabel('Email address').click();
  await page.getByLabel('Email address').fill('nikos@clerk.dev');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Password', { exact: true }).click();
  await page.getByLabel('Password', { exact: true }).fill('nikos@clerk.dev');
  await page.getByLabel('Password', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Password is incorrect. Try again, or use another method.').click();
  await page.getByLabel('Password', { exact: true }).click();
  await page.getByLabel('Password', { exact: true }).fill('nikos@clerk.devnikos@clerk.dev');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Nikos Douvlis', exact: true }).click();
  await page.getByRole('paragraph').filter({ hasText: 'nikos@clerk.dev' }).click();
});
