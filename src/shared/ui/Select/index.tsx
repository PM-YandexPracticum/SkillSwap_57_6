import { forwardRef, useId } from 'react'
import type { SelectHTMLAttributes } from 'react'
import styles from './Select.module.css'

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'value' | 'defaultValue' | 'onChange' | 'multiple' | 'size' | 'children'
> {
  options: readonly string[]
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  error?: string
  getOptionLabel?: (value: string) => string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    options,
    value,
    onChange,
    label,
    placeholder = 'Выберите вариант',
    error,
    getOptionLabel,
    id,
    className,
    disabled,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    ...selectProps
  },
  ref,
) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const errorId = `${selectId}-error`
  const hasError = Boolean(error?.trim())
  const selectedValue = options.includes(value) ? value : ''
  const descriptionIds = [describedBy, hasError ? errorId : undefined].filter(Boolean).join(' ')

  return (
    <div className={styles.wrapper}>
      {label && (
        <label className={styles.label} htmlFor={selectId}>
          {label}
        </label>
      )}
      <div
        className={styles.control}
        data-error={hasError || undefined}
        data-disabled={disabled || undefined}
      >
        <select
          {...selectProps}
          ref={ref}
          id={selectId}
          className={[styles.select, className].filter(Boolean).join(' ')}
          value={selectedValue}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          data-placeholder={selectedValue === '' || undefined}
          aria-describedby={descriptionIds || undefined}
          aria-invalid={hasError ? true : ariaInvalid}
        >
          <option value="">{placeholder}</option>
          {options
            .filter((option) => option !== '')
            .map((option) => (
              <option key={option} value={option}>
                {getOptionLabel ? getOptionLabel(option) : option}
              </option>
            ))}
        </select>
      </div>
      {hasError && (
        <p className={styles.error} id={errorId}>
          {error}
        </p>
      )}
    </div>
  )
})
