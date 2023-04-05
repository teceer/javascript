import type { ChangeEvent } from 'react';
import React, { forwardRef, useCallback } from 'react';
import type { ZXCVBNResult } from 'zxcvbn';

import { useEnvironment } from '../contexts';
import { descriptors, Flex, Input } from '../customizables';
import { usePasswordComplexity } from '../hooks';
import { EyeSlash } from '../icons';
import { useFormControl } from '../primitives/hooks';
import type { PropsOfComponent } from '../styledSystem';
import { common } from '../styledSystem';
import { IconButton } from './IconButton';

type zxcvbnFN = (password: string, userInputs?: string[]) => ZXCVBNResult;
const usePasswordStrengthMeter = () => {
  const {
    userSettings: {
      passwordSettings: { min_zxcvbn_strength },
    },
  } = useEnvironment();
  const formControlProps = useFormControl();

  const [zxcvbnResult, setZxcvbnResult] = React.useState<ZXCVBNResult | undefined>(undefined);

  const getScore = useCallback(
    (zxcvbn: zxcvbnFN) => (password: string) => {
      const result = zxcvbn(password);
      setZxcvbnResult(result);

      if (result.feedback.suggestions?.length > 0) {
        const errors = [...result.feedback.suggestions];
        if (result.score < min_zxcvbn_strength) {
          errors.unshift('Your passwords is not strong enough.');
        }
        formControlProps.setError?.(errors.join(' '));
      } else if (result.score >= min_zxcvbn_strength) {
        formControlProps.setSuccessful?.(true);
      }
    },
    [formControlProps, min_zxcvbn_strength],
  );
  return {
    getScore,
    zxcvbnResult,
  };
};

const scoreDescriptions = ['Very weak', 'Weak', 'Average', 'Strong', 'Very strong'];

type PasswordInputProps = PropsOfComponent<typeof Input> & {
  strengthMeter?: boolean;
  complexity?: boolean;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>((props, ref) => {
  const [hidden, setHidden] = React.useState(true);
  const { id, onChange, strengthMeter = false, complexity = false, ...rest } = props;
  const formControlProps = useFormControl();

  const {
    userSettings: { passwordSettings },
  } = useEnvironment();

  const { show_zxcvbn } = passwordSettings;

  const { getScore, zxcvbnResult } = usePasswordStrengthMeter();

  const { setPassword } = usePasswordComplexity(passwordSettings, {
    onValidationFailed: (_, errorMessage) => {
      formControlProps.setError?.(errorMessage);
    },
    onValidationSuccess: () => formControlProps.setSuccessful?.(true),
  });

  const __internalOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Lazy load `zxcvbn` on interaction
    if (show_zxcvbn) {
      void import('zxcvbn').then(module => module.default).then(zxcvbn => getScore(zxcvbn)(e.target.value));
    }

    if (complexity) {
      /**
       * Avoid introducing internal state, treat complexity calculation within callback.
       * This removes the overhead of keeping state of whether the component has been touched or not.
       */
      setPassword(e.target.value);
    }
    return onChange?.(e);
  };

  return (
    <Flex
      elementDescriptor={descriptors.formFieldInputGroup}
      direction='col'
      justify='center'
      sx={{ position: 'relative' }}
    >
      <Input
        {...rest}
        onChange={__internalOnChange}
        ref={ref}
        type={hidden ? 'password' : 'text'}
        sx={theme => ({ paddingRight: theme.space.$10 })}
      />

      {strengthMeter && show_zxcvbn && (
        <Flex
          sx={theme => ({
            position: 'absolute',
            top: -22,
            right: 0,
            marginBlock: 0,
            marginRight: theme.space.$3,
            ...common.textVariants(theme).smallMedium,
          })}
        >
          <span>{zxcvbnResult && scoreDescriptions[zxcvbnResult.score]}</span>
        </Flex>
      )}

      <IconButton
        elementDescriptor={descriptors.formFieldInputShowPasswordButton}
        iconElementDescriptor={descriptors.formFieldInputShowPasswordIcon}
        aria-label={`${hidden ? 'Show' : 'Hide'} password`}
        variant='ghostIcon'
        tabIndex={-1}
        colorScheme={hidden ? 'neutral' : 'primary'}
        onClick={() => setHidden(s => !s)}
        sx={theme => ({
          position: 'absolute',
          right: 0,
          marginRight: theme.space.$3,
          ...(hidden && { color: theme.colors.$blackAlpha400 }),
        })}
        icon={EyeSlash}
      />
    </Flex>
  );
});
