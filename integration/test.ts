import { applicationConfig } from './adapters/applicationConfig.js';
import { templates } from './templates/index.js';

const nextAppRouterConfig = applicationConfig()
  .setName('next-app-router')
  .useTemplate(templates['next-app-router'])
  .setEnvFormatter('public', key => `NEXT_PUBLIC_${key}`)
  .addScript('setup', 'npm i')
  .addScript('dev', 'npm run dev')
  .addScript('build', 'npm run build')
  .addScript('serve', 'npm run start');

const nextAppRouterTurboPackConfig = nextAppRouterConfig
  .clone()
  .setName('next-app-router')
  .useTemplate(templates['next-app-router'])
  .setEnvFormatter('public', key => `NEXT_PUBLIC_${key}`)
  .addScript('setup', 'npm i')
  .addScript('dev', 'npm run dev -- --turbo');

const test = async () => {
  const reactCraConfig = applicationConfig()
    .setName('react-cra')
    .useTemplate(templates['react-cra'])
    .setEnvFormatter('public', key => `REACT_APP_${key}`)
    .addScript('setup', 'npm i')
    .addScript('dev', 'npm run start')
    .addScript('build', 'npm run build')
    .addScript('serve', 'npm run start');

  const reactViteConfig = reactCraConfig
    .clone()
    .setName('react-vite')
    .useTemplate(templates['react-vite'])
    .setEnvFormatter('public', key => `VITE_${key}`)
    .addScript('serve', 'npm run preview');

  const app = await nextAppRouterConfig.commit();
  // const app = await reactCraConfig.commit();
  // const app = await reactViteConfig.commit();

  await app.setup();
  await app.withEnv(env1);
  // const { serverUrl, port } = await app.dev();
  // await app.build();
  const { serverUrl, port } = await app.dev();
  console.log({ serverUrl, port });
  await new Promise(resolve => setTimeout(resolve, 50000));
  await app.stop();
  // await app.teardown();
};

void test();
