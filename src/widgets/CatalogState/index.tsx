import { useCallback } from 'react'
import type { ReactNode } from 'react'

import styles from './CatalogState.module.css'

export type CatalogStateName = 'loading' | 'error' | 'empty'

interface CatalogStateProps {
  state: CatalogStateName
  onRetry?: () => void
  messages?: Partial<Record<CatalogStateName, string>>
  retryLabel?: string
  icon?: ReactNode
  className?: string
}

const DEFAULT_MESSAGES: Record<CatalogStateName, string> = {
  loading: 'Загружаем каталог…',
  error: 'Не удалось загрузить каталог. Проверьте соединение и попробуйте ещё раз.',
  empty: 'По вашему запросу ничего не найдено.',
}

const DEFAULT_RETRY_LABEL = 'Повторить'

export function CatalogState({
  state,
  onRetry,
  messages,
  retryLabel = DEFAULT_RETRY_LABEL,
  icon,
  className,
}: CatalogStateProps) {
  const handleRetry = useCallback(() => {
    if (!onRetry) {
      console.error('CatalogState: onRetry не передан, но состояние — error')
      return
    }
    onRetry()
  }, [onRetry])

  const message = messages?.[state] ?? DEFAULT_MESSAGES[state]

  return (
    <div
      className={[styles.root, styles[state], className].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
    >
      {icon && (
        <div className={styles.icon} aria-hidden="true">
          {icon}
        </div>
      )}
      <p className={styles.message}>{message}</p>

      {state === 'error' && onRetry && (
        <button
          type="button"
          className={styles.retry}
          onClick={handleRetry}
          aria-label={retryLabel}
        >
          {retryLabel}
        </button>
      )}
    </div>
  )
}
