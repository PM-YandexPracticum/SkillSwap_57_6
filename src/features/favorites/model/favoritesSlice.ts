import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
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

/**
 * Проверяет, что ID является валидной непустой строкой.
 * Возвращает исходную строку, если она непустая после trim.
 */
const isValidId = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0
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
      const id = action.payload
      if (!isValidId(id)) return
      if (state.ids.includes(id)) return
      state.ids.push(id)
    },

    /** Удаляет skill.id из избранного. Если ID нет — ничего не делает. */
    removeFavorite(state, action: PayloadAction<string>) {
      const id = action.payload
      if (!isValidId(id)) return
      if (!state.ids.includes(id)) return
      state.ids = state.ids.filter((existing) => existing !== id)
    },

    /**
     * Заменяет список избранного переданными ID.
     * Дубликаты удаляются. Пустой массив очищает список.
     */
    restoreFavorites(state, action: PayloadAction<string[]>) {
      const unique: string[] = []
      const seen = new Set<string>()

      // Проходим по массиву, оставляем только валидные первые вхождения
      for (const raw of action.payload) {
        if (!isValidId(raw)) continue
        if (seen.has(raw)) continue
        seen.add(raw)
        unique.push(raw)
      }

      state.ids = unique
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

/**
 * Мемоизированный селектор: возвращает функцию `(skillId) => boolean`.
 * Общий `Set` пересобирается только при изменении `ids`.
 */
const selectFavoriteIdsSet = createSelector(
  [selectFavoriteIds],
  (ids): ReadonlySet<string> => new Set(ids),
)

export const selectIsFavorite =
  (skillId: string) =>
  (state: RootState): boolean =>
    isValidId(skillId) && selectFavoriteIdsSet(state).has(skillId)

export const selectLocalLikeCount =
  (skillId: string) =>
  (state: { favorites: Pick<FavoritesState, 'localLikeCounts'> }): number => {
    const count = state.favorites.localLikeCounts[skillId]
    return typeof count === 'number' ? count : 0
  }

export default favoritesSlice.reducer
