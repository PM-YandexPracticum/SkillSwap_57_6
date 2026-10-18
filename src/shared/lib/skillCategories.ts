import { SKILL_CATEGORY_CATALOGUE, SKILL_SUBCATEGORIES } from '@/shared/lib/constants'
import type { SkillCategory } from '@/shared/types'

export function getSubcategories(category: string): readonly string[] {
  return SKILL_CATEGORY_CATALOGUE.find((item) => item.name === category)?.subcategories ?? []
}

export function getAllSubcategories(): readonly string[] {
  return SKILL_SUBCATEGORIES
}

export function getCategoryForSubcategory(subcategory: string): SkillCategory | undefined {
  return SKILL_CATEGORY_CATALOGUE.find((item) => item.subcategories.includes(subcategory))?.name
}

export function isSubcategoryOfCategory(category: string, subcategory: string): boolean {
  return getSubcategories(category).includes(subcategory)
}
