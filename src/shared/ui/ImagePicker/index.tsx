import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { FilePicker, type FilePickerProps } from '../FilePicker'
import styles from './ImagePicker.module.css'

export interface ImagePickerProps extends FilePickerProps {
  placeholder?: ReactNode
  previewClassName?: string
  onPreviewLoad?: (file: File) => void
}

const IMAGE_ERROR =
  'Не удалось отобразить изображение: файл повреждён или имеет неподдерживаемый формат'
export function ImagePicker(props: ImagePickerProps) {
  const [preview, setPreview] = useState<{ url: string; file: File } | null>(null)
  const previewUrl = preview?.url ?? null
  const [erroredUrl, setErroredUrl] = useState<string | null>(null)
  const hasError = previewUrl !== null && erroredUrl === previewUrl

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const src = e.currentTarget.getAttribute('src')
    /* Защита от запоздалого события старого <img>
    реагируем только если это всё ещё актуальный previewUrl*/
    if (!src || src !== previewUrl || preview?.file !== props.value) return

    setErroredUrl(src)
    props.onValidationChange?.(IMAGE_ERROR)
  }

  useEffect(() => {
    /*Обнуление предыдущего и ошибочного url при отсутствии значения props.value */
    if (!props.value) {
      setPreview(null)
      setErroredUrl(null)
      return
    }
    const url = URL.createObjectURL(props.value)
    setPreview({ url, file: props.value })

    /* Очистка url перед следующим запуском или размонтировании
     чтобы не загрязнять память браузера */
    return () => URL.revokeObjectURL(url)
  }, [props.value])

  return (
    <div className={styles.wrapper}>
      <FilePicker {...props} />

      <div className={[styles.preview, props.previewClassName].filter(Boolean).join(' ')}>
        {!previewUrl ? (
          (props.placeholder ?? (
            <div className={styles.placeholder} aria-hidden="true">
              Нет изображения
            </div>
          ))
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
            onLoad={() => {
              if (preview?.file === props.value) props.onPreviewLoad?.(preview.file)
            }}
          />
        )}
      </div>
    </div>
  )
}
