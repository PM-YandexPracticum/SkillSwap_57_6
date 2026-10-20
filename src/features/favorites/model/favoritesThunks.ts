import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit'
import {
  favoritesOwnerChanged,
  favoritesSnapshotRestored,
  setFavoritesError,
  setLocalLikeCounts,
  type FavoritesState,
} from './favoritesSlice'
import {
  getFavoritesKey,
  isFavoritesStorageKey,
  readFavoriteIds,
  readFavoriteLikeCounts,
  writeFavoriteIds,
} from './favoritesStorage'

type FavoritesThunk<Result = boolean> = ThunkAction<
  Result,
  { favorites: FavoritesState },
  unknown,
  UnknownAction
>

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Неизвестная ошибка избранного'

const updateFavorites =
  (getNextIds: (ids: string[]) => string[]): FavoritesThunk =>
  (dispatch, getState) => {
    const { ownerId } = getState().favorites
    try {
      const currentIds = readFavoriteIds(ownerId)
      const nextIds = getNextIds(currentIds)
      const localLikeCounts = readFavoriteLikeCounts({ ownerId, ids: nextIds })
      writeFavoriteIds(nextIds, ownerId)
      dispatch(favoritesSnapshotRestored({ ids: nextIds, localLikeCounts }))
      return true
    } catch (error) {
      dispatch(setFavoritesError(getErrorMessage(error)))
      return false
    }
  }

/** Добавляет навык в избранное. Пустой ID не сохраняется, повтор не создаёт дубликат */
export const addFavoriteThunk = (skillId: string): FavoritesThunk =>
  updateFavorites((ids) => (!skillId.trim() || ids.includes(skillId) ? ids : [...ids, skillId]))

/** Удаляет навык из избранного. Удаление отсутствующего ID безопасно */
export const removeFavoriteThunk = (skillId: string): FavoritesThunk =>
  updateFavorites((ids) => ids.filter((id) => id !== skillId))

/** Восстанавливает список из хранилища. При ошибке прежние ID в модели сохраняются */
export const restoreFavoritesThunk = (): FavoritesThunk => (dispatch, getState) => {
  try {
    const { ownerId } = getState().favorites
    const ids = readFavoriteIds(ownerId)
    const localLikeCounts = readFavoriteLikeCounts({ ownerId, ids })
    dispatch(favoritesSnapshotRestored({ ids, localLikeCounts }))
    return true
  } catch (error) {
    dispatch(setFavoritesError(getErrorMessage(error)))
    return false
  }
}

/** Сначала убирает данные прежнего владельца, затем читает выбранный список. */
export const switchFavoritesOwner =
  (ownerId: string | null): FavoritesThunk =>
  (dispatch) => {
    dispatch(favoritesOwnerChanged(ownerId))
    return dispatch(restoreFavoritesThunk())
  }

/** Подписка приложения; возвращает cleanup и не зависит от авторизации. */
export const subscribeFavoritesStorage = (): FavoritesThunk<() => void> => (dispatch, getState) => {
  const onStorage = (event: StorageEvent) => {
    if (!isFavoritesStorageKey(event.key)) return
    try {
      if (event.storageArea !== null && event.storageArea !== localStorage) return
      if (event.key === null || event.key === getFavoritesKey(getState().favorites.ownerId)) {
        dispatch(restoreFavoritesThunk())
      } else {
        dispatch(setLocalLikeCounts(readFavoriteLikeCounts()))
      }
    } catch (error) {
      dispatch(setFavoritesError(getErrorMessage(error)))
    }
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}
