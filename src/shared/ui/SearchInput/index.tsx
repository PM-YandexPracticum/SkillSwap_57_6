import styles from './SearchInput.module.css'
import type { ChangeEvent } from 'react'

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
}

export const SearchInput = ({ value, onChange }: SearchInputProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  const handleClear = () => {
    onChange('')
  }

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor="search-input">
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
          id="search-input"
          className={styles.input}
          type="search"
          value={value}
          onChange={handleChange}
          placeholder="Искать навык"
        />

        {value && (
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
}
