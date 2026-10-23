import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { validateImageFile } from '@/shared/lib/validateImageFile'
import addGalleryIcon from './assets/gallery-add.svg'
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
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previews, setPreviews] = useState<{ file: File; url: string; valueIndex: number }[]>([])

  useEffect(() => {
    const nextPreviews = value.flatMap((file, valueIndex) =>
      file ? [{ file, url: URL.createObjectURL(file), valueIndex }] : [],
    )
    setPreviews(nextPreviews)

    return () => {
      nextPreviews.forEach(({ url }) => URL.revokeObjectURL(url))
    }
  }, [value])

  const addFiles = (files: FileList | File[]) => {
    if (disabled || files.length === 0) return

    const acceptedFiles: File[] = []
    const errors: string[] = []
    Array.from(files).forEach((file) => {
      const error = validateImageFile(file, acceptedTypes, maxSizeBytes)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        acceptedFiles.push(file)
      }
    })

    const nextError = errors.length > 0 ? errors.join('\n') : null
    setUploadError(nextError)
    onValidationChange?.(nextError)

    if (acceptedFiles.length > 0) {
      onChange([...value.filter((file): file is File => file !== null), ...acceptedFiles])
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.currentTarget.files) addFiles(event.currentTarget.files)
    event.currentTarget.value = ''
  }

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
    if (event.dataTransfer.files) addFiles(event.dataTransfer.files)
  }

  const removeImage = (index: number) => {
    if (disabled) return
    onChange(value.filter((_, currentIndex) => currentIndex !== index))
    setUploadError(null)
    onValidationChange?.(null)
  }

  return (
    <div className={styles.container}>
      <label
        className={[
          styles.dropzone,
          isDragging ? styles.dropzoneDragging : '',
          disabled ? styles.dropzoneDisabled : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          className={styles.fileInput}
          type="file"
          accept={acceptedTypes.join(',')}
          multiple
          disabled={disabled}
          onChange={handleFileChange}
          aria-label="Выбрать изображения навыка"
        />
        <span className={styles.dropHint}>Перетащите или выберите изображение навыка</span>
        <span className={styles.chooseAction}>
          <img src={addGalleryIcon} alt="" aria-hidden="true" />
          Выбрать изображение
        </span>
      </label>

      {uploadError && (
        <p className={styles.error} role="alert">
          {uploadError}
        </p>
      )}

      {previews.length > 0 && (
        <div className={styles.previews}>
          {previews.map(({ file, url, valueIndex }) => (
            <div className={styles.preview} key={`${file.name}-${valueIndex}`}>
              <img src={url} alt={file.name} />
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => removeImage(valueIndex)}
                disabled={disabled}
                aria-label={`Удалить изображение ${file.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
