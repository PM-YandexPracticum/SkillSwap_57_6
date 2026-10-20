import { useState } from 'react'
import type { CatalogItem } from '@/shared/types'
import { UserCardsGrid } from '@/widgets/UserCardsGrid'
import styles from './CatalogSection.module.css'

const INITIAL_VISIBLE_ITEMS = 3
const MAX_VISIBLE_ITEMS = 9

interface CatalogSectionProps {
  title: string
  items: CatalogItem[]
}

export function CatalogSection({ title, items }: CatalogSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const visibleItems = items.slice(0, isExpanded ? MAX_VISIBLE_ITEMS : INITIAL_VISIBLE_ITEMS)

  const isButtonVisible = items.length > INITIAL_VISIBLE_ITEMS
  const buttonText = isExpanded ? 'Свернуть' : 'Смотреть все'

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {isButtonVisible && (
          <button
            className={styles.showAll}
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
          >
            {buttonText}
            <span className={styles.arrow} aria-hidden="true" />
          </button>
        )}
      </div>
      <UserCardsGrid items={visibleItems} />
    </section>
  )
}
