import type { Skill, User } from '@/shared/types'

export interface CatalogItem {
  user: User
  skills: Skill[]
}

/** Объединяет пользователей с их навыками по Skill.authorId */
export function buildCatalogItems(users: User[], skills: Skill[]): CatalogItem[] {
  const skillsByAuthor = new Map<string, Skill[]>()

  skills.forEach((skill) => {
    const authorSkills = skillsByAuthor.get(skill.authorId)

    if (authorSkills) {
      authorSkills.push(skill)
    } else {
      skillsByAuthor.set(skill.authorId, [skill])
    }
  })

  return users.map((user) => ({
    user,
    skills: skillsByAuthor.get(user.id) ?? [],
  }))
}

/** «Популярные»: по убыванию User.likesCount */
export function sortByPopularity(items: CatalogItem[]): CatalogItem[] {
  return [...items].sort((a, b) => b.user.likesCount - a.user.likesCount)
}

/** «Новые»: по убыванию User.createdAt */
export function sortByNewest(items: CatalogItem[]): CatalogItem[] {
  return [...items].sort((a, b) => Date.parse(b.user.createdAt) - Date.parse(a.user.createdAt))
}

/** «Рекомендуем»: случайный порядок */
export function shuffleItems(items: CatalogItem[]): CatalogItem[] {
  const shuffled = [...items]

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = current
  }

  return shuffled
}
