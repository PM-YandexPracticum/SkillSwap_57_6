import { PageLayout } from '../../widgets/PageLayout'
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
import { FavoriteToggle } from '../../features/favorites/ui/FavoriteToggle'
import type { CatalogItem } from '../../shared/types'

type FilterChip = { key: string; label: string; onRemove: () => void }

const TYPE_LABELS: Record<Exclude<SkillTypeFilter, 'all'>, string> = {
  teach: 'Могу научить',
  learn: 'Хочу научиться',
}

const renderFavoriteAction = ({ skills }: CatalogItem) => {
  const target =
    skills.find((skill) => skill.type === 'teach') ?? skills.find((skill) => skill.type === 'learn')
  return target ? <FavoriteToggle skillId={target.id} /> : null
}

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
  const [selectedSubcategory, setSelectedSubcategory] = useState('')

  const catalogItems = useAppSelector(selectCatalogItems)
  const popularItems = useAppSelector(selectPopularItems)
  const newestItems = useAppSelector(selectNewestItems)
  const recommendedItems = useAppSelector(selectRecommendedItems)
  // Создаем отфильтрованный список
  const filteredItems = useMemo(() => {
    return filterCatalog(
      catalogItems,
      debouncedSearch,
      selectedType,
      selectedCategory,
      selectedSubcategory,
    )
  }, [catalogItems, debouncedSearch, selectedType, selectedCategory, selectedSubcategory])

  const appliedSearch = debouncedSearch.trim()
  // Чип для каждого выбранного фильтра; крестик снимает только его
  const chips = [
    appliedSearch && { key: 'search', label: appliedSearch, onRemove: () => setSearchValue('') },
    selectedType !== 'all' && {
      key: 'type',
      label: TYPE_LABELS[selectedType],
      onRemove: () => setSelectedType('all'),
    },
    selectedCategory !== 'all' && {
      key: 'category',
      label: selectedCategory,
      onRemove: () => setSelectedCategory('all'),
    },
    selectedSubcategory && {
      key: 'subcategory',
      label: selectedSubcategory,
      onRemove: () => setSelectedSubcategory(''),
    },
  ].filter((chip): chip is FilterChip => Boolean(chip))

  const hasActiveFilters = chips.length > 0

  const resetFilters = () => {
    setSearchValue('')
    setSelectedType('all')
    setSelectedCategory('all')
    setSelectedSubcategory('')
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, selectedType, selectedCategory, selectedSubcategory])

  return (
    <PageLayout
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      mainClassName={styles.main}
    >
      <aside className={styles.filters}>
        <div className={styles.filtersHeader}>
          <h2>Фильтры{hasActiveFilters && ` (${chips.length})`}</h2>
          {(hasActiveFilters || searchValue) && (
            <button className={styles.reset} type="button" onClick={resetFilters}>
              Сбросить
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>

        <FiltersBar
          selectedType={selectedType}
          selectedCategory={selectedCategory}
          onTypeChange={setSelectedType}
          onCategoryChange={setSelectedCategory}
          selectedSubcategory={selectedSubcategory}
          onSubcategoryChange={setSelectedSubcategory}
        />
      </aside>

      <section className={styles.user_section}>
        {hasActiveFilters && (
          <ul className={styles.chips} aria-label="Выбранные фильтры">
            {chips.map(({ key, label, onRemove }) => (
              <li key={key}>
                <button
                  className={styles.chip}
                  type="button"
                  aria-label={`Снять фильтр: ${label}`}
                  onClick={onRemove}
                >
                  {label}
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
        )}
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
            renderAction={renderFavoriteAction}
          />
        ) : (
          <>
            <CatalogSection
              title="Популярное"
              items={popularItems}
              renderAction={renderFavoriteAction}
            />

            <CatalogSection title="Новое" items={newestItems} renderAction={renderFavoriteAction} />

            <section>
              <h2>Рекомендуем</h2>

              <CatalogResults
                items={recommendedItems}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                renderAction={renderFavoriteAction}
                showCount={false}
              />
            </section>
          </>
        )}
      </section>
    </PageLayout>
  )
}
export default CatalogPage
