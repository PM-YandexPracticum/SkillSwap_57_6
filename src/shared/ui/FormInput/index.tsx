import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './FormInput.module.css'

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  endAdornment?: ReactNode
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(function FormInput(
  {
    label,
    hint,
    error,
    endAdornment,
    id,
    className,
    disabled,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    ...inputProps
  },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const hasError = Boolean(error?.trim())
  const descriptionIds = [describedBy, hint ? hintId : undefined, hasError ? errorId : undefined]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.wrapper}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}

      <div
        className={styles.control}
        data-error={hasError || undefined}
        data-disabled={disabled || undefined}
      >
        <input
          {...inputProps}
          ref={ref}
          id={inputId}
          className={[styles.input, className].filter(Boolean).join(' ')}
          disabled={disabled}
          aria-describedby={descriptionIds || undefined}
          aria-invalid={hasError ? true : ariaInvalid}
        />
        {endAdornment != null && <div className={styles.adornment}>{endAdornment}</div>}
      </div>

      {hint && (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      )}
      {hasError && (
        <p className={styles.error} id={errorId}>
          {error}
        </p>
      )}
    </div>
  )
})
