import type { ChildProcess } from 'node:child_process';

import { default as _chalk } from 'chalk';
import type { Options } from 'execa';
// @ts-ignore
import execa from 'execa';
import * as _fs from 'fs-extra';
import _getPort from 'get-port';

type ChunkLogger = (chunk: Buffer) => void;
export const chunkLogger = (log: (val: string) => string, prefix: string) => (chunk: Buffer) => {
  chunk
    .toString()
    .trim()
    .split(/\n/)
    .forEach(l => {
      console.log(log(`[${prefix}]`), l);
    });
};

export const run = (cmd: string, options: Options & { logger: ChunkLogger }) => {
  const { logger, ...opts } = options || {};
  const [file, ...args] = cmd.split(' ').filter(Boolean);
  const proc = execa(file, args, opts);
  proc.stdout.on('data', logger);
  proc.stderr.on('data', logger);
  return proc;
};

export const getPort = _getPort;
export const chalk = _chalk;
export const fs = _fs;

export const range = (start: number, stop: number, step = 1): any =>
  Array(Math.ceil((stop - start) / step))
    .fill(start)
    .map((x, y) => x + y * step);

const createWaitForIdle = (opts?: { delayInMs: number }) => {
  const { delayInMs = 3000 } = opts || {};
  let id;
  let idler;

  const waitForIdle = new Promise(resolve => {
    idler = () => {
      clearTimeout(id);
      id = setTimeout(resolve, delayInMs);
    };
    idler();
  });

  return { idler, waitForIdle };
};

export const waitForIdleProcess = (cp: ChildProcess, opts?: Parameters<typeof createWaitForIdle>[0]) => {
  const { idler, waitForIdle } = createWaitForIdle(opts);
  cp.stdout.on('data', idler);
  cp.stderr.on('data', idler);
  return waitForIdle;
};
