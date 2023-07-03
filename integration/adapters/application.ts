import * as path from 'node:path';

import treekill from 'tree-kill';

import { chalk, chunkLogger, fs, getPort, range, run, waitForIdleProcess } from '../utils';
import type { ApplicationConfig } from './applicationConfig.js';
import type { EnvironmentConfig } from './environment.js';

export type Application = ReturnType<typeof application>;

export const application = (config: ApplicationConfig, appDir: string) => {
  const { name, scripts, envWriter } = config;
  // TODO: Revise how serverUrl is set
  // It is currently set by serve and dev
  const state = { completedSetup: false, serverUrl: '' };
  const cleanupFns: { (): any }[] = [];

  const self = {
    name,
    scripts,
    appDir,
    get serverUrl() {
      return state.serverUrl;
    },
    withEnv: async (env: EnvironmentConfig) => {
      return envWriter(appDir, env.publicVariables, env.privateVariables);
    },
    setup: async (opts?: { strategy?: 'ci' | 'i' | 'copy'; force?: boolean }) => {
      const { strategy, force } = opts || {};
      const nodeModulesExist = await fs.pathExists(path.resolve(appDir, 'node_modules'));
      if (force || !nodeModulesExist) {
        const logger = chunkLogger(chalk.bgYellow, `${name} :: setup`);
        await run(scripts.setup, { cwd: appDir, logger });
        state.completedSetup = true;
      }
    },
    dev: async (opts?: { port?: number }) => {
      // const port = await getPort({ port: range(5000, 5100) });
      const port = opts.port || (await getPort());
      const serverUrl = `http://localhost:${port}`;
      const logger = chunkLogger(chalk.bgYellow, `${name} :: dev`);
      const proc = run(scripts.dev, { cwd: appDir, env: { PORT: port.toString() }, logger });
      cleanupFns.push(() => treekill(proc.pid, 'SIGKILL'));
      await waitForIdleProcess(proc);
      state.serverUrl = serverUrl;
      return { port, serverUrl };
    },
    build: async () => {
      const logger = chunkLogger(chalk.bgYellow, `${name} :: build`);
      await run(scripts.build, { cwd: appDir, logger });
    },
    serve: async () => {
      const port = await getPort({ port: range(5000, 5100) });
      const serverUrl = `http://localhost:${port}`;
      const logger = chunkLogger(chalk.bgYellow, `${name} :: build`);
      const proc = run(scripts.build, { cwd: appDir, logger });
      cleanupFns.push(() => treekill(proc.pid, 'SIGKILL'));
      await waitForIdleProcess(proc);
      state.serverUrl = serverUrl;
      return { port, serverUrl };
    },
    stop: async () => {
      console.info(chalk.bgYellow(`${name} :: Stopping...`));
      await Promise.all(cleanupFns.map(fn => fn()));
      cleanupFns.splice(0, cleanupFns.length);
      state.serverUrl = '';
      return new Promise(res => setTimeout(res, 2000));
    },
    teardown: async () => {
      console.info(chalk.bgYellow(`${name} :: Tearing down...`));
      await self.stop();
      try {
        fs.rmSync(appDir, { recursive: true, force: true });
      } catch (e) {
        console.log(e);
      }
    },
  };
  return self;
};
