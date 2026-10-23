import { forwardRef, useEffect, useId, useRef, useState } from 'react'
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
  customDropdown?: boolean
  searchable?: boolean
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
    customDropdown = false,
    searchable = false,
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
  const wrapperRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const errorId = `${selectId}-error`
  const hasError = Boolean(error?.trim())
  const selectedValue = options.includes(value) ? value : ''
  const descriptionIds = [describedBy, hasError ? errorId : undefined].filter(Boolean).join(' ')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(Math.max(0, options.indexOf(value)))
  const [searchTerm, setSearchTerm] = useState('')
  const selectedLabel = selectedValue
    ? (getOptionLabel?.(selectedValue) ?? selectedValue)
    : placeholder
  const availableOptions = options.filter(
    (option) =>
      option !== '' &&
      (!searchable ||
        (getOptionLabel?.(option) ?? option)
          .toLocaleLowerCase()
          .includes(searchTerm.toLocaleLowerCase())),
  )
  const dropdownOptions = searchable ? availableOptions : ['', ...availableOptions]

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  useEffect(() => {
    if (!open) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [open])

  useEffect(() => {
    if (open && searchable) searchInputRef.current?.focus()
  }, [open, searchable])

  const selectOption = (option: string) => {
    onChange(option)
    setOpen(false)
    setSearchTerm('')
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      {label && (
        <label className={styles.label} htmlFor={selectId}>
          {label}
        </label>
      )}
      <div
        className={styles.control}
        data-error={hasError || undefined}
        data-disabled={disabled || undefined}
        data-open={(customDropdown && open) || undefined}
        data-custom-dropdown={customDropdown || undefined}
      >
        {customDropdown ? (
          <>
            <select
              {...selectProps}
              ref={ref}
              className={styles.visuallyHidden}
              value={selectedValue}
              onChange={(event) => onChange(event.target.value)}
              disabled={disabled}
              tabIndex={-1}
              aria-hidden="true"
              data-placeholder={selectedValue === '' || undefined}
              aria-describedby={descriptionIds || undefined}
              aria-invalid={hasError ? true : ariaInvalid}
            >
              <option value="">{placeholder}</option>
              {availableOptions.map((option) => (
                <option key={option} value={option}>
                  {getOptionLabel ? getOptionLabel(option) : option}
                </option>
              ))}
            </select>
            {searchable && open ? (
              <div className={styles.searchControl}>
                <input
                  ref={searchInputRef}
                  className={[styles.searchInput, className].filter(Boolean).join(' ')}
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value)
                    setActiveIndex(0)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault()
                      setActiveIndex((index) => Math.min(index + 1, availableOptions.length - 1))
                    } else if (event.key === 'ArrowUp') {
                      event.preventDefault()
                      setActiveIndex((index) => Math.max(index - 1, 0))
                    } else if (event.key === 'Escape') {
                      setOpen(false)
                      setSearchTerm('')
                    } else if (event.key === 'Enter') {
                      event.preventDefault()
                      const activeOption = availableOptions[activeIndex]
                      if (activeOption !== undefined) selectOption(activeOption)
                    }
                  }}
                  placeholder={selectedValue ? selectedLabel : placeholder}
                  aria-label={label ?? placeholder}
                  aria-haspopup="listbox"
                  aria-expanded={open}
                  aria-controls={`${selectId}-options`}
                  aria-activedescendant={
                    availableOptions[activeIndex] !== undefined
                      ? `${selectId}-option-${activeIndex}`
                      : undefined
                  }
                  aria-describedby={descriptionIds || undefined}
                  aria-invalid={hasError || ariaInvalid || undefined}
                />
                {searchTerm && (
                  <button
                    className={styles.clearSearch}
                    type="button"
                    aria-label="Очистить поиск"
                    onClick={() => {
                      setSearchTerm('')
                      searchInputRef.current?.focus()
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ) : (
              <button
                id={selectId}
                type="button"
                className={[styles.dropdownTrigger, className].filter(Boolean).join(' ')}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={`${selectId}-options`}
                aria-activedescendant={
                  open && dropdownOptions[activeIndex] !== undefined
                    ? `${selectId}-option-${activeIndex}`
                    : undefined
                }
                aria-describedby={descriptionIds || undefined}
                aria-invalid={hasError || ariaInvalid || undefined}
                onClick={() => {
                  setSearchTerm('')
                  setOpen((previous) => !previous)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault()
                    setActiveIndex((index) => Math.min(index + 1, dropdownOptions.length - 1))
                    setOpen(true)
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault()
                    setActiveIndex((index) => Math.max(index - 1, 0))
                    setOpen(true)
                  } else if (event.key === 'Escape') {
                    setOpen(false)
                  } else if (event.key === 'Enter' || event.key === ' ') {
                    if (open) {
                      event.preventDefault()
                      const activeOption = dropdownOptions[activeIndex]
                      if (activeOption !== undefined) selectOption(activeOption)
                    } else {
                      event.preventDefault()
                      setOpen(true)
                    }
                  }
                }}
              >
                <span data-placeholder={!selectedValue || undefined}>{selectedLabel}</span>
                <span className={styles.chevron} aria-hidden="true" />
              </button>
            )}
            {open && !disabled && (
              <ul
                className={styles.options}
                id={`${selectId}-options`}
                role="listbox"
                aria-label={label ?? placeholder}
              >
                {dropdownOptions.map((option, optionIndex) => {
                  const optionLabel = option ? (getOptionLabel?.(option) ?? option) : placeholder
                  return (
                    <li
                      key={option || 'placeholder'}
                      id={`${selectId}-option-${optionIndex}`}
                      role="option"
                      aria-selected={selectedValue === option}
                      className={styles.option}
                      onMouseEnter={() => setActiveIndex(optionIndex)}
                      onClick={() => selectOption(option)}
                    >
                      {optionLabel}
                    </li>
                  )
                })}
                {dropdownOptions.length === 0 && (
                  <li className={styles.emptyOption}>Нет доступных вариантов</li>
                )}
              </ul>
            )}
          </>
        ) : (
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
            {availableOptions.map((option) => (
              <option key={option} value={option}>
                {getOptionLabel ? getOptionLabel(option) : option}
              </option>
            ))}
          </select>
        )}
      </div>
      {hasError && (
        <p className={styles.error} id={errorId}>
          {error}
        </p>
      )}
    </div>
  )
})
