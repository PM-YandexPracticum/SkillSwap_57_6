import { useEffect, useState } from 'react'
import { FilePicker, type FilePickerProps } from '../FilePicker'
import styles from './ImagePicker.module.css'
import addIcon from './assets/add.svg'
import userCircleIcon from './assets/user-circle.svg'

export interface ImagePickerProps extends FilePickerProps {
  variant?: 'default' | 'avatar'
}

const IMAGE_ERROR =
  'Не удалось отобразить изображение: файл повреждён или имеет неподдерживаемый формат'
export function ImagePicker({ variant = 'default', ...props }: ImagePickerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [erroredUrl, setErroredUrl] = useState<string | null>(null)
  const hasError = previewUrl !== null && erroredUrl === previewUrl

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const src = e.currentTarget.getAttribute('src')
    /* Защита от запоздалого события старого <img>
    реагируем только если это всё ещё актуальный previewUrl*/
    if (!src || src !== previewUrl) return

    setErroredUrl(src)
    props.onValidationChange?.(IMAGE_ERROR)
  }

  useEffect(() => {
    /*Обнуление предыдущего и ошибочного url при отсутствии значения props.value */
    if (!props.value) {
      setPreviewUrl(null)
      setErroredUrl(null)
      return
    }
    const url = URL.createObjectURL(props.value)
    setPreviewUrl(url)

    /* Очистка url перед следующим запуском или размонтировании
     чтобы не загрязнять память браузера */
    return () => URL.revokeObjectURL(url)
  }, [props.value])

  if (variant === 'avatar') {
    return (
      <div className={`${styles.wrapper} ${styles.avatarWrapper}`}>
        <div className={styles.avatar}>
          {previewUrl && !hasError ? (
            <img
              key={previewUrl}
              src={previewUrl}
              alt={props.value?.name ?? 'Предпросмотр аватара'}
              className={styles.avatarImage}
              onError={handleImageError}
            />
          ) : (
            <img className={styles.avatarPlaceholder} src={userCircleIcon} alt="" />
          )}
          <img className={styles.avatarAdd} src={addIcon} alt="" />
        </div>
        <FilePicker {...props} avatarLayout />
        {props.value && (
          <button
            type="button"
            className={styles.avatarRemove}
            onClick={() => {
              props.onValidationChange?.(null)
              props.onChange(null)
            }}
            disabled={props.disabled}
          >
            Удалить аватар
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <FilePicker {...props} />
      <div className={styles.preview}>
        {!previewUrl ? (
          <div className={styles.placeholder} aria-hidden="true">
            Нет изображения
          </div>
        ) : hasError ? (
          <div className={`${styles.placeholder} ${styles.placeholderError}`} role="alert">
            {IMAGE_ERROR}
          </div>
        ) : (
          <img
            key={previewUrl}
            src={previewUrl}
            alt={props.value?.name ?? 'Предпросмотр изображения'}
            className={styles.image}
            onError={handleImageError}
          />
        )}
      </div>
    </div>
  )
}
