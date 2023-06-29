import path from 'node:path';

import { application } from './application.js';
import type { Helpers } from './helpers.js';
import { helpers } from './helpers.js';
import { shell } from './shell.js';

export type ApplicationConfig = ReturnType<typeof applicationConfig>;
type Scripts = { dev: string; build: string; setup: string; serve: string };

export const applicationConfig = () => {
  let name = '';
  const templates: string[] = [];
  const files = new Map<string, string>();
  const scripts: Scripts = { dev: 'npm run dev', serve: 'npm run serve', build: 'npm run build', setup: 'npm i' };
  const envFormatters = { public: (key: string) => key, private: (key: string) => key };
  // const envVars = { public: new Map<string, string>(), private: new Map<string, string>() };

  const self = {
    clone: () => {
      const clone = applicationConfig();
      clone.setName(name);
      clone.setEnvFormatter('public', envFormatters.public);
      clone.setEnvFormatter('private', envFormatters.private);
      templates.forEach(t => clone.useTemplate(t));
      Object.entries(scripts).forEach(([k, v]) => clone.addScript(k as keyof typeof scripts, v));
      files.forEach((v, k) => clone.addFile(k, () => v));
      return clone;
    },
    setName: (_name: string) => {
      name = _name;
      return self;
    },
    addFile: (filePath: string, cbOrPath: (helpers: Helpers) => string) => {
      files.set(filePath, cbOrPath(helpers));
      return self;
    },
    useTemplate: (path: string) => {
      templates.push(path);
      return self;
    },
    setEnvFormatter: (type: keyof typeof envFormatters, formatter: typeof envFormatters.public) => {
      envFormatters[type] = formatter;
      return self;
    },
    addScript: (name: keyof typeof scripts, cmd: string) => {
      if (!Object.keys(scripts).includes(name)) {
        throw new Error(`Invalid script name: ${name}, must be one of ${Object.keys(scripts).join(', ')}`);
      }
      scripts[name] = cmd;
      return self;
    },
    commit: async () => {
      console.log(shell.chalk.bgGreen(`Creating project "${name}"`));
      const TMP_DIR = path.join(process.cwd(), '.temp_integration');

      // const projName = `${name}__${Date.now()}__${hash()}`;
      const projName = `__${name}`;

      const appDir = path.resolve(TMP_DIR, projName);
      await shell.fs.rmSync(path.join(appDir, 'node_modules'), { recursive: true, force: true });

      // await fs.remove(appDir);

      // Copy template files
      for (const template of templates) {
        console.info(shell.chalk.yellow(`Copying template "${path.basename(template)}" -> ${appDir}`));
        await shell.fs.ensureDir(appDir);
        await shell.fs.copy(template, appDir, { overwrite: true, filter: path => !path.includes('node_modules') });
      }

      // Create individual files
      await Promise.all(
        [...files].map(async ([pathname, contents]) => {
          const dest = path.resolve(appDir, pathname);
          console.info(shell.chalk.yellow(`Copying file "${pathname}" -> ${dest}`));
          await shell.fs.ensureFile(dest);
          await shell.fs.writeFile(dest, contents);
        }),
      );

      return application(self, appDir);
    },
    setEnvWriter: () => {
      throw new Error('not implemented');
    },
    get name() {
      return name;
    },
    get scripts() {
      return scripts;
    },
    get envWriter() {
      const defaultWriter = async (appDir: string, publicVars: [string, string][], privateVars: [string, string][]) => {
        // Create env files
        const envDest = path.join(appDir, '.env');
        await shell.fs.ensureFile(envDest);
        console.log(shell.chalk.yellow(`Creating env file ".env" -> ${envDest}`));
        await shell.fs.writeFile(
          path.join(appDir, '.env'),
          publicVars.map(([k, v]) => `${envFormatters.public(k)}=${v}`).join('\n') +
            '\n' +
            privateVars.map(([k, v]) => `${envFormatters.private(k)}=${v}`).join('\n'),
        );
      };
      return defaultWriter;
    },
  };

  return self;
};
