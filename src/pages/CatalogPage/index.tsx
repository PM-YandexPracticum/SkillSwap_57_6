// TODO: реализовать страницу CatalogPage
import { Header } from '../../widgets/Header'
import { Footer } from '../../widgets/Footer'
import styles from './CatalogPage.module.css'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { useEffect, useMemo, useState } from 'react'
import { getCatalogThunk } from '../../features/catalog/model/catalogSlice'
import FiltersBar, { SkillCategoryFilter, SkillTypeFilter } from '../../widgets/FiltersBar'
import {
  buildCatalogItems,
  shuffleItems,
  sortByNewest,
  sortByPopularity,
} from '../../features/catalog/model/catalogData'
import { CatalogSection } from '../../widgets/CatalogSection'
import { CatalogResults } from '../../widgets/CatalogResults'
import { CatalogState } from '../../widgets/CatalogState'
import { filterCatalogBySkillTitle } from '../../features/catalog/lib/filterCatalog'
import { useDebounce } from '../../shared/hooks/useDebounce'

const CatalogPage = () => {
  const dispatch = useAppDispatch()
  const [searchValue, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(searchValue, 300)
  const [currentPage, setCurrentPage] = useState(1)
  const { users, skills, status, error } = useAppSelector((state) => state.catalog)
  const [selectedType, setSelectedType] = useState<SkillTypeFilter>('all')
  const [selectedCategory, setSelectedCategory] = useState<SkillCategoryFilter>('all')

  useEffect(() => {
    dispatch(getCatalogThunk())
  }, [dispatch])

  /**Созданный каталог карточек */
  const catalogItems = useMemo(() => buildCatalogItems(users, skills), [users, skills])
  /**Каталог карточек в секции "Популярное" */
  const popularItems = useMemo(() => sortByPopularity(catalogItems), [catalogItems])
  /**Каталог карточек в секции "Новое" */
  const newestItems = useMemo(() => sortByNewest(catalogItems), [catalogItems])
  /**Каталог карточек в секции "Рекомендуем" */
  const recommendedItems = useMemo(() => shuffleItems(catalogItems), [catalogItems])
  // Создаем отфильтрованный список
  const filteredItems = useMemo(() => {
    return filterCatalogBySkillTitle(catalogItems, debouncedSearch)
  }, [catalogItems, debouncedSearch])

  // Добавляем сброс пагинации
  useEffect(() => {
    // Сбрасываем страницу на 1 при любом изменении debouncedSearch
    // Если мы стираем поиск и переходим обратно к секцииям, мы гарантированно начинаем с 1 стр
    setCurrentPage(1)
  }, [debouncedSearch])

  return (
    <div className={styles.page}>
      <Header searchValue={searchValue} onSearchChange={setSearchValue} />

      <main className={styles.main}>
        <aside className={styles.filters}>
          <h2>Фильтры</h2>

          <FiltersBar
            selectedType={selectedType}
            selectedCategory={selectedCategory}
            onTypeChange={setSelectedType}
            onCategoryChange={setSelectedCategory}
          />
        </aside>

        <section className={styles.user_section}>
          {status === 'loading' || status === 'idle' ? (
            <CatalogState state="loading" />
          ) : status === 'error' ? (
            <CatalogState
              state="error"
              messages={{ error: error ?? undefined }}
              onRetry={() => dispatch(getCatalogThunk())}
            />
          ) : // Здесь теперь стоит условие: есть поиск или нет?
          debouncedSearch.trim().length > 0 ? (
            // Если есть поиск -> показываем ТОЛЬКО результаты
            <CatalogResults
              items={filteredItems}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          ) : (
            // Если поиска нет -> показываем три привычные секции
            <>
              <CatalogSection title="Популярное" items={popularItems} />

              <CatalogSection title="Новое" items={newestItems} />

              <section>
                <h2>Рекомендуем</h2>

                <CatalogResults
                  items={recommendedItems}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              </section>
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
export default CatalogPage
