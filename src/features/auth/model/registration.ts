import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit'
import { fetchUsers } from '@/api/users'
import { createSkillFromDraft, readImageDataUrl } from '@/entities/skill/model/skillFactory'
import {
  validateRegistrationSkillDraft,
  type RegistrationSkillDraft,
} from '@/entities/skill/model/registrationSkillDraft'
import { commitLocalData } from '@/features/localData/model/localDataSlice'
import type { LocalCredential } from '@/features/localData/model/types'
import {
  applyProfileOverrides,
  normalizeEmail,
  readProfileSnapshot,
} from '@/features/profile/model/profileStorage'
import { generateId } from '@/shared/lib/helpers'
import { calculateAge, formatBirthDate } from '@/shared/lib/profileDate'
import { getCategoryForSubcategory } from '@/shared/lib/skillCategories'
import { assertSingleTeachPerUser } from '@/shared/lib/skillRules'
import type { City, Skill, User } from '@/shared/types'
import { validateCredentials, type Credentials } from './Credentials'
import type { AvatarSettings, RegistrationProfileDraft } from './registrationTypes'
import { validateRegistrationProfileDraft } from './registrationValidation'

export interface RegistrationData {
  user: User
  credential: LocalCredential
  skills: Skill[]
}

export type RegisteredAccount = Pick<User, 'id' | 'name' | 'email'>

function throwIfErrors(errors: Record<string, string | undefined>): void {
  const messages = Object.values(errors).filter(Boolean)
  if (messages.length > 0) throw new Error(messages.join('. '))
}

function createLearnSkill(
  title: string,
  category: string,
  tags: string[],
  authorId: string,
  createdAt: string,
): Skill {
  return {
    id: generateId(),
    title,
    description: '',
    type: 'learn',
    category,
    tags,
    imageUrl: null,
    imageUrls: [],
    authorId,
    createdAt,
  }
}

/** Собирает User, credential, teach и learn нового аккаунта; ничего не записывает. */
export async function buildRegistrationData(
  credentials: Credentials,
  profileDraft: RegistrationProfileDraft,
  skillDraft: RegistrationSkillDraft,
  cities: readonly City[],
  avatarSettings: AvatarSettings,
): Promise<RegistrationData> {
  const account: Credentials = { email: credentials.email, password: credentials.password }
  const profile: RegistrationProfileDraft = {
    ...profileDraft,
    birthDate: profileDraft.birthDate ? new Date(profileDraft.birthDate.getTime()) : null,
    learnCategories: [...profileDraft.learnCategories],
    learnSubcategories: [...profileDraft.learnSubcategories],
  }
  const skill: RegistrationSkillDraft = {
    ...skillDraft,
    tags: [...skillDraft.tags],
    imageFiles: [...skillDraft.imageFiles],
  }

  throwIfErrors(validateCredentials(account, 'register'))
  throwIfErrors(validateRegistrationProfileDraft(profile, cities, avatarSettings))
  throwIfErrors(validateRegistrationSkillDraft(skill))

  const today = new Date()
  const birthDate = profile.birthDate ? formatBirthDate(profile.birthDate) : null
  const age = birthDate ? calculateAge(birthDate, today) : null
  const { avatarFile, gender } = profile
  if (!birthDate || age === null || !avatarFile || !gender) {
    throw new Error('Проверьте данные профиля')
  }

  const userId = generateId()
  const createdAt = today.toISOString()
  const avatarUrl = await readImageDataUrl(avatarFile)
  const teach = await createSkillFromDraft(skill, userId)

  const learns = profile.learnCategories.flatMap((category) => {
    const subcategories = profile.learnSubcategories.filter(
      (subcategory) => getCategoryForSubcategory(subcategory) === category,
    )
    return subcategories.length > 0
      ? subcategories.map((subcategory) =>
          createLearnSkill(subcategory, category, [subcategory], userId, createdAt),
        )
      : [createLearnSkill(category, category, [], userId, createdAt)]
  })

  return {
    user: {
      id: userId,
      name: profile.name.trim(),
      email: normalizeEmail(account.email),
      avatarUrl,
      createdAt,
      age,
      birthDate,
      gender,
      city: profile.city,
      description: '',
      likesCount: 0,
    },
    credential: { userId, password: account.password },
    skills: [teach, ...learns],
  }
}

type RegistrationThunk = ThunkAction<Promise<RegisteredAccount>, unknown, unknown, UnknownAction>

export const registerFullAccount =
  (
    credentials: Credentials,
    profileDraft: RegistrationProfileDraft,
    skillDraft: RegistrationSkillDraft,
    cities: readonly City[],
    avatarSettings: AvatarSettings,
  ): RegistrationThunk =>
  async (dispatch) => {
    const data = await buildRegistrationData(
      credentials,
      profileDraft,
      skillDraft,
      cities,
      avatarSettings,
    )
    const jsonUsers = await fetchUsers()
    let updaterError: unknown = null

    const saved = dispatch(
      commitLocalData((snapshot) => {
        try {
          const { profiles } = readProfileSnapshot()
          const users = [...jsonUsers, ...snapshot.users]
          const skillIds = new Set(snapshot.skills.map((skill) => skill.id))

          if (
            users.some((user) => user.id === data.user.id) ||
            data.skills.some((skill) => skillIds.has(skill.id))
          ) {
            throw new Error('ID нового аккаунта уже используется')
          }
          if (
            users.some(
              (user) =>
                normalizeEmail(applyProfileOverrides(user, profiles).email) === data.user.email,
            )
          ) {
            throw new Error('Этот email уже используется')
          }
          assertSingleTeachPerUser([data.user], data.skills)

          return {
            ...snapshot,
            users: [...snapshot.users, data.user],
            skills: [...snapshot.skills, ...data.skills],
            credentials: [...snapshot.credentials, data.credential],
          }
        } catch (error) {
          updaterError = error
          throw error
        }
      }),
    )

    if (!saved) {
      throw updaterError instanceof Error
        ? updaterError
        : new Error('Не удалось сохранить регистрацию. Повторите попытку.')
    }

    return { id: data.user.id, name: data.user.name, email: data.user.email }
  }
