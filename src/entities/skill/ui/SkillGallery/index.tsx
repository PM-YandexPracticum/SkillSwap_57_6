import { useCallback, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/navigation'

import styles from './SkillGallery.module.css'

export type SkillGalleryImage = {
  src: string
  alt: string
}

export interface SkillGalleryProps {
  images: SkillGalleryImage[]
  loop?: boolean
}

export const SkillGallery = ({ images, loop = false }: SkillGalleryProps) => {
  const [failedSrcs, setFailedSrcs] = useState<ReadonlySet<string>>(() => new Set())

  const handleImageError = useCallback((src: string) => {
    setFailedSrcs((prev) => {
      if (prev.has(src)) {
        return prev
      }

      const next = new Set(prev)
      next.add(src)
      return next
    })
  }, [])

  if (!images?.length) {
    return (
      <div className={styles.gallery}>
        <div className={styles.placeholder} aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className={styles.gallery}>
      <Swiper
        modules={[Navigation]}
        navigation={{
          nextEl: `.${styles.nextButton}`,
          prevEl: `.${styles.prevButton}`,
        }}
        loop={loop}
        className={styles.swiper}
      >
        {images.map((image, index) => {
          const isFailed = failedSrcs.has(image.src)

          return (
            <SwiperSlide key={`${image.src}-${index}`}>
              {isFailed ? (
                <div className={styles.placeholder} role="img" aria-label={image.alt} />
              ) : (
                <img
                  className={styles.image}
                  src={image.src}
                  alt={image.alt}
                  onError={() => handleImageError(image.src)}
                />
              )}
            </SwiperSlide>
          )
        })}
      </Swiper>
      <button
        type="button"
        className={`${styles.arrow} ${styles.prevButton}`}
        aria-label="Предыдущее изображение"
      />
      <button
        type="button"
        className={`${styles.arrow} ${styles.nextButton}`}
        aria-label="Следующее изображение"
      />
    </div>
  )
}

export default SkillGallery
