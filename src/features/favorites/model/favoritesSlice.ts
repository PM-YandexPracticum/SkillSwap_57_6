import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

export interface FavoritesState {
  ids: string[]
  error: string | null
}

const initialState: FavoritesState = {
  ids: [],
  error: null,
}

export const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    /** Добавляет skill.id в избранное. Дубликаты игнорируются. */
    addFavorite(state, action: PayloadAction<string>) {
      if (!state.ids.includes(action.payload)) {
        state.ids.push(action.payload)
      }
    },

    /** Удаляет skill.id из избранного. Если ID нет — ничего не делает. */
    removeFavorite(state, action: PayloadAction<string>) {
      state.ids = state.ids.filter((id) => id !== action.payload)
    },

    /**
     * Заменяет список избранного переданными ID.
     * Дубликаты удаляются. Пустой массив очищает список.
     */
    restoreFavorites(state, action: PayloadAction<string[]>) {
      state.ids = Array.from(new Set(action.payload))
    },

    /** Устанавливает текст ошибки для операций сохранения. */
    setFavoritesError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },

    /** Сбрасывает ошибку. */
    clearFavoritesError(state) {
      state.error = null
    },
  },
})

export const {
  addFavorite,
  removeFavorite,
  restoreFavorites,
  setFavoritesError,
  clearFavoritesError,
} = favoritesSlice.actions

// Selectors
export const selectFavoriteIds = (state: RootState): string[] => state.favorites.ids

export const selectFavoritesError = (state: RootState): string | null => state.favorites.error

export const selectIsFavorite =
  (skillId: string) =>
  (state: RootState): boolean =>
    state.favorites.ids.includes(skillId)

export default favoritesSlice.reducer
