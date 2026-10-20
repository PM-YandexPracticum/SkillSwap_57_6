import { LOCAL_STORAGE_KEYS } from '@/shared/lib/constants'

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== ''

export const getFavoritesKey = (ownerId: string | null = null): string =>
  ownerId === null ? LOCAL_STORAGE_KEYS.FAVORITES : `${LOCAL_STORAGE_KEYS.FAVORITES}:${ownerId}`

export const isFavoritesStorageKey = (key: string | null): boolean =>
  key === null || key === getFavoritesKey() || key.startsWith(`${getFavoritesKey()}:`)

export function readFavoriteIds(ownerId: string | null = null): string[] {
  let raw: string | null

  try {
    raw = localStorage.getItem(getFavoritesKey(ownerId))
  } catch {
    throw new Error('Не удалось прочитать избранное')
  }

  if (raw === null) return []

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Сохранённое избранное повреждено')
  }

  if (!Array.isArray(parsed) || !parsed.every(isNonEmptyString)) {
    throw new Error('Сохранённое избранное имеет неверный формат')
  }

  return Array.from(new Set(parsed))
}

/** Позволяет рассчитать индекс следующего снимка до записи выбранного списка. */
export function readFavoriteLikeCounts(current?: {
  ownerId: string | null
  ids: string[]
}): Record<string, number> {
  const counts: Record<string, number> = Object.create(null)
  const owners = new Set<string | null>([null])
  if (current) owners.add(current.ownerId)
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index)
      if (key !== null && key.startsWith(`${getFavoritesKey()}:`)) {
        owners.add(key.slice(getFavoritesKey().length + 1))
      }
    }
  } catch {
    throw new Error('Не удалось прочитать списки избранного')
  }
  for (const owner of owners) {
    const ids = current && current.ownerId === owner ? current.ids : readFavoriteIds(owner)
    for (const id of new Set(ids)) counts[id] = (counts[id] ?? 0) + 1
  }
  return counts
}

export function writeFavoriteIds(ids: string[], ownerId: string | null = null): void {
  try {
    localStorage.setItem(getFavoritesKey(ownerId), JSON.stringify(ids))
  } catch {
    throw new Error('Не удалось сохранить избранное')
  }
}
