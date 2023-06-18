import { noop } from '@clerk/shared';
import type { PasswordSettingsData } from '@clerk/types';
import { useCallback, useMemo, useRef } from 'react';

import { localizationKeys, useLocalizations } from '../localization';
import type { FormControlState } from '../utils';
import { loadZxcvbn } from '../utils';
import { usePasswordComplexity } from './usePasswordComplexity';
import { usePasswordStrength } from './usePasswordStrength';

type UsePasswordConfig = PasswordSettingsData & {
  /**
   * @deprecated
   */
  strengthMeter: boolean;
  /**
   * @deprecated
   */
  complexity: boolean;
  validatePassword: boolean;
};

type UsePasswordCbs = {
  onValidationFailed?: (errorMessage: string | undefined) => void;
  onValidationSuccess?: () => void;
  onValidationWarning?: (warningMessage: string) => void;
  onValidationComplexity?: (b: boolean) => void;
};

export const MIN_PASSWORD_LENGTH = 8;

// const createValidatePassword = (config: UsePasswordConfig, callbacks?: UsePasswordCbs) => {
//   const {
//     onValidationFailed = noop,
//     onValidationSuccess = noop,
//     onValidationWarning = noop,
//     onValidationComplexity = noop,
//   } = callbacks || {};
//
//   const reportSuccessOrError = (error: string | undefined, warning: string | undefined) => {
//     if (error) {
//       onValidationFailed(error);
//     } else if (warning) {
//       onValidationWarning(warning);
//     } else {
//       onValidationSuccess();
//     }
//   };
//
//   const validatePassword = (password: string) => {
//     let zxcvbnError = '';
//     let complexityError = '';
//     let zxcvbnWarning = '';
//
//     if (!validatePassword) {
//       return;
//     }
//
//     /**
//      * Validate Complexity
//      */
//     const { failedValidationsText } = getComplexity(_password);
//     onValidationComplexity(!failedValidationsText);
//     complexityError = failedValidationsText;
//
//     /**
//      * Validate score
//      */
//     if (show_zxcvbn) {
//       /**
//        * Lazy load zxcvbn without preventing a complexityError to be thrown if it exists
//        */
//       void loadZxcvbn().then(zxcvbn => {
//         hasZxcvbnDownloadRef.current = true;
//         const setPasswordScore = getScore(zxcvbn);
//         const { errorText, warningText } = setPasswordScore(_password);
//         zxcvbnError = errorText;
//         zxcvbnWarning = warningText;
//         reportSuccessOrError(complexityError || zxcvbnError, zxcvbnWarning);
//       });
//
//       if (!hasZxcvbnDownloadRef.current && complexityError) {
//         onValidationFailed(complexityError);
//       }
//       return;
//     }
//     reportSuccessOrError(complexityError || zxcvbnError, zxcvbnWarning);
//   }
//   }
//
// };

export const usePassword = (config: UsePasswordConfig, callbacks?: UsePasswordCbs) => {
  const {
    onValidationFailed = noop,
    onValidationSuccess = noop,
    onValidationWarning = noop,
    onValidationComplexity = noop,
  } = callbacks || {};
  const { show_zxcvbn, validatePassword } = config;
  const { getComplexity } = usePasswordComplexity(config);
  const { getScore } = usePasswordStrength();
  const hasZxcvbnDownloadRef = useRef(false);

  const reportSuccessOrError = useCallback(
    (error: string | undefined, warning: string | undefined) => {
      if (error) {
        onValidationFailed(error);
      } else if (warning) {
        onValidationWarning(warning);
      } else {
        onValidationSuccess();
      }
    },
    [callbacks],
  );

  const setPassword = useCallback(
    async (_password: string) => {
      let zxcvbnError = '';
      let complexityError = '';
      let zxcvbnWarning = '';

      if (!validatePassword) {
        return;
      }

      /**
       * Validate Complexity
       */
      const { failedValidationsText } = getComplexity(_password);
      onValidationComplexity(!failedValidationsText);
      complexityError = failedValidationsText;

      /**
       * Validate score
       */
      if (show_zxcvbn) {
        /**
         * Lazy load zxcvbn without preventing a complexityError to be thrown if it exists
         */
        void loadZxcvbn().then(zxcvbn => {
          hasZxcvbnDownloadRef.current = true;
          const setPasswordScore = getScore(zxcvbn);
          const { errorText, warningText } = setPasswordScore(_password);
          zxcvbnError = errorText;
          zxcvbnWarning = warningText;
          reportSuccessOrError(complexityError || zxcvbnError, zxcvbnWarning);
        });

        if (!hasZxcvbnDownloadRef.current && complexityError) {
          onValidationFailed(complexityError);
        }
        return;
      }
      reportSuccessOrError(complexityError || zxcvbnError, zxcvbnWarning);
    },
    [onValidationFailed, onValidationSuccess, onValidationComplexity, show_zxcvbn, getScore, getComplexity],
  );

  return {
    setPassword,
    getScore,
  };
};

export const useConfirmPassword = ({
  passwordField,
  confirmPasswordField,
}: {
  passwordField: FormControlState;
  confirmPasswordField: FormControlState;
}) => {
  const { t } = useLocalizations();
  const checkPasswordMatch = useCallback(
    (confirmPassword: string) =>
      passwordField.value.trim().length >= MIN_PASSWORD_LENGTH && passwordField.value === confirmPassword,
    [passwordField.value],
  );

  const isPasswordMatch = useMemo(() => checkPasswordMatch(confirmPasswordField.value), [confirmPasswordField.value]);

  const displayConfirmPasswordFeedback = useCallback(
    (password: string) => {
      if (checkPasswordMatch(password)) {
        confirmPasswordField.setSuccessful(t(localizationKeys('formFieldError__matchingPasswords')));
      } else {
        confirmPasswordField.setError(t(localizationKeys('formFieldError__notMatchingPasswords')));
      }
    },
    [confirmPasswordField.setError, confirmPasswordField.setSuccessful, t, checkPasswordMatch],
  );

  return {
    displayConfirmPasswordFeedback,
    isPasswordMatch,
  };
};
