import type { Gender } from '@/shared/types'

export interface RegistrationPersonalDraft {
  name: string
  birthDate: Date | null
  gender: Gender | ''
  city: string
}

export interface RegistrationProfileDraft extends RegistrationPersonalDraft {
  avatarFile: File | null
  learnCategories: string[]
  learnSubcategories: string[]
}

export interface AvatarSettings {
  acceptedTypes: string[]
  maxSizeBytes?: number
}

export type RegistrationPersonalErrors = Partial<Record<keyof RegistrationPersonalDraft, string>>
export type RegistrationProfileErrors = Partial<Record<keyof RegistrationProfileDraft, string>>
