import type { Skill, User } from '@/shared/types'

export interface LocalCredential {
  userId: string
  password: string
}

export interface LocalDataSnapshot {
  version: 1
  users: User[]
  skills: Skill[]
  credentials: LocalCredential[]
}
