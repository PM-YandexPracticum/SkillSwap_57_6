import { createSelector } from '@reduxjs/toolkit'
import { selectLocalLikeCount } from '@/features/favorites/model/favoritesSlice'
import { applyProfileOverrides } from '@/features/profile/model/profileStorage'
import { assertSingleTeachPerUser } from '@/shared/lib/skillRules'
import type { RootState } from '@/store'
import { buildCatalogItems, shuffleItems, sortByNewest, sortByPopularity } from './catalogData'

const mergeById = <T extends { id: string }>(base: T[], local: T[]): T[] => [
  ...new Map([...base, ...local].map((entry) => [entry.id, entry])).values(),
]

const selectMergedCatalog = createSelector(
  [
    (state: RootState) => state.catalog.users,
    (state: RootState) => state.catalog.skills,
    (state: RootState) => state.localData.users,
    (state: RootState) => state.localData.skills,
    (state: RootState) => state.localData.readError,
  ],
  (jsonUsers, jsonSkills, localUsers, localSkills, readError) => {
    const fallback = { users: jsonUsers, skills: jsonSkills, mergeError: null }
    if (readError) return fallback
    try {
      const users = mergeById(jsonUsers, localUsers)
      const skills = mergeById(jsonSkills, localSkills)
      assertSingleTeachPerUser(users, skills)
      return { users, skills, mergeError: null }
    } catch (error) {
      return {
        ...fallback,
        mergeError: error instanceof Error ? error.message : 'Не удалось объединить каталог',
      }
    }
  },
)

/** Публичные данные для каталога и подробностей; пароли сюда не попадают. */
export const selectCatalogData = createSelector(
  [
    selectMergedCatalog,
    (state: RootState) => state.profile.profiles,
    (state: RootState) => state.favorites.localLikeCounts,
  ],
  ({ users, skills, mergeError }, profiles, localLikeCounts) => ({
    users: users.map((user) => {
      const teach = skills.find((skill) => skill.authorId === user.id && skill.type === 'teach')
      return {
        ...applyProfileOverrides(user, profiles),
        likesCount:
          user.likesCount +
          (teach ? selectLocalLikeCount(teach.id)({ favorites: { localLikeCounts } }) : 0),
      }
    }),
    skills,
    mergeError,
  }),
)
export const selectCatalogUsers = createSelector([selectCatalogData], (data) => data.users)
export const selectCatalogSkills = createSelector([selectMergedCatalog], (data) => data.skills)
export const selectCatalogMergeError = createSelector(
  [selectMergedCatalog],
  (data) => data.mergeError,
)
export const selectCatalogItems = createSelector(
  [selectCatalogUsers, selectCatalogSkills],
  buildCatalogItems,
)
export const selectPopularItems = createSelector([selectCatalogItems], sortByPopularity)
export const selectNewestItems = createSelector([selectCatalogItems], sortByNewest)

const selectCatalogIds = createSelector(
  [selectCatalogItems],
  (items) => items.map(({ user }) => user.id),
  {
    memoizeOptions: {
      resultEqualityCheck: (a: string[], b: string[]) =>
        a.length === b.length && a.every((id, index) => id === b[index]),
    },
  },
)
const selectRecommendationOrder = createSelector([selectCatalogIds], shuffleItems)
export const selectRecommendedItems = createSelector(
  [selectCatalogItems, selectRecommendationOrder],
  (items, ids) => {
    const rank = new Map(ids.map((id, index) => [id, index]))
    return [...items].sort((a, b) => rank.get(a.user.id)! - rank.get(b.user.id)!)
  },
)
