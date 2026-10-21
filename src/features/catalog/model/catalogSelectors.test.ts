import { readFileSync } from 'node:fs'
import { beforeEach, expect, it } from 'vitest'
import { store } from '@/store'
import type { Skill, User } from '@/shared/types'
import { LOCAL_STORAGE_KEYS } from '@/shared/lib/constants'
import { restoreLocalData } from '@/features/localData/model/localDataSlice'
import { writeLocalDataSnapshot } from '@/features/localData/model/localDataStorage'
import { restoreProfiles } from '@/features/profile/model/profileSlice'
import { addFavoriteThunk, switchFavoritesOwner } from '@/features/favorites/model/favoritesThunks'
import { getCatalogThunk } from './catalogSlice'
import {
  selectCatalogData,
  selectCatalogItems,
  selectPopularItems,
  selectRecommendedItems,
} from './catalogSelectors'

const users: User[] = JSON.parse(readFileSync('public/db/users.json', 'utf8'))
const skills: Skill[] = JSON.parse(readFileSync('public/db/skills.json', 'utf8'))
const user = (id: string, likesCount = 0) => ({ ...users[0], id, likesCount })
const skill = (authorId: string, type: Skill['type'] = 'teach') => ({
  ...skills[0],
  id: `${authorId}-${type}`,
  authorId,
  type,
})
const json = {
  users: [user('A'), user('B', 1)],
  skills: [skill('A'), skill('A', 'learn'), skill('B')],
}
const data = () => selectCatalogData(store.getState())
const ids = () => selectRecommendedItems(store.getState()).map(({ user }) => user.id)
function saveLocal(users: User[], skills: Skill[]) {
  const credentials = users.map(({ id }) => ({ userId: id, password: 'test' }))
  writeLocalDataSnapshot({ version: 1, users, skills, credentials })
  expect(store.dispatch(restoreLocalData())).toBe(true)
}
beforeEach(() => {
  localStorage.clear()
  store.dispatch(restoreLocalData())
  store.dispatch(restoreProfiles())
  store.dispatch(switchFavoritesOwner(null))
  store.dispatch(getCatalogThunk.fulfilled(json, 'test', undefined))
})

it('merges local IDs and profile fields without duplicates or mutation, including after restore', () => {
  const original = JSON.stringify(json)
  saveLocal([user('A', 5), user('C')], [skill('A'), skill('C')])
  const patch = {
    name: 'Profile',
    email: 'new@example.test',
    avatarUrl: 'data:image/png;base64,AA',
    city: 'Казань',
    birthDate: '2000-01-01',
    description: 'О себе',
  }
  const snapshot = { version: 1, profiles: { A: patch }, passwordOverrides: {} }
  localStorage.setItem(LOCAL_STORAGE_KEYS.PROFILE_OVERRIDES, JSON.stringify(snapshot))
  store.dispatch(restoreProfiles())
  const items = selectCatalogItems(store.getState())
  expect(items.map(({ user }) => user.id)).toEqual(['A', 'B', 'C'])
  expect(items[0].user).toMatchObject({
    ...patch,
    age: new Date().getFullYear() - 2000,
    likesCount: 5,
  })
  expect(items[0].skills.map(({ id }) => id)).toEqual(['A-teach', 'A-learn'])
  expect(JSON.stringify(json)).toBe(original)
  expect(selectCatalogItems({ ...store.getState() })).toBe(items)
  store.dispatch(restoreLocalData())
  store.dispatch(restoreProfiles())
  expect(selectCatalogItems(store.getState())).toEqual(items)
})

it('updates popularity from separate lists while keeping recommendations stable and ignoring learn likes', () => {
  const order = ids()
  store.dispatch(addFavoriteThunk('A-teach'))
  store.dispatch(switchFavoritesOwner('account'))
  store.dispatch(addFavoriteThunk('A-teach'))
  expect(selectPopularItems(store.getState())[0].user).toMatchObject({ id: 'A', likesCount: 2 })
  expect(ids()).toEqual(order)
  store.dispatch(addFavoriteThunk('A-learn'))
  store.dispatch(switchFavoritesOwner(null))
  expect(data().users[0].likesCount).toBe(2)
  expect(ids()).toEqual(order)
})

it('preserves invalid storage, falls back to JSON on teach conflicts and recovers after retry', () => {
  saveLocal([user('A')], [{ ...skill('A'), id: 'conflict' }])
  const snapshot = localStorage.getItem(LOCAL_STORAGE_KEYS.PROJECT_DATA)
  expect(data().mergeError).toContain('ровно один')
  expect(data().skills).toEqual(json.skills)
  expect(localStorage.getItem(LOCAL_STORAGE_KEYS.PROJECT_DATA)).toBe(snapshot)
  saveLocal([user('A')], [skill('A')])
  expect(data().mergeError).toBeNull()
  const retries = [restoreLocalData, restoreProfiles]
  const keys = [LOCAL_STORAGE_KEYS.PROJECT_DATA, LOCAL_STORAGE_KEYS.PROFILE_OVERRIDES]
  keys.forEach((key, index) => {
    localStorage.setItem(key, 'broken')
    expect(store.dispatch(retries[index]())).toBe(false)
    expect(data().users.map(({ id }) => id)).toEqual(['A', 'B'])
    expect(localStorage.getItem(key)).toBe('broken')
    localStorage.removeItem(key)
    expect(store.dispatch(retries[index]())).toBe(true)
  })
})
