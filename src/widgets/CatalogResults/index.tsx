import { UserCardsGrid } from '@/widgets/UserCardsGrid'
import { CatalogState } from '@/widgets/CatalogState'
import Pagination from '@/shared/ui/Pagination'
import type { CatalogItem } from '@/shared/types'
import styles from './CatalogResults.module.css'
import { useEffect } from 'react'
import type { ReactNode } from 'react'

const PAGE_SIZE = 9

export interface CatalogResultsProps {
  /** Полный массив элементов каталога — уже отфильтрованный и отсортированный родителем */
  items: CatalogItem[]
  /** Текущая страница, нумерация с 1. Состояние хранится у родителя */
  currentPage: number
  /** Обработчик смены страницы */
  onPageChange: (page: number) => void
  showCount?: boolean
  renderAction?: (item: CatalogItem) => ReactNode
}

export function CatalogResults({
  items,
  currentPage,
  onPageChange,
  showCount = true,
  renderAction,
}: CatalogResultsProps) {
  const totalItems = items.length

  // Реальное число страниц при текущем размере массива
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  // Безопасная страница: не меньше 1 и не больше totalPages.
  // Защищает от ситуации, когда родитель уменьшил items, а currentPage
  // остался старым (например, 3 при 2 доступных страницах).
  const safePage = Math.min(Math.max(currentPage, 1), totalPages)

  // Синхронизируем страницу с родителем, если она вышла за границы
  useEffect(() => {
    if (currentPage !== safePage) {
      onPageChange(safePage)
    }
  }, [currentPage, safePage, onPageChange])

  if (totalItems === 0) {
    return <CatalogState state="empty" />
  }

  const startIndex = (safePage - 1) * PAGE_SIZE
  const pageItems = items.slice(startIndex, startIndex + PAGE_SIZE)

  return (
    <section className={styles.root} aria-label="Результаты каталога">
      {showCount && <p className={styles.count}>Подходящие предложения: {totalItems}</p>}

      <UserCardsGrid items={pageItems} renderAction={renderAction} />

      <Pagination
        currentPage={safePage}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        onPageChange={onPageChange}
      />
    </section>
  )
}
