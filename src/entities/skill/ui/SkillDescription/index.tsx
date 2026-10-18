import { useEffect, useState } from 'react'
import type { Skill } from '@/entities/skill/model/types'
import arrowIcon from './assets/chevron-right.svg'
import likeIcon from './assets/like.svg'
import moreIcon from './assets/more-square.svg'
import shareIcon from './assets/share.svg'
import styles from './SkillDescription.module.css'

interface SkillDescriptionProps extends Pick<Skill, 'title' | 'category' | 'tags' | 'description'> {
  images?: string[]
  onExchange: () => void
  disabled?: boolean
  isPending?: boolean
}

export function SkillDescription({
  title,
  category,
  tags,
  description,
  images = [],
  onExchange,
  disabled = false,
  isPending = false,
}: SkillDescriptionProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const imagesKey = images.join('\0')
  const activeImageIndex = images.length > 0 ? selectedImageIndex % images.length : 0
  const thumbnailCount = Math.min(Math.max(images.length - 1, 0), 2)
  const thumbnailIndices = Array.from(
    { length: thumbnailCount },
    (_, index) => (activeImageIndex + index + 1) % images.length,
  )
  const hiddenImageCount = Math.max(images.length - thumbnailIndices.length - 1, 0)
  const overflowImageIndex = (activeImageIndex + thumbnailIndices.length + 1) % images.length

  useEffect(() => {
    setSelectedImageIndex(0)
  }, [imagesKey])

  const selectPreviousImage = () => {
    setSelectedImageIndex((index) => (index - 1 + images.length) % images.length)
  }

  const selectNextImage = () => {
    setSelectedImageIndex((index) => (index + 1) % images.length)
  }

  return (
    <section className={styles.root}>
      <div className={styles.actions} aria-label="Действия с навыком">
        <button className={styles.action} type="button" aria-label="Добавить в избранное">
          <img src={likeIcon} alt="" />
        </button>
        <button className={styles.action} type="button" aria-label="Поделиться навыком">
          <img src={shareIcon} alt="" />
        </button>
        <button className={styles.action} type="button" aria-label="Другие действия">
          <img src={moreIcon} alt="" />
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.details}>
          <h1 className={styles.title}>{title}</h1>

          <p className={styles.category}>
            <span>{category}</span>
            {tags.map((tag, index) => (
              <span className={styles.tag} key={`${tag}-${index}`}>
                {tag}
              </span>
            ))}
          </p>

          <p className={styles.description}>{description}</p>

          <button
            className={styles.button}
            type="button"
            disabled={disabled || isPending}
            onClick={onExchange}
          >
            Предложить обмен
          </button>
        </div>

        <div className={styles.gallery} role="group" aria-label="Фотографии навыка">
          <div className={styles.mainPhoto}>
            {images.length > 0 ? (
              <img
                className={styles.mainImage}
                src={images[activeImageIndex]}
                alt={`${title}: фото ${activeImageIndex + 1}`}
              />
            ) : null}

            {images.length > 1 && (
              <>
                <button
                  className={`${styles.arrow} ${styles.previous}`}
                  type="button"
                  aria-label="Предыдущее фото"
                  onClick={selectPreviousImage}
                >
                  <img src={arrowIcon} alt="" />
                </button>
                <button
                  className={`${styles.arrow} ${styles.next}`}
                  type="button"
                  aria-label="Следующее фото"
                  onClick={selectNextImage}
                >
                  <img src={arrowIcon} alt="" />
                </button>
              </>
            )}
          </div>

          {thumbnailIndices.length > 0 && (
            <div className={styles.thumbnails}>
              {thumbnailIndices.map((imageIndex) => (
                <button
                  className={styles.thumbnail}
                  key={`${imageIndex}-${images[imageIndex]}`}
                  type="button"
                  aria-label={`Показать фото ${imageIndex + 1}`}
                  onClick={() => setSelectedImageIndex(imageIndex)}
                >
                  <img src={images[imageIndex]} alt="" />
                </button>
              ))}
              {hiddenImageCount > 0 && (
                <button
                  className={`${styles.thumbnail} ${styles.morePhotos}`}
                  type="button"
                  aria-label={`Показать еще ${hiddenImageCount} фото`}
                  onClick={() => setSelectedImageIndex(overflowImageIndex)}
                >
                  <img src={images[overflowImageIndex]} alt="" />
                  <span>+{hiddenImageCount}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
