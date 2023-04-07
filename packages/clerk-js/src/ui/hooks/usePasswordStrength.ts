import { useCallback, useState } from 'react';
import type { ZXCVBNResult } from 'zxcvbn';

import { useEnvironment } from '../contexts';

type zxcvbnFN = (password: string, userInputs?: string[]) => ZXCVBNResult;

export const usePasswordStrength = (callbacks?: {
  onValidationFailed?: (validationErrorMessages: string[], errorMessage: string) => void;
  onValidationSuccess?: () => void;
}) => {
  const {
    userSettings: {
      passwordSettings: { min_zxcvbn_strength },
    },
  } = useEnvironment();

  const [zxcvbnResult, setZxcvbnResult] = useState<ZXCVBNResult | undefined>(undefined);

  const getScore = useCallback(
    (zxcvbn: zxcvbnFN) => (password: string) => {
      const result = zxcvbn(password);
      setZxcvbnResult(result);

      if (result.feedback.suggestions?.length > 0) {
        const errors = [...result.feedback.suggestions];
        if (result.score < min_zxcvbn_strength) {
          errors.unshift('Your passwords is not strong enough.');
        }
        callbacks?.onValidationFailed?.(errors, errors.join(' '));
      } else if (result.score >= min_zxcvbn_strength) {
        callbacks?.onValidationSuccess?.();
      }
    },
    [callbacks?.onValidationFailed, callbacks?.onValidationSuccess, min_zxcvbn_strength],
  );
  return {
    getScore,
    zxcvbnResult,
  };
};

export const scoreDescriptions = ['Very weak', 'Weak', 'Average', 'Strong', 'Very strong'];
