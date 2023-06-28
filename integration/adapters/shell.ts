import * as zx from 'zx';

export const shell = {
  ...zx,
  run: (cmd: string, ...args: string[]) => {
    // @ts-ignore
    return zx.$([cmd, ...args]);
  },
};
