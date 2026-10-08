// ─── Skill ───────────────────────────────────────────────
export type SkillType = 'teach' | 'learn'

export interface Skill {
  id: string
  title: string
  description: string
  type: SkillType
  category: string
  tags: string[]
  imageUrl: string | null
  authorId: string
  createdAt: string
}

// ─── User ────────────────────────────────────────────────
export type Gender = 'male' | 'female' | 'other'

export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  createdAt: string
  age: number
  gender: Gender
  city: string
  description: string
  likesCount: number
}

// ─── Request ─────────────────────────────────────────────
export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'inProgress' | 'done'

export interface SwapRequest {
  id: string
  skillId: string
  fromUserId: string
  toUserId: string
  status: RequestStatus
  createdAt: string
  updatedAt: string
}

// ─── City ────────────────────────────────────────────────
export interface City {
  name: string
}

// ─── Auth ────────────────────────────────────────────────
export interface AuthUser {
  id: string
  name: string
  email: string
  token: string
}

type CatalogStatus = 'idle' | 'loading' | 'success' | 'error'

export type TCatalogData = {
  users: User[]
  skills: Skill[]
  status: CatalogStatus
  error: string | null
}

export interface CatalogItem {
  user: User
  skills: Skill[]
}
