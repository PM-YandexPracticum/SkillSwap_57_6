import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './FormInput.module.css'

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  endAdornment?: ReactNode
  wrapperClassName?: string
  controlClassName?: string
  adornmentClassName?: string
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(function FormInput(
  {
    label,
    hint,
    error,
    endAdornment,
    id,
    className,
    wrapperClassName,
    controlClassName,
    adornmentClassName,
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
    <div className={[styles.wrapper, wrapperClassName].filter(Boolean).join(' ')}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}

      <div
        className={[styles.control, controlClassName].filter(Boolean).join(' ')}
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
        {endAdornment != null && (
          <div className={[styles.adornment, adornmentClassName].filter(Boolean).join(' ')}>
            {endAdornment}
          </div>
        )}
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
