import type { Readable } from 'node:stream';

// @ts-ignore
import getPort, { portNumbers } from 'get-port';

import type { ApplicationConfig } from './applicationConfig.js';
import type { EnvironmentConfig } from './environment.js';
import { shell } from './shell.js';

export type Application = ReturnType<typeof application>;

export const application = (config: ApplicationConfig, appDir: string) => {
  const { name, scripts, envWriter } = config;
  const state = { completedSetup: false };
  const cleanupFns: { (): any }[] = [];

  // [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(eventType => {
  //   process.on(eventType, () => {
  //     void self.stop();
  //   });
  // });

  const self = {
    name,
    scripts,
    appDir,
    withEnv: async (env: EnvironmentConfig) => {
      return envWriter(appDir, env.publicVariables, env.privateVariables);
    },
    setup: async () => {
      if (!state.completedSetup) {
        await shell.run(`cd ${appDir} && ${scripts.setup}`);
        state.completedSetup = true;
      }
    },
    dev: async () => {
      console.info(shell.chalk.bgCyan(`${name} :: Starting dev server`));
      const port = await getPort({ port: portNumbers(5000, 5100) });
      const serverUrl = `http://localhost:${port}`;
      const server = shell.run(`cd ${appDir} && PORT=${port} ${scripts.dev}`);
      cleanupFns.push(() => server.kill());
      // note: we're awaiting the message, so we are sure that the dev server is up and running,
      // but we're not awaiting the process itself as we want to treat this as a detached spawn process
      await waitUntilMessage(server.stdout, serverUrl);
      return { port, serverUrl };
    },
    build: async () => {
      console.info(shell.chalk.bgCyan(`${name} :: Building prod bundle`));
      await shell.run(`cd ${appDir} && ${scripts.build}`);
    },
    serve: async () => {
      console.info(shell.chalk.bgCyan(`${name} :: Starting prod server`));
      const port = await getPort({ port: portNumbers(5000, 5100) });
      const serverUrl = `http://localhost:${port}`;
      const server = shell.run(`cd ${appDir} && PORT=${port} ${scripts.serve}`);
      cleanupFns.push(() => server.kill());
      console.log(serverUrl);
      await waitUntilMessage(server.stdout, serverUrl);
      return { port, serverUrl };
    },
    stop: async () => {
      await Promise.all(cleanupFns.map(fn => fn()));
      cleanupFns.splice(0, cleanupFns.length);
      return Promise.resolve();
    },
    teardown: async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await self.stop();
      await shell.fs.rmSync(appDir, { recursive: true, force: true });
    },
  };
  return self;
};

const waitUntilMessage = async (stream: Readable, message: string) => {
  return new Promise<void>(resolve => {
    stream.on('data', chunk => {
      if (chunk.toString().includes(message)) {
        resolve();
      }
    });
  });
};
