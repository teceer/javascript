import { applicationConfig } from '../adapters/applicationConfig.js';
import { templates } from '../templates/index.js';

export const nextAppRouterConfig = applicationConfig()
  .setName('next-app-router')
  .useTemplate(templates['next-app-router'])
  .setEnvFormatter('public', key => `NEXT_PUBLIC_${key}`)
  .addScript('setup', 'npm i')
  .addScript('dev', 'npm run dev')
  .addScript('build', 'npm run build')
  .addScript('serve', 'npm run start');

export const nextAppRouterTurboPackConfig = nextAppRouterConfig
  .clone()
  .setName('next-app-router-turbopack')
  .addScript('dev', 'npm run dev -- --turbo');
