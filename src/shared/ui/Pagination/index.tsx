import styles from './Pagination.module.css'

export interface PaginationProps {
  currentPage: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  if (
    !Number.isInteger(currentPage) ||
    !Number.isFinite(totalItems) ||
    totalItems < 0 ||
    !Number.isInteger(pageSize) ||
    pageSize <= 0
  ) {
    return null
  }

  const totalPages = Math.ceil(totalItems / pageSize)

  if (totalPages <= 1) return null

  const page = Math.min(Math.max(currentPage, 1), totalPages)

  const changePage = (nextPage: number) => {
    if (nextPage >= 1 && nextPage <= totalPages && nextPage !== page) {
      onPageChange(nextPage)
    }
  }

  return (
    <nav className={styles.pagination} aria-label="Навигация по страницам">
      <button
        className={styles.button}
        type="button"
        disabled={page === 1}
        onClick={() => changePage(page - 1)}
      >
        Назад
      </button>

      {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
        <button
          key={number}
          className={styles.button}
          type="button"
          aria-label={`Страница ${number}`}
          aria-current={number === page ? 'page' : undefined}
          onClick={() => changePage(number)}
        >
          {number}
        </button>
      ))}

      <button
        className={styles.button}
        type="button"
        disabled={page === totalPages}
        onClick={() => changePage(page + 1)}
      >
        Вперёд
      </button>
    </nav>
  )
}
