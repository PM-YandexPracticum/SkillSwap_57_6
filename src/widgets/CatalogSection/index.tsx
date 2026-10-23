import { useState } from 'react'
import type { ReactNode } from 'react'
import type { CatalogItem } from '@/shared/types'
import { UserCardsGrid } from '@/widgets/UserCardsGrid'
import styles from './CatalogSection.module.css'
import chevronDown from '@/shared/assets/icons/chevron-down.svg'

const INITIAL_VISIBLE_ITEMS = 3
const MAX_VISIBLE_ITEMS = 9

interface CatalogSectionProps {
  title: string
  items: CatalogItem[]
  renderAction?: (item: CatalogItem) => ReactNode
}

export function CatalogSection({ title, items, renderAction }: CatalogSectionProps) {
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
            <span className={styles.arrow} aria-hidden="true">
              <img src={chevronDown} alt="" width={16} height={8} />
            </span>
          </button>
        )}
      </div>
      <UserCardsGrid items={visibleItems} renderAction={renderAction} />
    </section>
  )
}
