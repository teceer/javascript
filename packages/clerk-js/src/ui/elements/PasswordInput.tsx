import type { ChangeEvent } from 'react';
import { useCallback, useRef } from 'react';
import React, { forwardRef } from 'react';

import { useEnvironment } from '../contexts';
import { descriptors, Flex, Input } from '../customizables';
import { scoreDescriptions, usePasswordComplexity, usePasswordStrength } from '../hooks';
import { EyeSlash } from '../icons';
import { useFormControl } from '../primitives/hooks';
import type { PropsOfComponent } from '../styledSystem';
import { common } from '../styledSystem';
import { IconButton } from './IconButton';

type PasswordInputProps = PropsOfComponent<typeof Input> & {
  strengthMeter?: boolean;
  complexity?: boolean;
};

// TODO: Refactor this logic
const useComplexityOverStrength = ({ strengthMeter }: { strengthMeter: boolean; complexity: boolean }) => {
  const formControlProps = useFormControl();
  const hasComplexityError = useRef(false);
  const hasComplexitySuccess = useRef(false);
  return {
    setStrengthSuccess: useCallback(() => {
      if (!hasComplexityError.current) {
        formControlProps.setSuccessful?.(true);
      }
    }, []),

    setStrengthError: useCallback((errorMessage: string) => {
      if (!hasComplexityError.current) {
        formControlProps.setError?.(errorMessage);
      }
    }, []),

    setComplexityError: useCallback((errorMessage: string) => {
      hasComplexityError.current = !!errorMessage;
      formControlProps.setError?.(errorMessage);
    }, []),

    setComplexitySuccess: useCallback(() => {
      hasComplexityError.current = false;
      hasComplexitySuccess.current = true;
      if (!strengthMeter) {
        formControlProps.setSuccessful?.(true);
      }
    }, []),
  };
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>((props, ref) => {
  const [hidden, setHidden] = React.useState(true);
  const { id, onChange, strengthMeter = false, complexity = false, ...rest } = props;

  const { setStrengthError, setComplexityError, setStrengthSuccess, setComplexitySuccess } = useComplexityOverStrength({
    complexity,
    strengthMeter,
  });

  const {
    userSettings: { passwordSettings },
  } = useEnvironment();

  const { show_zxcvbn } = passwordSettings;

  const { getScore, zxcvbnResult } = usePasswordStrength({
    onValidationFailed: (_, errorMessage) => {
      setStrengthError(errorMessage);
    },
    onValidationSuccess: () => setStrengthSuccess(),
  });

  const { setPassword } = usePasswordComplexity(passwordSettings, {
    onValidationFailed: (_, errorMessage) => {
      setComplexityError(errorMessage);
    },
    onValidationSuccess: () => setComplexitySuccess(),
  });

  const __internalOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Lazy load `zxcvbn` on interaction
    if (strengthMeter && show_zxcvbn) {
      void Promise.all([
        import('@zxcvbn-ts/core'),
        import('@zxcvbn-ts/language-common'),
        import('@zxcvbn-ts/language-en'),
      ])
        .then(([core, zxcvbnCommonPackage, zxcvbnEnPackage]) => {
          core.zxcvbnOptions.setOptions({
            dictionary: {
              ...zxcvbnCommonPackage.default.dictionary,
              ...zxcvbnEnPackage.default.dictionary,
            },
            graphs: zxcvbnCommonPackage.default.adjacencyGraphs,
            translations: zxcvbnEnPackage.default.translations,
          });
          return core.zxcvbn;
        })
        .then(zxcvbn => getScore(zxcvbn)(e.target.value));
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
