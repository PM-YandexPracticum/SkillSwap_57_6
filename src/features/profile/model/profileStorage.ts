import { validateCredentials } from '@/features/auth/model/Credentials'
import { LOCAL_STORAGE_KEYS } from '@/shared/lib/constants'
import { calculateAge, isValidBirthDate } from '@/shared/lib/profileDate'
import type { User } from '@/shared/types'

export type ProfilePatch = Partial<
  Pick<User, 'name' | 'email' | 'avatarUrl' | 'birthDate' | 'city' | 'description'>
>
export type ProfileOverrides = Record<string, ProfilePatch>
export interface ProfileSnapshot {
  version: 1
  profiles: ProfileOverrides
  passwordOverrides: Record<string, string>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
export const normalizeEmail = (email: string) => email.trim().toLowerCase()
export const isValidProfilePassword = (password: unknown): password is string =>
  typeof password === 'string' &&
  !validateCredentials({ email: 'profile@example.test', password }, 'register').password

export function assertProfilePatch(value: unknown): asserts value is ProfilePatch {
  if (
    !isRecord(value) ||
    !Object.entries(value).every(([key, field]) => {
      if (key === 'avatarUrl') {
        return (
          field === null ||
          (typeof field === 'string' && !!field.trim() && !/^\s*blob:/i.test(field))
        )
      }
      if (typeof field !== 'string') return false
      if (key === 'birthDate') return isValidBirthDate(field)
      if (key === 'email') return !validateCredentials({ email: field }, 'login').email
      if (key === 'name' || key === 'city') return !!field.trim()
      return key === 'description'
    })
  )
    throw new Error('Некорректные изменения профиля')
}

export function readProfileSnapshot(): ProfileSnapshot {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.PROFILE_OVERRIDES)
  if (raw === null) return { version: 1, profiles: {}, passwordOverrides: {} }
  const value: unknown = JSON.parse(raw)
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    Object.keys(value).some((key) => !['version', 'profiles', 'passwordOverrides'].includes(key)) ||
    !isRecord(value.profiles) ||
    !isRecord(value.passwordOverrides)
  )
    throw new Error('Повреждённый снимок профилей')
  for (const [id, patch] of Object.entries(value.profiles)) {
    if (!id.trim()) throw new Error('Некорректный userId профиля')
    assertProfilePatch(patch)
  }
  if (
    !Object.entries(value.passwordOverrides).every(
      ([id, password]) => id.trim() && isValidProfilePassword(password),
    )
  ) {
    throw new Error('Некорректная запись mock-пароля')
  }
  return value as unknown as ProfileSnapshot
}

export function applyProfileOverrides(user: User, profiles: ProfileOverrides): User {
  const patch = Object.prototype.hasOwnProperty.call(profiles, user.id) ? profiles[user.id] : {}
  const result = { ...user, ...patch }
  if (result.birthDate) result.age = calculateAge(result.birthDate) ?? user.age
  return result
}
