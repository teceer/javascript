import { fileURLToPath } from 'node:url';

export const templates = {
  'next-app-router': fileURLToPath(new URL('./next-app-router', import.meta.url)),
  'react-cra': fileURLToPath(new URL('./react-cra', import.meta.url)),
  'react-vite': fileURLToPath(new URL('./react-vite', import.meta.url)),
} as const;

if (new Set([...Object.values(templates)]).size !== Object.values(templates).length) {
  throw new Error('Duplicate template paths');
}

export type Template = keyof typeof templates;
