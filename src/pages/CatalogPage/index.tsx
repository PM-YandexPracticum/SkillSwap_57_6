import { Header } from '../../widgets/Header'
import { Footer } from '../../widgets/Footer'
import styles from './CatalogPage.module.css'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { useEffect, useMemo, useState } from 'react'
import { getCatalogThunk } from '../../features/catalog/model/catalogSlice'
import FiltersBar, { SkillCategoryFilter, SkillTypeFilter } from '../../widgets/FiltersBar'
import {
  selectCatalogItems,
  selectCatalogMergeError,
  selectNewestItems,
  selectPopularItems,
  selectRecommendedItems,
} from '../../features/catalog/model/catalogSelectors'
import { restoreLocalData } from '../../features/localData/model/localDataSlice'
import { restoreProfiles } from '../../features/profile/model/profileSlice'
import { CatalogSection } from '../../widgets/CatalogSection'
import { CatalogResults } from '../../widgets/CatalogResults'
import { CatalogState } from '../../widgets/CatalogState'
import { filterCatalog } from '../../features/catalog/lib/filterCatalog'
import { useDebounce } from '../../shared/hooks/useDebounce'

const CatalogPage = () => {
  const dispatch = useAppDispatch()
  const [searchValue, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(searchValue, 300)
  const [currentPage, setCurrentPage] = useState(1)
  const { status, error } = useAppSelector((state) => state.catalog)
  const localError = useAppSelector((state) => state.localData.readError)
  const profileError = useAppSelector((state) => state.profile.readError)
  const mergeError = useAppSelector(selectCatalogMergeError)
  const [selectedType, setSelectedType] = useState<SkillTypeFilter>('all')
  const [selectedCategory, setSelectedCategory] = useState<SkillCategoryFilter>('all')

  useEffect(() => {
    dispatch(getCatalogThunk())
  }, [dispatch])

  const catalogItems = useAppSelector(selectCatalogItems)
  const popularItems = useAppSelector(selectPopularItems)
  const newestItems = useAppSelector(selectNewestItems)
  const recommendedItems = useAppSelector(selectRecommendedItems)
  // Создаем отфильтрованный список
  const filteredItems = useMemo(() => {
    return filterCatalog(catalogItems, debouncedSearch, selectedType, selectedCategory)
  }, [catalogItems, debouncedSearch, selectedType, selectedCategory])

  const hasActiveFilters =
    debouncedSearch.trim().length > 0 || selectedType !== 'all' || selectedCategory !== 'all'

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, selectedType, selectedCategory])

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
          {(localError || mergeError) && (
            <CatalogState
              state="error"
              messages={{ error: `Ошибка локальных данных: ${localError ?? mergeError}` }}
              retryLabel="Повторить загрузку локальных данных"
              onRetry={() => dispatch(restoreLocalData())}
            />
          )}
          {profileError && (
            <CatalogState
              state="error"
              messages={{ error: `Ошибка профилей: ${profileError}` }}
              retryLabel="Повторить загрузку профилей"
              onRetry={() => dispatch(restoreProfiles())}
            />
          )}
          {status === 'loading' || status === 'idle' ? (
            <CatalogState state="loading" />
          ) : status === 'error' ? (
            <CatalogState
              state="error"
              messages={{
                error: `Ошибка JSON-каталога: ${error ?? 'Не удалось загрузить каталог'}`,
              }}
              onRetry={() => dispatch(getCatalogThunk())}
            />
          ) : hasActiveFilters ? (
            <CatalogResults
              items={filteredItems}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          ) : (
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
