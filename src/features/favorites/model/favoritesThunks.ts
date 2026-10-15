import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit'
import { clearFavoritesError, restoreFavorites, setFavoritesError } from './favoritesSlice'
import { readFavoriteIds, writeFavoriteIds } from './favoritesStorage'

type FavoritesThunk = ThunkAction<boolean, unknown, unknown, UnknownAction>

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Неизвестная ошибка избранного'

const updateFavorites =
  (getNextIds: (ids: string[]) => string[]): FavoritesThunk =>
  (dispatch) => {
    let currentIds: string[]

    try {
      currentIds = readFavoriteIds()
    } catch (error) {
      dispatch(setFavoritesError(getErrorMessage(error)))
      return false
    }

    const nextIds = getNextIds(currentIds)

    try {
      writeFavoriteIds(nextIds)
    } catch (error) {
      dispatch(setFavoritesError(getErrorMessage(error)))
      return false
    }

    dispatch(restoreFavorites(nextIds))
    dispatch(clearFavoritesError())
    return true
  }

/** Добавляет навык в избранное. Пустой ID не сохраняется, повтор не создаёт дубликат */
export const addFavoriteThunk = (skillId: string): FavoritesThunk =>
  updateFavorites((ids) => (!skillId.trim() || ids.includes(skillId) ? ids : [...ids, skillId]))

/** Удаляет навык из избранного. Удаление отсутствующего ID безопасно */
export const removeFavoriteThunk = (skillId: string): FavoritesThunk =>
  updateFavorites((ids) => ids.filter((id) => id !== skillId))

/** Восстанавливает список из хранилища. При ошибке прежние ID в модели сохраняются */
export const restoreFavoritesThunk = (): FavoritesThunk => (dispatch) => {
  try {
    dispatch(restoreFavorites(readFavoriteIds()))
    dispatch(clearFavoritesError())
    return true
  } catch (error) {
    dispatch(setFavoritesError(getErrorMessage(error)))
    return false
  }
}
