import { UserCard } from '@/entities/user/ui/UserCard'
import type { CatalogItem } from '@/shared/types'
import styles from './UserCardsGrid.module.css'

// props компонента UserCardsGrid.
interface UserCardsGridProps {
  items: CatalogItem[]
}

export function UserCardsGrid({ items }: UserCardsGridProps) {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <UserCard key={item.user.id} user={item.user} skills={item.skills} />
      ))}
    </div>
  )
}
