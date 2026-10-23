import { useState } from 'react'
import type { Skill } from '@/shared/types'
import type { SkillGalleryImage } from '@/entities/skill/ui/SkillGallery'
import editIcon from './assets/Icon right.svg'
import styles from './RegistrationPreview.module.css'

interface RegistrationPreviewProps {
  skill: Pick<Skill, 'title' | 'category' | 'tags' | 'description'>
  images: SkillGalleryImage[]
  onEdit: () => void
  onConfirm: () => void
  disabled?: boolean
  error?: string | null
}

export function RegistrationPreview({
  skill,
  images,
  onEdit,
  onConfirm,
  disabled = false,
  error,
}: RegistrationPreviewProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const activeImage = images[activeImageIndex]
  const thumbnails = images
    .map((image, index) => ({ image, index }))
    .filter(({ index }) => index !== activeImageIndex)
  const visibleThumbnails = thumbnails.slice(0, 3)
  const hiddenThumbnailCount = Math.max(0, thumbnails.length - visibleThumbnails.length)
  const tagsText = skill.tags.length > 0 ? ` / ${skill.tags.join(', ')}` : ''

  return (
    <div className={styles.overlay}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
      >
        <header className={styles.header}>
          <h2 id="preview-title" className={styles.headerTitle}>
            Ваше предложение
          </h2>
          <p className={styles.headerSubtitle}>
            Пожалуйста, проверьте и подтвердите правильность данных
          </p>
        </header>

        <div className={styles.layout}>
          <section className={styles.content} aria-label="Данные предложения">
            <div className={styles.skillInfo}>
              <h3 className={styles.skillTitle}>{skill.title}</h3>
              <p className={styles.category}>
                {skill.category}
                {tagsText}
              </p>
              {skill.description && <p className={styles.description}>{skill.description}</p>}
            </div>

            <footer className={styles.footer}>
              <button
                className={styles.buttonSecondary}
                type="button"
                onClick={onEdit}
                disabled={disabled}
              >
                Редактировать
                <img className={styles.editIcon} src={editIcon} alt="" aria-hidden="true" />
              </button>
              <button
                className={styles.buttonPrimary}
                type="button"
                onClick={onConfirm}
                disabled={disabled}
              >
                Готово
              </button>
            </footer>
          </section>

          <div
            className={`${styles.gallery} ${thumbnails.length === 0 ? styles.gallerySingle : ''}`}
            aria-label="Фотографии навыка"
          >
            {activeImage ? (
              <>
                <img className={styles.mainImage} src={activeImage.src} alt={activeImage.alt} />
                {visibleThumbnails.length > 0 && (
                  <div className={styles.thumbnails}>
                    {visibleThumbnails.map(({ image, index }, thumbnailIndex) => (
                      <button
                        className={styles.thumbnail}
                        type="button"
                        key={`${image.src}-${index}`}
                        onClick={() => setActiveImageIndex(index)}
                        aria-label={`Показать изображение ${index + 1}`}
                      >
                        <img src={image.src} alt="" />
                        {thumbnailIndex === visibleThumbnails.length - 1 &&
                          hiddenThumbnailCount > 0 && (
                            <span className={styles.moreImages}>+{hiddenThumbnailCount}</span>
                          )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyGallery} aria-label="Фотографии не добавлены" />
            )}
          </div>
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
