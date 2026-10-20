import { LOCAL_STORAGE_KEYS } from '@/shared/lib/constants'
import { isValidBirthDate } from '@/shared/lib/profileDate'
import type { LocalCredential, LocalDataSnapshot } from './types'
import type { Skill, User } from '@/shared/types'
import { assertSingleTeachPerUser } from '@/shared/lib/skillRules'

const LOCAL_DATA_VERSION = 1
const GENDERS: readonly unknown[] = ['male', 'female', 'other']
const SKILL_TYPES: readonly unknown[] = ['teach', 'learn']

export function createEmptyLocalDataSnapshot(): LocalDataSnapshot {
  return { version: LOCAL_DATA_VERSION, users: [], skills: [], credentials: [] }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isString = (value: unknown): value is string => typeof value === 'string'

const isNonEmptyString = (value: unknown): value is string => isString(value) && value.trim() !== ''

const isNonNegativeNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0

const isStoredImageUrl = (value: unknown) =>
  value === null || (isString(value) && !value.startsWith('blob:'))

const hasUniqueValues = (values: string[]) => new Set(values).size === values.length

function isUser(value: unknown): value is User {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isString(value.name) &&
    isString(value.email) &&
    isStoredImageUrl(value.avatarUrl) &&
    isString(value.createdAt) &&
    isNonNegativeNumber(value.age) &&
    (value.birthDate === undefined ||
      (isString(value.birthDate) && isValidBirthDate(value.birthDate))) &&
    GENDERS.includes(value.gender) &&
    isString(value.city) &&
    isString(value.description) &&
    isNonNegativeNumber(value.likesCount)
  )
}

function isSkill(value: unknown): value is Skill {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isString(value.title) &&
    isString(value.description) &&
    SKILL_TYPES.includes(value.type) &&
    isString(value.category) &&
    Array.isArray(value.tags) &&
    value.tags.every(isString) &&
    isStoredImageUrl(value.imageUrl) &&
    (value.imageUrls === undefined ||
      (Array.isArray(value.imageUrls) &&
        value.imageUrls.every((url) => isNonEmptyString(url) && !/^\s*blob:/i.test(url)) &&
        value.imageUrl === (value.imageUrls[0] ?? null))) &&
    isNonEmptyString(value.authorId) &&
    isString(value.createdAt)
  )
}

function isCredential(value: unknown): value is LocalCredential {
  return isRecord(value) && isNonEmptyString(value.userId) && isNonEmptyString(value.password)
}

export function assertLocalDataSnapshot(value: unknown): asserts value is LocalDataSnapshot {
  if (!isRecord(value) || value.version !== LOCAL_DATA_VERSION) {
    throw new Error('Неподдерживаемая версия локальных данных')
  }

  const { users, skills, credentials } = value

  if (!Array.isArray(users) || !users.every(isUser)) {
    throw new Error('Некорректная запись пользователя в локальных данных')
  }
  if (!Array.isArray(skills) || !skills.every(isSkill)) {
    throw new Error('Некорректная запись навыка в локальных данных')
  }
  if (!Array.isArray(credentials) || !credentials.every(isCredential)) {
    throw new Error('Некорректная учётная запись в локальных данных')
  }

  const userIds = users.map((user) => user.id)
  const credentialUserIds = credentials.map((credential) => credential.userId)

  if (!hasUniqueValues(userIds) || !hasUniqueValues(skills.map((skill) => skill.id))) {
    throw new Error('ID пользователей и навыков в локальных данных должны быть уникальными')
  }
  if (
    !hasUniqueValues(credentialUserIds) ||
    credentialUserIds.length !== userIds.length ||
    !userIds.every((id) => credentialUserIds.includes(id))
  ) {
    throw new Error('У каждого локального пользователя должна быть ровно одна учётная запись')
  }

  assertSingleTeachPerUser(users, skills)
}

export function readLocalDataSnapshot(): LocalDataSnapshot {
  let raw: string | null

  try {
    raw = localStorage.getItem(LOCAL_STORAGE_KEYS.PROJECT_DATA)
  } catch {
    throw new Error('Не удалось прочитать локальные данные')
  }

  if (raw === null) return createEmptyLocalDataSnapshot()

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Локальные данные повреждены')
  }

  assertLocalDataSnapshot(parsed)
  return parsed
}

export function writeLocalDataSnapshot(snapshot: LocalDataSnapshot): void {
  assertLocalDataSnapshot(snapshot)

  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PROJECT_DATA, JSON.stringify(snapshot))
  } catch {
    throw new Error('Не удалось сохранить локальные данные')
  }
}
