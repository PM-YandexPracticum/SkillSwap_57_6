import type { Skill, User } from '@/shared/types'

export interface UserCardsGridItem {
  user: User
  skills: Skill[]
}
