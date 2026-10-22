import { configureStore } from '@reduxjs/toolkit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import localDataReducer from '@/features/localData/model/localDataSlice'
import type { RegistrationSkillDraft } from '@/entities/skill/model/registrationSkillDraft'
import { LOCAL_STORAGE_KEYS } from '@/shared/lib/constants'
import { calculateAge } from '@/shared/lib/profileDate'
import type { User } from '@/shared/types'
import type { Credentials } from './Credentials'
import { registerFullAccount } from './registration'
import type { AvatarSettings, RegistrationProfileDraft } from './registrationTypes'

const cities = [{ name: 'Москва' }, { name: 'Казань' }]
const avatarSettings: AvatarSettings = { acceptedTypes: ['image/png', 'image/jpeg'] }

const jsonUser: User = {
  id: 'user-01',
  name: 'Анна',
  email: 'anna@example.com',
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  age: 30,
  gender: 'female',
  city: 'Москва',
  description: '',
  likesCount: 0,
}

const image = (name: string) => new File(['image'], name, { type: 'image/png' })

function createCredentials(email = '  New@Example.com '): Credentials {
  return { email, password: 'password123' }
}

function createProfile(): RegistrationProfileDraft {
  return {
    name: '  Мария  ',
    birthDate: new Date(2000, 4, 15),
    gender: 'female',
    city: 'Казань',
    avatarFile: image('avatar.png'),
    learnCategories: ['Иностранные языки', 'Дом и уют'],
    learnSubcategories: ['Английский', 'Немецкий'],
  }
}

function createSkill(): RegistrationSkillDraft {
  return {
    title: '  Гитара  ',
    description: 'Учу играть',
    type: 'teach',
    category: 'Творчество и искусство',
    tags: ['Музыка и звук'],
    imageFiles: [image('first.png'), image('second.png')],
  }
}

function setup() {
  const store = configureStore({ reducer: { localData: localDataReducer } })
  const register = (
    credentials = createCredentials(),
    profile = createProfile(),
    skill = createSkill(),
  ) => store.dispatch(registerFullAccount(credentials, profile, skill, cities, avatarSettings))
  return { store, register }
}

const readProjectData = () => {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.PROJECT_DATA)
  return raw === null ? null : JSON.parse(raw)
}

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => [jsonUser] })),
  )
  HTMLImageElement.prototype.decode ??= () => Promise.resolve()
  vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue(undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('registerFullAccount', () => {
  it('maps the account, date, interests and photos into one PROJECT_DATA snapshot', async () => {
    const { register } = setup()
    const account = await register()
    const data = readProjectData()
    const [user] = data.users
    const [teach, ...learns] = data.skills

    expect(account).toEqual({ id: user.id, name: 'Мария', email: 'new@example.com' })
    expect(user).toMatchObject({
      name: 'Мария',
      email: 'new@example.com',
      birthDate: '2000-05-15',
      age: calculateAge('2000-05-15'),
      gender: 'female',
      city: 'Казань',
      description: '',
      likesCount: 0,
    })
    expect(user.avatarUrl).toMatch(/^data:image\/png/)
    expect(new Date(user.createdAt).toISOString()).toBe(user.createdAt)
    expect(user).not.toHaveProperty('password')
    expect(data.credentials).toEqual([{ userId: user.id, password: 'password123' }])

    expect(teach).toMatchObject({ type: 'teach', title: 'Гитара', authorId: user.id })
    expect(teach.imageUrls).toHaveLength(2)
    expect(teach.imageUrl).toBe(teach.imageUrls[0])

    expect(
      learns.map(
        ({ title, category, tags }: { title: string; category: string; tags: string[] }) => ({
          title,
          category,
          tags,
        }),
      ),
    ).toEqual([
      { title: 'Английский', category: 'Иностранные языки', tags: ['Английский'] },
      { title: 'Немецкий', category: 'Иностранные языки', tags: ['Немецкий'] },
      { title: 'Дом и уют', category: 'Дом и уют', tags: [] },
    ])
    for (const learn of learns) {
      expect(learn).toMatchObject({
        type: 'learn',
        authorId: user.id,
        description: '',
        imageUrl: null,
        imageUrls: [],
      })
    }
    const ids = data.skills.map((skill: { id: string }) => skill.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('checks emails with fresh profile overrides of JSON users', async () => {
    const { register } = setup()
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.PROFILE_OVERRIDES,
      JSON.stringify({
        version: 1,
        profiles: { 'user-01': { email: 'changed@example.com' } },
        passwordOverrides: {},
      }),
    )

    await expect(register(createCredentials('CHANGED@example.com'))).rejects.toThrow(
      'Этот email уже используется',
    )
    expect(readProjectData()).toBeNull()
    await expect(register(createCredentials('anna@example.com'))).resolves.toMatchObject({
      email: 'anna@example.com',
    })
  })

  it('rejects a duplicate local email without changing the saved snapshot', async () => {
    const { register } = setup()
    await register()
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.PROJECT_DATA)

    await expect(register(createCredentials('new@example.com'))).rejects.toThrow(
      'Этот email уже используется',
    )
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.PROJECT_DATA)).toBe(saved)
  })

  it('uses copies taken before await when drafts change during image reading', async () => {
    const { register } = setup()
    const credentials = createCredentials()
    const profile = createProfile()
    const skill = createSkill()

    const pending = register(credentials, profile, skill)
    credentials.email = 'other@example.com'
    profile.birthDate?.setFullYear(1990)
    profile.learnCategories.push('Бизнес и карьера')
    profile.learnSubcategories.length = 0
    skill.tags[0] = 'Фотография'
    skill.imageFiles.length = 0
    await pending

    const { users, skills } = readProjectData()
    expect(users[0]).toMatchObject({ email: 'new@example.com', birthDate: '2000-05-15' })
    expect(skills[0].tags).toEqual(['Музыка и звук'])
    expect(skills[0].imageUrls).toHaveLength(2)
    expect(skills.map((item: { title: string }) => item.title)).toEqual([
      'Гитара',
      'Английский',
      'Немецкий',
      'Дом и уют',
    ])
  })

  it('rejects atomically on validation, image, reading and write errors', async () => {
    const { store, register } = setup()

    const invalidSkill = { ...createSkill(), tags: [] }
    await expect(register(createCredentials(), createProfile(), invalidSkill)).rejects.toThrow()
    await expect(register(createCredentials('wrong'))).rejects.toThrow()

    vi.mocked(HTMLImageElement.prototype.decode).mockRejectedValueOnce(new Error('broken'))
    await expect(register()).rejects.toThrow('Не удалось декодировать изображение')

    vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'))
    await expect(register()).rejects.toThrow('offline')

    localStorage.setItem(LOCAL_STORAGE_KEYS.PROFILE_OVERRIDES, '{broken')
    await expect(register()).rejects.toThrow()
    localStorage.removeItem(LOCAL_STORAGE_KEYS.PROFILE_OVERRIDES)

    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('quota')
    })
    await expect(register()).rejects.toThrow()

    expect(readProjectData()).toBeNull()
    expect(store.getState().localData.users).toEqual([])
  })
})
