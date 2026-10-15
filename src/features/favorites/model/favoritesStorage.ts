import { LOCAL_STORAGE_KEYS } from '@/shared/lib/constants'

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== ''

export function readFavoriteIds(): string[] {
  let raw: string | null

  try {
    raw = localStorage.getItem(LOCAL_STORAGE_KEYS.FAVORITES)
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

export function writeFavoriteIds(ids: string[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.FAVORITES, JSON.stringify(ids))
  } catch {
    throw new Error('Не удалось сохранить избранное')
  }
}
