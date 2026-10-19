import { useEffect, useState } from 'react'
import { FilePicker, type FilePickerProps } from '../FilePicker'
import styles from './ImagePicker.module.css'

export type ImagePickerProps = FilePickerProps

const IMAGE_ERROR =
  'Не удалось отобразить изображение: файл повреждён или имеет неподдерживаемый формат'
export function ImagePicker(props: ImagePickerProps) {
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