import type { CatalogItem, SkillCategory, SkillType } from '@/shared/types'

export function filterCatalog(
  items: CatalogItem[],
  query: string,
  type: SkillType | 'all' = 'all',
  category: SkillCategory | 'all' = 'all',
  subcategory = '',
): CatalogItem[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery && type === 'all' && category === 'all' && !subcategory) {
    return items
  }

  const seenIds = new Set<string>()
  const result: CatalogItem[] = []

  for (const item of items) {
    const userId = item.user.id

    if (seenIds.has(userId)) {
      continue
    }

    const hasMatchingSkill = item.skills.some(
      (skill) =>
        (!normalizedQuery || skill.title.toLowerCase().includes(normalizedQuery)) &&
        (type === 'all' || skill.type === type) &&
        (category === 'all' || skill.category === category) &&
        (!subcategory || skill.tags.includes(subcategory)),
    )

    if (hasMatchingSkill) {
      seenIds.add(userId)
      result.push(item)
    }
  }

  return result
}
