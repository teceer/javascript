import fs from 'fs-extra';
import { fileURLToPath } from 'node:url';

const jsonPath = fileURLToPath(new URL('.env.json', import.meta.url));
const envLocalPath = fileURLToPath(new URL('.env.local', import.meta.url));
const json = await fs.readJSON(jsonPath);
await fs.ensureFile(envLocalPath);
await fs.writeFile(envLocalPath, `INTEGRATION_INSTANCE_KEYS='${JSON.stringify(json)}'`);
