import type { CatalogItem, SkillCategory, SkillType } from '@/shared/types'

export function filterCatalog(
  items: CatalogItem[],
  query: string,
  type: SkillType | 'all' = 'all',
  category: SkillCategory | 'all' = 'all',
): CatalogItem[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery && type === 'all' && category === 'all') {
    return items
  }

  const seenIds = new Set<string>()
  const result: CatalogItem[] = []

  for (const item of items) {
    const userId = item.user.id

    if (seenIds.has(userId)) {
      continue
    }

    // Все активные условия должны совпасть у одного навыка.
    const hasMatchingSkill = item.skills.some(
      (skill) =>
        (!normalizedQuery || skill.title.toLowerCase().includes(normalizedQuery)) &&
        (type === 'all' || skill.type === type) &&
        (category === 'all' || skill.category === category),
    )

    if (hasMatchingSkill) {
      seenIds.add(userId)
      result.push(item)
    }
  }

  return result
}
