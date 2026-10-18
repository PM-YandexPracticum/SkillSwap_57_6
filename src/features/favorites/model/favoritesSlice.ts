import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

export interface FavoritesState {
  ids: string[]
  error: string | null
}

const initialState: FavoritesState = {
  ids: [],
  error: null,
}

/**
  Нормализует входящий ID:
  - принимает только строки,
  - обрезает пробелы по краям,
  - отбрасывает пустые строки и строки из одних пробелов.
 */
const normalizeId = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    /** Добавляет skill.id в избранное. Дубликаты и пустые ID игнорируются. */
    addFavorite(state, action: PayloadAction<string>) {
      const id = normalizeId(action.payload)
      if (!id) return
      if (state.ids.includes(id)) return
      state.ids.push(id)
    },

    /** Удаляет skill.id из избранного. Если ID нет — ничего не делает. */
    removeFavorite(state, action: PayloadAction<string>) {
      const id = normalizeId(action.payload)
      if (!id) return
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

      // Проходим по массиву, нормализуем и оставляем только первые вхождения
      for (const raw of action.payload) {
        const id = normalizeId(raw)
        if (!id) continue
        if (seen.has(id)) continue
        seen.add(id)
        unique.push(id)
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
} = favoritesSlice.actions

// Selectors
export const selectFavoriteIds = (state: RootState): string[] => state.favorites.ids

export const selectFavoritesError = (state: RootState): string | null => state.favorites.error

/**
 * Мемоизированный селектор: возвращает функцию `(skillId) => boolean`.
 * Общий `Set` пересобирается только при изменении `ids`.
 */
export const selectIsFavorite = createSelector(
  [(state: RootState) => state.favorites.ids],
  (ids) => {
    // Общий Set для всех проверок, пока `ids` не изменится
    const idsSet = new Set(ids)
    return (skillId: string): boolean => {
      const normalized = normalizeId(skillId)
      if (!normalized) return false
      return idsSet.has(normalized)
    }
  },
)

export default favoritesSlice.reducer
