import React from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import type { Credentials, AuthMode } from '../model/Credentials'
import { validateCredentials } from '../model/Credentials'
import styles from './CredentialForm.module.css' // импорт CSS Modules

interface CredentialFormProps {
  mode: AuthMode
  initialValues?: Partial<Credentials>
  onSubmit: (values: Credentials) => void | Promise<void>
  externalError?: string | null
  disabled?: boolean
}

export const CredentialForm: React.FC<CredentialFormProps> = ({
  mode,
  initialValues,
  onSubmit,
  externalError,
  disabled = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
    clearErrors: clearFormErrors,
  } = useForm<Credentials>({
    defaultValues: initialValues ?? { email: '', password: '' },
  })

  const isSubmitDisabled = isSubmitting || disabled

  const onValidSubmit: SubmitHandler<Credentials> = async (values) => {
    clearFormErrors()
    const formErrors = validateCredentials(values, mode)

    if (Object.keys(formErrors).length > 0) {
      Object.entries(formErrors).forEach(([field, message]) => {
        setFormError(field as keyof Credentials, { type: 'manual', message })
      })
      return
    }

    const normalized: Credentials = {
      email: values.email.trim().toLowerCase(),
      password: values.password,
    }

    try {
      await onSubmit(normalized)
    } catch (e) {
      if (externalError === null) {
        setFormError('root', { type: 'external', message: 'Произошла ошибка при отправке' })
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onValidSubmit)} noValidate>
      {/* Email */}
      <div className={styles.formGroup}>
        <label htmlFor="email" className={styles.label}>
          Email
        </label>
        <input
          id="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
          type="email"
          autoComplete="email"
          placeholder="Введите email"
          disabled={disabled}
          className={`${styles.input} ${errors.email ? styles.input + ' ' + styles.error : ''}`}
        />
        {errors.email && (
          <span id="email-error" className={styles.errorMessage}>
            {errors.email.message}
          </span>
        )}
      </div>

      {/* Password */}
      <div className={styles.formGroup}>
        <label htmlFor="password" className={styles.label}>
          {mode === 'login' ? 'Пароль' : 'Придумайте пароль'}
        </label>
        <input
          id="password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          placeholder={mode === 'login' ? 'Введите пароль' : 'Минимум 8 символов'}
          disabled={disabled}
          className={`${styles.input} ${errors.password ? styles.input + ' ' + styles.error : ''}`}
        />
        {errors.password && (
          <span id="password-error" className={styles.errorMessage}>
            {errors.password.message}
          </span>
        )}
      </div>

      {externalError && <div className={styles.externalError}>{externalError}</div>}

      <button
        type="submit"
        disabled={isSubmitDisabled}
        aria-busy={isSubmitting}
        className={styles.submitButton}
      >
        {isSubmitting ? 'Отправка...' : mode === 'login' ? 'Войти' : 'Далее'}
      </button>
    </form>
  )
}
