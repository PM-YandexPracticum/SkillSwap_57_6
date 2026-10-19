import { useEffect, useState } from 'react'
import { FilePicker, type FilePickerProps } from '../FilePicker'
import styles from './ImagePicker.module.css'

/**Тип аналогичен интерфейсу FilePickerProps */
export type ImagePickerProps = FilePickerProps

export function ImagePicker(props: ImagePickerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    /*Обнуление url при отсутствии значения props.value */
    if (!props.value) {
      setPreviewUrl(null)
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

      {previewUrl && (
        <div className={styles.preview}>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={props.value?.name ?? 'Предпросмотр изображения'}
              className={styles.image}
            />
          ) : (
            <div className={styles.placeholder} aria-hidden="true">
              Нет изображения
            </div>
          )}
        </div>
      )}
    </div>
  )
}
