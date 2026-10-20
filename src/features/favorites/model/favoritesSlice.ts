import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

export interface FavoritesState {
  ownerId: string | null
  ids: string[]
  localLikeCounts: Record<string, number>
  error: string | null
}

const initialState: FavoritesState = {
  ownerId: null,
  ids: [],
  localLikeCounts: {},
  error: null,
}

export const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    favoritesOwnerChanged(state, { payload }: PayloadAction<string | null>) {
      state.ownerId = payload
      state.ids = []
      state.error = null
      state.localLikeCounts = {}
    },

    favoritesSnapshotRestored(
      state,
      { payload }: PayloadAction<Pick<FavoritesState, 'ids' | 'localLikeCounts'>>,
    ) {
      state.ids = payload.ids
      state.localLikeCounts = payload.localLikeCounts
      state.error = null
    },

    setLocalLikeCounts(state, { payload }: PayloadAction<Record<string, number>>) {
      state.localLikeCounts = payload
    },

    /** Добавляет skill.id в избранное. Дубликаты игнорируются. */
    addFavorite(state, action: PayloadAction<string>) {
      if (!action.payload) return
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
  favoritesOwnerChanged,
  favoritesSnapshotRestored,
  setLocalLikeCounts,
} = favoritesSlice.actions

// Selectors
export const selectFavoriteIds = (state: RootState): string[] => state.favorites.ids

export const selectFavoritesError = (state: RootState): string | null => state.favorites.error

export const selectIsFavorite =
  (skillId: string) =>
  (state: RootState): boolean =>
    state.favorites.ids.includes(skillId)

export const selectLocalLikeCount =
  (skillId: string) =>
  (state: RootState): number => {
    const count = state.favorites.localLikeCounts[skillId]
    return typeof count === 'number' ? count : 0
  }

export default favoritesSlice.reducer
