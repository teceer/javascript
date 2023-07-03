import { expect, test } from '@playwright/test';

import type { Application } from '../adapters/application';
import { configs } from '../configs';
import { createAppPageObject } from '../pageObjects/signInComponent';

test.describe('appearance prop', () => {
  test.describe.configure({ mode: 'parallel' });
  let app: Application;

  test.beforeAll(async () => {
    app = await configs.react.vite
      .clone()
      .addFile(
        'src/App.tsx',
        ({ tsx }) => tsx`
            import { SignIn, SignUp } from '@clerk/clerk-react';

            import { dark, neobrutalism, shadesOfPurple } from '@clerk/themes';
            const themes = { shadesOfPurple, neobrutalism, dark };

            export default function App() {
              const elements = ['shadesOfPurple', 'neobrutalism', 'dark']
              // deterministic order
              .map(name => [name, themes[name]])
              .map(([name, theme]) => {
                return (
                  <div key={name}>
                    <h2>{name}</h2>
                    <SignIn appearance={{ baseTheme: theme }} />
                    <SignUp appearance={{ baseTheme: theme }} />
                  </div>
                );
              });
              return <main>{elements}</main>;
            }`,
      )
      .commit();
    await app.setup();
    await app.withEnv(configs.instances.allEnabled);
  });

  test.afterAll(async () => {
    await app.teardown();
  });

  test('all @clerk/themes render', async ({ page }) => {
    await app.dev();
    const appPage = createAppPageObject({ page, app });
    await appPage.goToStart();
    await appPage.waitForClerkComponentMounted();
    await expect(page).toHaveScreenshot({ fullPage: true });
  });
});
