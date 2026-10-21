import type { ReactNode } from 'react'
import { UserCard } from '@/entities/user/ui/UserCard'
import type { CatalogItem } from '@/shared/types'
import styles from './UserCardsGrid.module.css'

// props компонента UserCardsGrid.
interface UserCardsGridProps {
  items: CatalogItem[]
  /** Возвращает действие для каждой карточки (например, кнопка избранного) */
  renderAction?: (item: CatalogItem) => ReactNode
  /** Прокидывается в каждую карточку: скрывать ли пустые группы навыков */
  hideEmptyGroups?: boolean
  /** Возвращает ключ для React. По умолчанию — item.user.id */
  getItemKey?: (item: CatalogItem) => string
}

export function UserCardsGrid({
  items,
  renderAction,
  hideEmptyGroups = false,
  getItemKey,
}: UserCardsGridProps) {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <UserCard
          key={getItemKey ? getItemKey(item) : item.user.id}
          user={item.user}
          skills={item.skills}
          action={renderAction?.(item)}
          hideEmptyGroups={hideEmptyGroups}
        />
      ))}
    </div>
  )
}
