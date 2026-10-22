
import { useEffect, useState } from 'react'
import { ImagePicker } from '../ImagePicker'
import styles from './MultiImagePicker.module.css'

interface MultiImagePickerProps {
  value: (File | null)[]
  onChange: (files: (File | null)[]) => void
  acceptedTypes: readonly string[]
  maxSizeBytes?: number
  disabled?: boolean
  onValidationChange?: (error: string | null) => void
}

export function MultiImagePicker({
  value,
  onChange,
  acceptedTypes,
  maxSizeBytes,
  disabled = false,
  onValidationChange,
}: MultiImagePickerProps) {
  const [errors, setErrors] = useState<Record<number, string>>({})

  /* Очищаем ошибки при внешнем сбросе списка.*/
  useEffect(() => {
    if (value.length === 0) {
      setErrors({})
    }
  }, [value])

  /* Передаём родителю все ошибки слотов.*/
  useEffect(() => {
    const messages = Object.entries(errors).map(
      ([index, message]) => `Фото ${Number(index) + 1}: ${message}`,
    )

    onValidationChange?.(messages.length ? messages.join('\n') : null)
  }, [errors, onValidationChange])

  /*Добавление нового изображения */
  const addImage = () => {
    onChange([...value, null])
  }

  /*Удаление изображения */
  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index))

    setErrors((current) =>
      Object.fromEntries(
        Object.entries(current)
          .filter(([key]) => Number(key) !== index)
          .map(([key, message]) => [
            Number(key) > index ? Number(key) - 1 : Number(key),
            message,
          ]),
      ),
    )
  }

  /*Обновление изображения */
  const updateImage = (index: number, file: File | null) => {
    onChange(value.map((current, i) => (i === index ? file : current)))
  }

  const updateError = (index: number, error: string | null) => {
    setErrors((current) => {
      if (error === null) {
        if (!(index in current)) return current

        const next = { ...current }
        delete next[index]
        return next
      }

      if (current[index] === error) return current

      return { ...current, [index]: error }
    })
  }

  return (
    <div className={styles.container}>
      {value.map((file, index) => (
        <div className={styles.item} key={index}>
          <ImagePicker
            value={file}
            onChange={(newFile) => {
              if (newFile === null) {
                removeImage(index)
              } else {
                updateImage(index, newFile)
              }
            }}
            acceptedTypes={acceptedTypes}
            maxSizeBytes={maxSizeBytes}
            disabled={disabled}
            error={errors[index]}
            onValidationChange={(error) => updateError(index, error)}
          />
        </div>
      ))}

      <button type="button" onClick={addImage} disabled={disabled}>
        Добавить фото
      </button>
    </div>
  )
}