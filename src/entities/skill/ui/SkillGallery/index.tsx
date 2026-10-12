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
  if (!images?.length) {
    return null
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
        {images.map((image, index) => (
          <SwiperSlide key={`${image.src}-${index}`}>
            <img className={styles.image} src={image.src} alt={image.alt} />
          </SwiperSlide>
        ))}
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
