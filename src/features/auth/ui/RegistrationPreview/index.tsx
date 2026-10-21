import type { Skill, User } from '@/shared/types'
import { SkillDescription } from '@/entities/skill/ui/SkillDescription'
import { SkillGallery, type SkillGalleryImage } from '@/entities/skill/ui/SkillGallery'
import { formatAge } from '@/shared/lib/helpers'
import styles from './RegistrationPreview.module.css'

interface RegistrationPreviewProps {
  author: User
  skill: Pick<Skill, 'title' | 'category' | 'tags' | 'description'>
  images: SkillGalleryImage[]
  onEdit: () => void
  onConfirm: () => void
  disabled?: boolean
  error?: string | null
}

export function RegistrationPreview({
  author,
  skill,
  images,
  onEdit,
  onConfirm,
  disabled = false,
  error,
}: RegistrationPreviewProps) {
  const metaParts: string[] = []
  if (author.city) metaParts.push(author.city)
  if (author.age > 0) metaParts.push(formatAge(author.age))
  const metaText = metaParts.join(', ')

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
          {/* Левая колонка */}
          <div className={styles.content}>
            {/* Блок автора (строго по AC) */}
            <div className={styles.author}>
              {author.avatarUrl ? (
                <img className={styles.avatar} src={author.avatarUrl} alt={author.name} />
              ) : (
                <div
                  className={`${styles.avatar} ${styles['avatar--placeholder']}`}
                  aria-hidden="true"
                >
                  {author.name.charAt(0)}
                </div>
              )}
              <div className={styles.authorInfo}>
                <span className={styles.authorName}>{author.name}</span>
                {metaText && <span className={styles.authorMeta}>{metaText}</span>}
              </div>
            </div>

            {/* Заголовок, категория, описание (без кнопки обмена) */}
            <SkillDescription
              title={skill.title}
              category={skill.category}
              tags={skill.tags}
              description={skill.description}
              onExchange={() => {}}
              showExchange={false}
            />
          </div>

          {/* Правая колонка (Галерея Swiper) */}
          <div className={styles.galleryWrapper}>
            <SkillGallery images={images} />
          </div>
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        {/* Кнопки прижаты влево (как на макете) */}
        <footer className={styles.footer}>
          <button
            className={styles.buttonSecondary}
            type="button"
            onClick={onEdit}
            disabled={disabled}
          >
            Редактировать
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
      </div>
    </div>
  )
}
