import { createSelector } from '@reduxjs/toolkit'
import { selectCatalogData } from '@/features/catalog/model/catalogSelectors'
import type { CatalogItem } from '@/shared/types'
import { selectFavoriteIds } from './favoritesSlice'

export const selectFavoriteEntries = createSelector(
  [selectCatalogData, selectFavoriteIds],
  ({ users, skills }, ids) => {
    const usersById = new Map(users.map((user) => [user.id, user]))
    const skillsById = new Map(skills.map((skill) => [skill.id, skill]))
    const authors = new Set<string>()
    const items: CatalogItem[] = []
    let missingAuthor = false
    for (const id of ids) {
      const skill = skillsById.get(id)
      if (!skill || skill.type !== 'teach' || authors.has(skill.authorId)) continue
      const user = usersById.get(skill.authorId)
      if (!user) {
        missingAuthor = true
        continue
      }
      authors.add(user.id)
      items.push({ user, skills: [skill] })
    }
    return { items, missingAuthor }
  },
)
