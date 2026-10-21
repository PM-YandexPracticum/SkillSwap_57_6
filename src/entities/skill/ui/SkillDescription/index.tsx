import type { Skill } from '@/entities/skill/model/types'
import styles from './SkillDescription.module.css'

interface SkillDescriptionProps extends Pick<Skill, 'title' | 'category' | 'tags' | 'description'> {
  onExchange: () => void
  disabled?: boolean
  isPending?: boolean
  /** Показывать кнопку «Предложить обмен». По умолчанию true. */
  showExchange?: boolean
}

export function SkillDescription({
  title,
  category,
  tags,
  description,
  onExchange,
  disabled = false,
  isPending = false,
  showExchange = true,
}: SkillDescriptionProps) {
  return (
    <section className={styles.root}>
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

      {showExchange && (
        <button
          className={styles.button}
          type="button"
          disabled={disabled || isPending}
          onClick={onExchange}
        >
          Предложить обмен
        </button>
      )}
    </section>
  )
}
