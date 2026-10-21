import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { store } from '@/store'
import { selectFavoriteIds, selectIsFavorite, selectLocalLikeCount } from './favoritesSlice'
import {
  addFavoriteThunk,
  removeFavoriteThunk,
  restoreFavoritesThunk,
  subscribeFavoritesStorage,
  switchFavoritesOwner,
} from './favoritesThunks'
import { getFavoritesKey } from './favoritesStorage'

const save = (owner: string | null, ids: string[]) =>
  localStorage.setItem(getFavoritesKey(owner), JSON.stringify(ids))
const ids = () => selectFavoriteIds(store.getState())
const likes = (id: string) => selectLocalLikeCount(id)(store.getState())

beforeEach(() => {
  localStorage.clear()
  store.dispatch(switchFavoritesOwner(null))
})
afterEach(() => vi.restoreAllMocks())

it('keeps guest, A and B separate and restores persisted likes without duplicates', () => {
  save(null, ['shared', 'shared', 'guest'])
  save('A', ['shared', 'A'])
  save('B', ['B'])
  for (const owner of [null, 'A', 'B', 'A']) {
    expect(store.dispatch(switchFavoritesOwner(owner))).toBe(true)
    expect(ids()).toEqual(
      owner === null ? ['shared', 'guest'] : owner === 'A' ? ['shared', 'A'] : ['B'],
    )
    expect(likes('shared')).toBe(2)
  }
  expect(store.dispatch(removeFavoriteThunk('shared'))).toBe(true)
  expect(likes('shared')).toBe(1)
  expect(selectIsFavorite('shared')(store.getState())).toBe(false)
  expect(store.dispatch(restoreFavoritesThunk())).toBe(true)
  expect(likes('shared')).toBe(1)
  expect(JSON.parse(localStorage.getItem(getFavoritesKey())!)).toEqual([
    'shared',
    'shared',
    'guest',
  ])
})

it('reads fresh data and keeps the model and storage unchanged on write failure', () => {
  store.dispatch(switchFavoritesOwner('A'))
  save('A', ['external'])
  expect(store.dispatch(addFavoriteThunk('mine'))).toBe(true)
  expect(ids()).toEqual(['external', 'mine'])
  const before = localStorage.getItem(getFavoritesKey('A'))
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota')
  })
  expect(store.dispatch(removeFavoriteThunk('mine'))).toBe(false)
  expect(ids()).toEqual(['external', 'mine'])
  expect(likes('mine')).toBe(1)
  expect(localStorage.getItem(getFavoritesKey('A'))).toBe(before)
})

it('clears previous ids before a failed owner switch and preserves damaged data', () => {
  store.dispatch(addFavoriteThunk('guest'))
  localStorage.setItem(getFavoritesKey('A'), 'broken')
  expect(store.dispatch(switchFavoritesOwner('A'))).toBe(false)
  expect(ids()).toEqual([])
  expect(store.getState().favorites.error).toBeTruthy()
  expect(store.dispatch(addFavoriteThunk('mine'))).toBe(false)
  expect(localStorage.getItem(getFavoritesKey('A'))).toBe('broken')
})

it('syncs other accounts, the current list and storage.clear, and cleans up the listener', () => {
  const cleanup = store.dispatch(subscribeFavoritesStorage())
  const emit = (key: string | null) => window.dispatchEvent(new StorageEvent('storage', { key }))
  try {
    save('A', ['remote'])
    emit(getFavoritesKey('A'))
    expect(ids()).toEqual([])
    expect(likes('remote')).toBe(1)
    save(null, ['guest'])
    emit(getFavoritesKey())
    expect(ids()).toEqual(['guest'])
    localStorage.clear()
    emit(null)
    expect(ids()).toEqual([])
    expect(likes('remote')).toBe(0)
  } finally {
    cleanup()
  }
  save(null, ['after-cleanup'])
  emit(getFavoritesKey())
  expect(ids()).toEqual([])
})
