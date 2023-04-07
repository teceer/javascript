import { useCallback, useState } from 'react';

import { useEnvironment } from '../contexts';
import { localizationKeys, useLocalizations } from '../localization';

type zxcvbnFN = (password: string, userInputs?: (string | number)[]) => any;

export const usePasswordStrength = (callbacks?: {
  onValidationFailed?: (validationErrorMessages: string[], errorMessage: string) => void;
  onValidationSuccess?: () => void;
}) => {
  const {
    userSettings: {
      passwordSettings: { min_zxcvbn_strength },
    },
  } = useEnvironment();

  const { t } = useLocalizations();
  const [zxcvbnResult, setZxcvbnResult] = useState<any | undefined>(undefined);

  const getScore = useCallback(
    (zxcvbn: zxcvbnFN) => (password: string) => {
      const result = zxcvbn(password);
      setZxcvbnResult(result);

      if (result.feedback.suggestions?.length > 0) {
        const errors = [...result.feedback.suggestions];
        if (result.score < min_zxcvbn_strength) {
          errors.unshift('Your passwords is not strong enough.');
        }
        const fErrors = errors.map(er => {
          console.log('wowo', er, t(localizationKeys(`zxcvbn.suggestions.${er}` as any)));
          return t(localizationKeys(`zxcvbn.suggestions.${er}` as any));
        });
        callbacks?.onValidationFailed?.(fErrors, fErrors.join(' '));
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
