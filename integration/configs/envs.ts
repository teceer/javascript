import { environmentConfig } from '../adapters/environment.js';

if (!process.env.INTEGRATION_INSTANCE_KEYS) {
  throw new Error('Missing INTEGRATION_INSTANCE_KEYS environment variable. Is your .env.local file populated?');
}

const envKeys: Record<string, { pk: string; sk: string }> = JSON.parse(process.env.INTEGRATION_INSTANCE_KEYS || '{}');

const allEnabled = environmentConfig()
  .setEnvVariable('private', 'CLERK_SECRET_KEY', envKeys['all-enabled'].sk)
  .setEnvVariable('public', 'CLERK_PUBLISHABLE_KEY', envKeys['all-enabled'].pk)
  .setEnvVariable('public', 'CLERK_SIGN_IN_URL', '/sign-in')
  .setEnvVariable('public', 'CLERK_SIGN_UP_URL', '/sign-up');

export const instances = {
  allEnabled,
} as const;
