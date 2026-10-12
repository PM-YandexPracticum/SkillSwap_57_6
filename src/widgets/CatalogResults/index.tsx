import { UserCardsGrid } from '@/widgets/UserCardsGrid'
import Pagination from '@/shared/ui/Pagination'
import type { CatalogItem } from '@/shared/types'
import styles from './CatalogResults.module.css'

const PAGE_SIZE = 9

export interface CatalogResultsProps {
  /** Полный массив элементов каталога — уже отфильтрованный и отсортированный родителем */
  items: CatalogItem[]
  /** Текущая страница, нумерация с 1. Состояние хранится у родителя */
  currentPage: number
  /** Обработчик смены страницы */
  onPageChange: (page: number) => void
}

export function CatalogResults({
  items,
  currentPage,
  onPageChange,
}: CatalogResultsProps) {
  const totalItems = items.length

  if (totalItems === 0) {
    // TODO(#26): заменить на <CatalogState state="empty" /> после мержа #26
    return <div className={styles.empty}>Ничего не найдено</div>
  }

  const startIndex = (currentPage - 1) * PAGE_SIZE
  const pageItems = items.slice(startIndex, startIndex + PAGE_SIZE)

  return (
    <section className={styles.root} aria-label="Результаты каталога">
      <p className={styles.count}>Подходящие предложения: {totalItems}</p>

      <UserCardsGrid items={pageItems} />

      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        onPageChange={onPageChange}
      />
    </section>
  )
}