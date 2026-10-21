import type { Skill } from './types'

export function getSkillImageUrls(skill: Skill): string[] {
  return skill.imageUrls ?? (skill.imageUrl ? [skill.imageUrl] : [])
}
