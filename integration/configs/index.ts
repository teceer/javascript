import { instances } from './envs';
import { next } from './next';
import { react } from './react';

export const configs = {
  next,
  react,
  instances,
} as const;
