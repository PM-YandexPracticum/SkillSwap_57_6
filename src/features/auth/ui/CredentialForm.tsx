import React from 'react'
import { useForm, SubmitHandler, Path } from 'react-hook-form'
import type { Credentials, AuthMode } from '../model/Credentials'
import { validateCredentials } from '../model/Credentials'
import formStyles from '@/shared/styles/formControls.module.css'
import styles from './CredentialForm.module.css'

import { FormInput } from '@/shared/ui/FormInput'
import { PasswordInput } from '@/shared/ui/PasswordInput'
import { Link, useLocation } from 'react-router-dom'
import appleIcon from '@/shared/assets/icons/apple.svg'
import googleIcon from '@/shared/assets/icons/google.svg'

interface CredentialFormProps {
  mode: AuthMode
  initialValues?: Partial<Credentials>
  onSubmit: (values: Credentials) => Promise<void>
  externalError?: string | null
  returnTo?: string
  disabled?: boolean
  submitLabel?: string
  // Опционально: если родителю нужно знать об ошибках отправки
  onError?: (error: unknown) => void
}

export const CredentialForm: React.FC<CredentialFormProps> = ({
  mode,
  initialValues,
  onSubmit,
  externalError,
  returnTo,
  disabled = false,
  submitLabel,
  onError,
}) => {
  const location = useLocation()
  const inferredReturnTo = returnTo ?? (location.state?.returnTo as string | undefined)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
    setError,
  } = useForm<Credentials>({
    defaultValues: initialValues ?? { email: '', password: '' },
  })

  const emailField = register('email')
  const passwordField = register('password')

  // Флаг для дополнительной защиты от повторной отправки (программный submit и т.п.)
  const [isProcessing, setIsProcessing] = React.useState(false)

  const hasFieldErrors = Object.keys(errors).some(
    (key) => key !== 'root' && errors[key as keyof typeof errors]?.message,
  )

  // Кнопка блокируется, если: идёт отправка, принудительно disabled, ИЛИ есть ошибки полей
  const isSubmitDisabled = isProcessing || isSubmitting || disabled || hasFieldErrors

  const onValidSubmit: SubmitHandler<Credentials> = async (values) => {
    // Защита от повторного запуска при программном submit
    if (isProcessing) return
    setIsProcessing(true)

    try {
      // 1. Синхронная бизнес-валидация
      const formErrors = validateCredentials(values, mode)
      clearErrors()

      if (Object.keys(formErrors).length > 0) {
        Object.entries(formErrors).forEach(([field, message]) => {
          const fieldName = field as Path<Credentials>
          setError(fieldName, { type: 'manual', message })
        })
        return
      }

      // 2. Нормализация данных
      const normalized: Credentials = {
        email: values.email.trim().toLowerCase(),
        password: values.password,
      }

      // 3. Асинхронная отправка
      await onSubmit(normalized)

      // Если всё ок — можно сбросить externalError, если он управлялся снаружи
    } catch (e) {
      console.error('Auth submit error:', e)

      setError('root', {
        type: 'server',
        message: externalError ?? 'Произошла ошибка при отправке формы. Попробуйте ещё раз.',
      })

      // Вызываем колбэк для родителя, если он есть
      onError?.(e)
    } finally {
      // Сбрасываем флаг даже при ошибке, чтобы можно было попробовать снова
      setIsProcessing(false)
    }
  }

  return (
    <form className={formStyles.form} onSubmit={handleSubmit(onValidSubmit)} noValidate>
      {mode === 'register' && (
        <>
          <div className={formStyles.socialActions}>
            <button className={`${formStyles.button} ${formStyles.socialButton}`} type="button">
              <img src={googleIcon} alt="" aria-hidden="true" />
              <span>Продолжить с Google</span>
            </button>
            <button className={`${formStyles.button} ${formStyles.socialButton}`} type="button">
              <img src={appleIcon} alt="" aria-hidden="true" />
              <span>Продолжить с Apple</span>
            </button>
          </div>
          <div className={formStyles.divider} aria-label="Или">
            <span>или</span>
          </div>
        </>
      )}

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
          label="Пароль"
          placeholder={mode === 'login' ? 'Введите пароль' : 'Придумайте надёжный пароль'}
          hint={
            mode === 'register' ? 'Пароль должен содержать не\u00a0менее 8\u00a0знаков' : undefined
          }
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
        <div className={formStyles.error} role="alert">
          {externalError}
        </div>
      )}

      {errors.root?.message && (
        <div className={formStyles.error} role="alert">
          {errors.root.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitDisabled}
        aria-disabled={isSubmitDisabled}
        aria-busy={isProcessing || isSubmitting}
        className={`${formStyles.button} ${formStyles.primaryButton} ${styles.submitButton}`}
      >
        {isProcessing || isSubmitting
          ? 'Отправка...'
          : (submitLabel ?? (mode === 'login' ? 'Войти' : 'Далее'))}
      </button>

      <p
        className={`${styles.switchLinkBlock} ${mode === 'register' ? styles.registerSwitch : ''}`}
      >
        {mode === 'login' ? (
          <>
            Нет аккаунта?{' '}
            <Link to="/register" state={{ returnTo: inferredReturnTo }} className={styles.link}>
              Зарегистрироваться
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{' '}
            <Link to="/login" state={{ returnTo: inferredReturnTo }} className={styles.link}>
              Войти
            </Link>
          </>
        )}
      </p>
    </form>
  )
}
