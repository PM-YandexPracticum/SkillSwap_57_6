import type { Skill, User } from '@/shared/types'

export function assertSingleTeachPerUser(users: readonly User[], skills: readonly Skill[]): void {
  const userIds = new Set(users.map((user) => user.id))
  const teachCountByAuthor = new Map<string, number>()

  skills.forEach((skill) => {
    if (skill.type !== 'teach') return

    if (!userIds.has(skill.authorId)) {
      throw new Error(`Навык teach ссылается на неизвестного автора: ${skill.authorId}`)
    }

    teachCountByAuthor.set(skill.authorId, (teachCountByAuthor.get(skill.authorId) ?? 0) + 1)
  })

  users.forEach((user) => {
    const teachCount = teachCountByAuthor.get(user.id) ?? 0

    if (teachCount !== 1) {
      throw new Error(
        `У пользователя ${user.id} должен быть ровно один навык teach, найдено: ${teachCount}`,
      )
    }
  })
}
