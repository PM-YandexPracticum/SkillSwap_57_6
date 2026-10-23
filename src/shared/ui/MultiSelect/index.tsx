import { useEffect, useId, useRef, useState } from 'react'
import styles from './MultiSelect.module.css'

export interface MultiSelectProps {
  options: readonly string[]
  value: string[]
  onChange: (value: string[]) => void
  label?: string
  error?: string
  disabled?: boolean
  required?: boolean
  maxSelected?: number
}

export function MultiSelect({
  options,
  value,
  onChange,
  label = 'Выбор вариантов',
  error,
  disabled,
  required,
  maxSelected,
}: MultiSelectProps) {
  const id = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const uniqueOptions = [...new Set(options)]
  const selected = [...new Set(value)].filter((option) => uniqueOptions.includes(option))
  const hasError = Boolean(error?.trim())
  const descriptionIds = [required && `${id}-required`, hasError && `${id}-error`]
    .filter(Boolean)
    .join(' ')
  const limitReached = maxSelected !== undefined && selected.length >= maxSelected

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  const toggleOption = (option: string) => {
    if (disabled || !uniqueOptions.includes(option)) return
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option))
    } else if (!limitReached) {
      onChange([...selected, option])
    }
  }

  return (
    <div
      className={styles.wrapper}
      role="group"
      aria-labelledby={`${id}-label`}
      aria-describedby={descriptionIds || undefined}
      aria-invalid={hasError || undefined}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault()
          event.stopPropagation()
          setOpen(false)
          buttonRef.current?.focus()
        }
      }}
    >
      <label className={styles.label} id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      {required && (
        <p className={styles.hint} id={`${id}-required`}>
          Обязательное поле: выберите хотя бы один вариант
        </p>
      )}
      <div className={styles.control}>
        <button
          ref={buttonRef}
          id={id}
          className={styles.trigger}
          type="button"
          disabled={disabled}
          onClick={() => setOpen((previous) => !previous)}
          aria-labelledby={`${id}-label ${id}-value`}
          aria-expanded={open && !disabled}
          aria-controls={`${id}-options`}
          aria-describedby={descriptionIds || undefined}
          aria-invalid={hasError || undefined}
          data-error={hasError || undefined}
        >
          <span id={`${id}-value`} className={styles.summary}>
            {selected.length ? selected.join(', ') : 'Выберите варианты'}
          </span>
          <span className={styles.chevron} aria-hidden="true" />
        </button>
        <div className={styles.panel} id={`${id}-options`} hidden={!open || disabled}>
          {uniqueOptions.length ? (
            uniqueOptions.map((option, index) => (
              <label className={styles.option} key={option} htmlFor={`${id}-option-${index}`}>
                <input
                  className={styles.checkbox}
                  id={`${id}-option-${index}`}
                  type="checkbox"
                  value={option}
                  checked={selected.includes(option)}
                  disabled={disabled || (limitReached && !selected.includes(option))}
                  aria-describedby={descriptionIds || undefined}
                  aria-invalid={hasError || undefined}
                  onChange={() => toggleOption(option)}
                />
                <span>{option}</span>
              </label>
            ))
          ) : (
            <p>Нет доступных вариантов</p>
          )}
        </div>
      </div>
      {hasError && (
        <p className={styles.error} id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}
