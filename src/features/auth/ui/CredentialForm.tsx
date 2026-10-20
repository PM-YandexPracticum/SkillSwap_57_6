import React from 'react';
import {
  useForm,
  SubmitHandler,
  Path,
} from 'react-hook-form';
import type { Credentials, AuthMode } from '../model/Credentials';
import { validateCredentials } from '../model/Credentials';
import styles from './CredentialForm.module.css';

import { FormInput } from '@/shared/ui/FormInput';
import { PasswordInput } from '@/shared/ui/PasswordInput';
import { Link, useLocation } from 'react-router-dom';

interface CredentialFormProps {
  mode: AuthMode;
  initialValues?: Partial<Credentials>;
  onSubmit: (values: Credentials) => Promise<void>;
  externalError?: string | null;
  returnTo?: string;
  disabled?: boolean;
  // Опционально: если родителю нужно знать об ошибках отправки
  onError?: (error: unknown) => void;
}

export const CredentialForm: React.FC<CredentialFormProps> = ({
  mode,
  initialValues,
  onSubmit,
  externalError,
  returnTo,
  disabled = false,
  onError,
}) => {
  const location = useLocation();
  const inferredReturnTo = returnTo ?? (location.state?.returnTo as string | undefined);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
    setError,
  } = useForm<Credentials>({
    defaultValues: initialValues ?? { email: '', password: '' },
  });

  const emailField = register('email');
  const passwordField = register('password');

  // Флаг для дополнительной защиты от повторной отправки (программный submit и т.п.)
  const [isProcessing, setIsProcessing] = React.useState(false);

  const hasFieldErrors = Object.keys(errors).some(
    (key) => key !== 'root' && errors[key as keyof typeof errors]?.message
  );

  // Кнопка блокируется, если: идёт отправка, принудительно disabled, ИЛИ есть ошибки полей
  const isSubmitDisabled = isProcessing || isSubmitting || disabled || hasFieldErrors;

  const onValidSubmit: SubmitHandler<Credentials> = async (values) => {
    // Защита от повторного запуска при программном submit
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // 1. Синхронная бизнес-валидация
      const formErrors = validateCredentials(values, mode);
      clearErrors();

      if (Object.keys(formErrors).length > 0) {
        Object.entries(formErrors).forEach(([field, message]) => {
          const fieldName = field as Path<Credentials>;
          setError(fieldName, { type: 'manual', message });
        });
        return;
      }

      // 2. Нормализация данных
      const normalized: Credentials = {
        email: values.email.trim().toLowerCase(),
        password: values.password,
      };

      // 3. Асинхронная отправка
      await onSubmit(normalized);

      // Если всё ок — можно сбросить externalError, если он управлялся снаружи
    } catch (e) {
      console.error('Auth submit error:', e);

      setError('root', {
        type: 'server',
        message: externalError ?? 'Произошла ошибка при отправке формы. Попробуйте ещё раз.',
      });

      // Вызываем колбэк для родителя, если он есть
      onError?.(e);

    } finally {
      // Сбрасываем флаг даже при ошибке, чтобы можно было попробовать снова
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onValidSubmit)} noValidate>
      <div className={styles.formGroup}>
        <FormInput
          label="Email"
          placeholder="Введите email"
          disabled={disabled}
          error={errors.email?.message}
          autoComplete="email"
          ref={emailField.ref}
          onChange={emailField.onChange}
          onBlur={emailField.onBlur}
          name={emailField.name}
        />
      </div>

      <div className={styles.formGroup}>
        <PasswordInput
          label={mode === 'login' ? 'Пароль' : 'Придумайте пароль'}
          placeholder={mode === 'login' ? 'Введите пароль' : 'Минимум 8 символов'}
          disabled={disabled}
          error={errors.password?.message}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          ref={passwordField.ref}
          onChange={passwordField.onChange}
          onBlur={passwordField.onBlur}
          name={passwordField.name}
        />
      </div>

      {externalError && (
        <div className={styles.externalError} role="alert">
          {externalError}
        </div>
      )}

      {errors.root?.message && (
        <div className={styles.externalError} role="alert">
          {errors.root.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitDisabled}
        aria-disabled={isSubmitDisabled}
        aria-busy={isProcessing || isSubmitting}
        className={styles.submitButton}
      >
        {isProcessing || isSubmitting ? 'Отправка...' : mode === 'login' ? 'Войти' : 'Далее'}
      </button>

      <p className={styles.switchLinkBlock}>
        {mode === 'login' ? (
          <>
            Нет аккаунта?{' '}
            <Link
              to="/register"
              state={{ returnTo: inferredReturnTo }}
              className={styles.link}
            >
              Зарегистрироваться
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{' '}
            <Link
              to="/login"
              state={{ returnTo: inferredReturnTo }}
              className={styles.link}
            >
              Войти
            </Link>
          </>
        )}
      </p>
    </form>
  );
};
