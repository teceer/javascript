import { environmentConfig } from '../adapters/environment.js';

export const emailPasswordInstance = environmentConfig()
  .setEnvVariable('private', 'CLERK_SECRET_KEY', 'sk_test_Oi5xKTDhG4gUePJI6S2aTOdzqhQ51UANX7PPm8Qcq1')
  .setEnvVariable('public', 'CLERK_PUBLISHABLE_KEY', 'pk_test_dXByaWdodC13YXNwLTIyLmNsZXJrLmFjY291bnRzLmRldiQ')
  .setEnvVariable('public', 'CLERK_SIGN_IN_URL', '/sign-in')
  .setEnvVariable('public', 'CLERK_SIGN_UP_URL', '/sign-up');
