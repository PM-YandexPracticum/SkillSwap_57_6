import styles from './SearchInput.module.css'
import type { ChangeEvent } from 'react'
import { useRef, useId, forwardRef, useCallback } from 'react'

type SearchInputProps = {
  id?: string
  value: string
  onChange: (value: string) => void
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ id, value, onChange }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId

    const inputRef = useRef<HTMLInputElement | null>(null)

    const setInputRef = useCallback(
      (element: HTMLInputElement | null) => {
        inputRef.current = element

        if (typeof ref === 'function') {
          ref(element)
        } else if (ref) {
          ref.current = element
        }
      },
      [ref],
    )

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value)
    }

    const handleClear = () => {
      onChange('')
      inputRef.current?.focus()
    }

    return (
      <div className={styles.wrapper}>
        <label className={styles.label} htmlFor={inputId}>
          Искать навык
        </label>
        <div className={styles.inputWrapper}>
          <span className={styles.searchIcon} aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path
                d="M16.5 16.5L21 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            ref={setInputRef}
            id={inputId}
            className={styles.input}
            type="search"
            value={value}
            onChange={handleChange}
            placeholder="Искать навык"
          />

          {value !== '' && (
            <button
              className={styles.clearButton}
              type="button"
              onClick={handleClear}
              aria-label="Очистить поиск"
            >
              ×
            </button>
          )}
        </div>
      </div>
    )
  },
)
SearchInput.displayName = 'SearchInput'
