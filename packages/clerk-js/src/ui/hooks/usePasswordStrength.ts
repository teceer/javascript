import type { PasswordSettingsData } from '@clerk/types';
import type { ZxcvbnResult } from '@zxcvbn-ts/core';

import type { zxcvbnFN } from '../utils';

export type PasswordStrength =
  | {
      state: 'excellent';
      result: ZxcvbnResult;
    }
  | {
      state: 'pass' | 'fail';
      keys: string[];
      result: ZxcvbnResult;
    };
export const createValidatePasswordStrength = ({
  min_zxcvbn_strength,
  onResult,
}: Pick<PasswordSettingsData, 'min_zxcvbn_strength'> & { onResult?: (res: ZxcvbnResult) => void }) => {
  return (zxcvbn: zxcvbnFN) =>
    (password: string): PasswordStrength => {
      const result = zxcvbn(password);
      onResult?.(result);

      if (result.score >= min_zxcvbn_strength && result.score < 3) {
        return {
          state: 'pass',
          keys: ['unstable__errors.zxcvbn.couldBeStronger'],
          result,
        };
      }
      if (result.score >= min_zxcvbn_strength) {
        return {
          state: 'excellent',
          result,
        };
      }

      return {
        state: 'fail',
        keys: [
          'unstable__errors.zxcvbn.notEnough',
          ...result.feedback.suggestions.map(er => `unstable__errors.zxcvbn.suggestions.${er}` as any),
        ],
        result,
      };
    };
};
// export const usePasswordStrength = ({ min_zxcvbn_strength }: Pick<PasswordSettingsData, 'min_zxcvbn_strength'>) => {
//   const [zxcvbnResult, setZxcvbnResult] = useState<ZxcvbnResult | undefined>(undefined);
//
//   const getScore = useMemo(() => {
//     return createValidatePasswordStrength({
//       min_zxcvbn_strength,
//       onResult: setZxcvbnResult,
//     });
//   }, []);
//
//   return {
//     getScore,
//     zxcvbnResult,
//   };
// };
