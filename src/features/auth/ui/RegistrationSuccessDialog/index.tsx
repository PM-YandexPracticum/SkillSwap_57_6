import { useEffect, useRef } from 'react'
import styles from './RegistrationSuccessDialog.module.css'

interface RegistrationSuccessDialogProps {
  onClose: () => void
}

export function RegistrationSuccessDialog({ onClose }: RegistrationSuccessDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocused = useRef<Element | null>(null)

  useEffect(() => {
    previousFocused.current = document.activeElement
    const closeButton = dialogRef.current?.querySelector<HTMLButtonElement>('button')
    closeButton?.focus()

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
      if (previousFocused.current instanceof HTMLElement) {
        previousFocused.current.focus()
      }
    }
  }, [])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
      return
    }

    if (event.key === 'Tab' && dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-dialog-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.iconWrapper}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M20 6L9 17L4 12"
              stroke="#253017"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 id="success-dialog-title" className={styles.title}>
          Ваше предложение создано
        </h2>

        <p className={styles.content}>Теперь вы можете предложить обмен</p>

        <button className={styles.button} type="button" onClick={onClose}>
          Готово
        </button>
      </div>
    </div>
  )
}
