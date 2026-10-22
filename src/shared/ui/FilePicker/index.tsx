import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { validateImageFile } from '@/shared/lib/validateImageFile'
import { FormInput } from '@/shared/ui/FormInput'
import styles from './FilePicker.module.css'

export interface FilePickerProps {
  value: File | null
  onChange: (file: File | null) => void
  acceptedTypes: readonly string[]
  maxSizeBytes?: number
  disabled?: boolean
  error?: string
  onValidationChange?: (error: string | null) => void
  avatarLayout?: boolean
}

export function FilePicker({
  value,
  onChange,
  acceptedTypes,
  maxSizeBytes,
  disabled,
  error,
  onValidationChange,
  avatarLayout = false,
}: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const previousValue = useRef(value)
  const pendingChange = useRef<{ value: File | null } | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (previousValue.current === value) return
    previousValue.current = value
    const alreadyNotified = pendingChange.current?.value === value
    pendingChange.current = null
    if (inputRef.current) inputRef.current.value = ''
    setLocalError(null)
    if (!alreadyNotified) onValidationChange?.(null)
  }, [value, onValidationChange])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const file = event.currentTarget.files?.[0]
    if (!file) return
    event.currentTarget.value = ''
    const validationError = validateImageFile(file, acceptedTypes, maxSizeBytes)
    pendingChange.current = validationError === null ? { value: file } : null
    setLocalError(validationError)
    onValidationChange?.(validationError)
    if (validationError === null) onChange(file)
  }

  const handleRemove = () => {
    if (disabled) return
    if (inputRef.current) inputRef.current.value = ''
    pendingChange.current = { value: null }
    setLocalError(null)
    onValidationChange?.(null)
    onChange(null)
  }

  return (
    <FormInput
      ref={inputRef}
      type="file"
      label={avatarLayout ? undefined : 'Изображение'}
      accept={acceptedTypes.join(',')}
      disabled={disabled}
      error={localError ?? error}
      hint={value?.name}
      wrapperClassName={avatarLayout ? styles.avatarLayout : undefined}
      controlClassName={avatarLayout ? styles.avatarControl : undefined}
      className={avatarLayout ? styles.avatarInput : undefined}
      adornmentClassName={avatarLayout ? styles.avatarAdornment : undefined}
      onChange={handleChange}
      endAdornment={
        value &&
        !avatarLayout && (
          <button
            className={styles.removeButton}
            type="button"
            disabled={disabled}
            onClick={handleRemove}
          >
            Удалить файл
          </button>
        )
      }
    />
  )
}
