import { Link } from 'react-router-dom'
import { selectAuthUser } from '@/features/auth/model/authSlice'
import { selectCatalogMergeError } from '@/features/catalog/model/catalogSelectors'
import { getCatalogThunk } from '@/features/catalog/model/catalogSlice'
import { selectFavoriteEntries } from '@/features/favorites/model/favoritesSelectors'
import { selectFavoritesError } from '@/features/favorites/model/favoritesSlice'
import { restoreFavoritesThunk } from '@/features/favorites/model/favoritesThunks'
import { FavoriteToggle } from '@/features/favorites/ui/FavoriteToggle'
import { restoreLocalData } from '@/features/localData/model/localDataSlice'
import { restoreProfiles } from '@/features/profile/model/profileSlice'
import { ROUTES } from '@/shared/lib/constants'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { CatalogState } from '@/widgets/CatalogState'
import { PageLayout } from '@/widgets/PageLayout'
import { UserCardsGrid } from '@/widgets/UserCardsGrid'
import styles from '../InfoPages.module.css'

export default function FavoritesPage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectAuthUser)
  const { status, error } = useAppSelector((state) => state.catalog)
  const localError = useAppSelector((state) => state.localData.readError)
  const profileError = useAppSelector((state) => state.profile.readError)
  const mergeError = useAppSelector(selectCatalogMergeError)
  const favoritesError = useAppSelector(selectFavoritesError)
  const { items, missingAuthor } = useAppSelector(selectFavoriteEntries)
  const issues = [
    {
      message: status === 'error' && `Ошибка JSON-каталога: ${error}`,
      retry: () => dispatch(getCatalogThunk()),
    },
    {
      message: (localError || mergeError) && `Ошибка локальных данных: ${localError ?? mergeError}`,
      retry: () => dispatch(restoreLocalData()),
    },
    {
      message: profileError && `Ошибка профилей: ${profileError}`,
      retry: () => dispatch(restoreProfiles()),
    },
    {
      message: favoritesError && `Ошибка избранного: ${favoritesError}`,
      retry: () => dispatch(restoreFavoritesThunk()),
    },
    {
      message: missingAuthor && 'Автор избранного навыка не найден. Повторите загрузку каталога.',
      retry: () => dispatch(getCatalogThunk()),
    },
  ].filter((issue) => issue.message)

  return (
    <PageLayout mainClassName={styles.main}>
      {user && (
        <Link className={styles.profileLink} to={ROUTES.PROFILE}>
          Личный кабинет
        </Link>
      )}
      <h1>Избранное</h1>
      {status === 'idle' || status === 'loading' ? (
        <CatalogState state="loading" messages={{ loading: 'Загружаем избранное…' }} />
      ) : issues.length > 0 ? (
        issues.map(({ message, retry }) => (
          <CatalogState
            key={String(message)}
            state="error"
            messages={{ error: String(message) }}
            onRetry={retry}
          />
        ))
      ) : items.length > 0 ? (
        <UserCardsGrid
          items={items}
          hideEmptyGroups
          getItemKey={({ skills }) => skills[0].id}
          renderAction={({ skills }) => <FavoriteToggle skillId={skills[0].id} />}
        />
      ) : (
        <div className={styles.empty}>
          <CatalogState
            state="empty"
            messages={{
              empty: 'В избранном пока нет навыков. Добавляйте их, нажимая на сердечко в карточке.',
            }}
          />
          <Link className={styles.catalogLink} to={ROUTES.HOME}>
            Вернуться в каталог
          </Link>
        </div>
      )}
    </PageLayout>
  )
}
