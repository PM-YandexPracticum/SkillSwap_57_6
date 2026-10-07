import { UserCard } from '@/entities/user/ui/UserCard'
import type { UserCardsGridItem } from '@/features/catalog/model/types'
import styles from './UserCardsGrid.module.css'

// props, принимающие компонент UserCardsGrid.
interface UserCardsGridProps {
  items: UserCardsGridItem[]
}

// Компонент получает готовые данные и отрисовать сетку карточек.
export function UserCardsGrid({ items }: UserCardsGridProps) {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <UserCard
          key={item.user.id}
          user={item.user}
          skills={item.skills}
        />
      ))}
    </div>
  )
}
