import { beforeEach, afterEach, expect, it, vi } from 'vitest'

import type { LocalDataSnapshot } from '@/features/localData/model/types'
import { authenticate } from './authenticate'
import type { User, Skill } from '@/shared/types'
import { LOCAL_STORAGE_KEYS } from '@/shared/lib/constants'

import * as usersApi from '@/api/users'
import * as skillsApi from '@/api/skills'

// Тестовый пользователь из JSON.
const jsonUser: User = {
  id: 'user-01',
  name: 'Егор Смирнов',
  email: 'user01@example.com',
  avatarUrl: null,
  createdAt: '2026-01-13',
  age: 26,
  gender: 'male',
  city: 'Пермь',
  description: 'Тестовый пользователь',
  likesCount: 55,
}

// Тестовый навык пользователя из JSON.
const jsonSkill: Skill = {
  id: 'skill-01',
  title: 'Обучение JavaScript',
  description: 'Помогу изучить основы JavaScript',
  type: 'teach',
  category: 'Программирование',
  tags: ['JavaScript'],
  imageUrl: null,
  authorId: jsonUser.id,
  createdAt: '2026-01-13',
}

// Тестовый пользователь, зарегистрированный локально.
const localUser: User = {
  id: 'local-user-01',
  name: 'Анна Петрова',
  email: 'anna@example.com',
  avatarUrl: null,
  createdAt: '2026-10-21',
  age: 28,
  gender: 'female',
  city: 'Москва',
  description: 'Локальный тестовый пользователь',
  likesCount: 0,
}

// Тестовый навык локального пользователя.
const localSkill: Skill = {
  id: 'local-skill-01',
  title: 'Обучение английскому языку',
  description: 'Помогу освоить разговорный английский',
  type: 'teach',
  category: 'Иностранные языки',
  tags: ['Английский язык'],
  imageUrl: null,
  authorId: localUser.id,
  createdAt: '2026-10-21',
}

// Тестовый снимок локальных данных.
const localSnapshot: LocalDataSnapshot = {
  version: 1,
  users: [localUser],
  skills: [localSkill],
  credentials: [
    {
      userId: localUser.id,
      password: 'AnnaPassword123!',
    },
  ],
}

// Перед каждым тестом очищаем localStorage
// и подменяем ответы API пустыми массивами.
beforeEach(() => {
  localStorage.clear()

  vi.spyOn(usersApi, 'fetchUsers').mockResolvedValue([])
  vi.spyOn(skillsApi, 'fetchSkills').mockResolvedValue([])
})

// После каждого теста восстанавливаем исходные функции.
afterEach(() => {
  vi.restoreAllMocks()
})

it('успешно авторизует JSON-пользователя с правильными credentials', async () => {
  // Подменяем ответы API подготовленными тестовыми данными.
  vi.mocked(usersApi.fetchUsers).mockResolvedValue([jsonUser])
  vi.mocked(skillsApi.fetchSkills).mockResolvedValue([jsonSkill])

  // Вызываем тестируемую функцию.
  const result = await authenticate({
    email: '  USER01@EXAMPLE.COM  ',
    password: 'SkillSwap123!',
  })

  // Проверяем результат авторизации.
  expect(result).toEqual({
    id: jsonUser.id,
    name: jsonUser.name,
    email: jsonUser.email,
  })
})

it('отклоняет неверный пароль JSON-пользователя', async () => {
  // Подготавливаем пользователя и его навык.
  vi.mocked(usersApi.fetchUsers).mockResolvedValue([jsonUser])
  vi.mocked(skillsApi.fetchSkills).mockResolvedValue([jsonSkill])

  // Проверяем, что авторизация завершится ошибкой.
  await expect(
    authenticate({
      email: 'user01@example.com',
      password: 'WrongPassword123!',
    }),
  ).rejects.toThrow('Неверный email или пароль')
})

it('успешно авторизует локального пользователя', async () => {
  // Сохраняем тестовые данные в localStorage.
  localStorage.setItem(LOCAL_STORAGE_KEYS.PROJECT_DATA, JSON.stringify(localSnapshot))

  // Вызываем авторизацию с паролем локального пользователя.
  const result = await authenticate({
    email: 'anna@example.com',
    password: 'AnnaPassword123!',
  })

  // Проверяем, что функция вернула правильного пользователя.
  expect(result).toEqual({
    id: localUser.id,
    name: localUser.name,
    email: localUser.email,
  })
})

it('не принимает демонстрационный пароль для локального пользователя', async () => {
  // Сохраняем локального пользователя с его собственным паролем.
  localStorage.setItem(LOCAL_STORAGE_KEYS.PROJECT_DATA, JSON.stringify(localSnapshot))

  // Пробуем войти с демонстрационным паролем вместо локального.
  await expect(
    authenticate({
      email: localUser.email,
      password: 'SkillSwap123!',
    }),
  ).rejects.toThrow('Неверный email или пароль')
})

it('авторизует JSON-пользователя по изменённому email', async () => {
  // Подготавливаем пользователя и его навык.
  vi.mocked(usersApi.fetchUsers).mockResolvedValue([jsonUser])
  vi.mocked(skillsApi.fetchSkills).mockResolvedValue([jsonSkill])

  // Сохраняем изменение email пользователя.
  localStorage.setItem(
    LOCAL_STORAGE_KEYS.PROFILE_OVERRIDES,
    JSON.stringify({
      version: 1,
      profiles: {
        [jsonUser.id]: {
          email: 'egor.new@example.com',
        },
      },
      passwordOverrides: {},
    }),
  )

  // Авторизуемся по новому email.
  const result = await authenticate({
    email: 'egor.new@example.com',
    password: 'SkillSwap123!',
  })

  // Проверяем, что вернулись актуальные данные.
  expect(result).toEqual({
    id: jsonUser.id,
    name: jsonUser.name,
    email: 'egor.new@example.com',
  })
})

it('не авторизует пользователя по старому email после его изменения', async () => {
  // Подготавливаем пользователя и его навык.
  vi.mocked(usersApi.fetchUsers).mockResolvedValue([jsonUser])
  vi.mocked(skillsApi.fetchSkills).mockResolvedValue([jsonSkill])

  // Сохраняем новый email пользователя.
  localStorage.setItem(
    LOCAL_STORAGE_KEYS.PROFILE_OVERRIDES,
    JSON.stringify({
      version: 1,
      profiles: {
        [jsonUser.id]: {
          email: 'egor.new@example.com',
        },
      },
      passwordOverrides: {},
    }),
  )

  // Пытаемся авторизоваться по старому email.
  await expect(
    authenticate({
      email: 'user01@example.com',
      password: 'SkillSwap123!',
    }),
  ).rejects.toThrow('Неверный email или пароль')
})

it('авторизует JSON-пользователя с изменённым паролем', async () => {
  // Подготавливаем пользователя и его навык.
  vi.mocked(usersApi.fetchUsers).mockResolvedValue([jsonUser])
  vi.mocked(skillsApi.fetchSkills).mockResolvedValue([jsonSkill])

  // Сохраняем новый пароль пользователя.
  localStorage.setItem(
    LOCAL_STORAGE_KEYS.PROFILE_OVERRIDES,
    JSON.stringify({
      version: 1,
      profiles: {},
      passwordOverrides: {
        [jsonUser.id]: 'NewPassword123!',
      },
    }),
  )

  // Авторизуемся с новым паролем.
  const result = await authenticate({
    email: jsonUser.email,
    password: 'NewPassword123!',
  })

  // Проверяем успешную авторизацию.
  expect(result).toEqual({
    id: jsonUser.id,
    name: jsonUser.name,
    email: jsonUser.email,
  })
})

it('не принимает старый пароль JSON-пользователя после его изменения', async () => {
  // Подготавливаем пользователя и его навык.
  vi.mocked(usersApi.fetchUsers).mockResolvedValue([jsonUser])
  vi.mocked(skillsApi.fetchSkills).mockResolvedValue([jsonSkill])

  // Сохраняем новый пароль пользователя.
  localStorage.setItem(
    LOCAL_STORAGE_KEYS.PROFILE_OVERRIDES,
    JSON.stringify({
      version: 1,
      profiles: {},
      passwordOverrides: {
        [jsonUser.id]: 'NewPassword123!',
      },
    }),
  )

  // Пробуем авторизоваться со старым демонстрационным паролем.
  await expect(
    authenticate({
      email: jsonUser.email,
      password: 'SkillSwap123!',
    }),
  ).rejects.toThrow('Неверный email или пароль')
})

it('авторизует локального пользователя с изменённым паролем', async () => {
  // Сохраняем локального пользователя и его исходный пароль.
  localStorage.setItem(LOCAL_STORAGE_KEYS.PROJECT_DATA, JSON.stringify(localSnapshot))

  // Сохраняем новый пароль через profileOverrides.
  localStorage.setItem(
    LOCAL_STORAGE_KEYS.PROFILE_OVERRIDES,
    JSON.stringify({
      version: 1,
      profiles: {},
      passwordOverrides: {
        [localUser.id]: 'NewAnnaPassword123!',
      },
    }),
  )

  // Авторизуемся с новым паролем.
  const result = await authenticate({
    email: localUser.email,
    password: 'NewAnnaPassword123!',
  })

  // Проверяем успешную авторизацию.
  expect(result).toEqual({
    id: localUser.id,
    name: localUser.name,
    email: localUser.email,
  })
})

it('не принимает старый пароль локального пользователя после его изменения', async () => {
  // Сохраняем локального пользователя с исходным паролем.
  localStorage.setItem(LOCAL_STORAGE_KEYS.PROJECT_DATA, JSON.stringify(localSnapshot))

  // Сохраняем новый пароль пользователя.
  localStorage.setItem(
    LOCAL_STORAGE_KEYS.PROFILE_OVERRIDES,
    JSON.stringify({
      version: 1,
      profiles: {},
      passwordOverrides: {
        [localUser.id]: 'NewAnnaPassword123!',
      },
    }),
  )

  // Пытаемся авторизоваться со старым локальным паролем.
  await expect(
    authenticate({
      email: localUser.email,
      password: 'AnnaPassword123!',
    }),
  ).rejects.toThrow('Неверный email или пароль')
})

it('отклоняет авторизацию с несуществующим email', async () => {
  // Подготавливаем пользователя и его навык.
  vi.mocked(usersApi.fetchUsers).mockResolvedValue([jsonUser])
  vi.mocked(skillsApi.fetchSkills).mockResolvedValue([jsonSkill])

  // Пытаемся авторизоваться с email, которого нет среди пользователей.
  await expect(
    authenticate({
      email: 'unknown@example.com',
      password: 'SkillSwap123!',
    }),
  ).rejects.toThrow('Неверный email или пароль')
})

it('не маскирует повреждённые данные localStorage под ошибку авторизации', async () => {
  // Подготавливаем пользователя и его навык.
  vi.mocked(usersApi.fetchUsers).mockResolvedValue([jsonUser])
  vi.mocked(skillsApi.fetchSkills).mockResolvedValue([jsonSkill])

  // Записываем некорректный JSON в localStorage.
  localStorage.setItem(LOCAL_STORAGE_KEYS.PROJECT_DATA, '{invalid-json')

  // Проверяем, что ошибка не связана с неверными учётными данными.
  await expect(
    authenticate({
      email: jsonUser.email,
      password: 'SkillSwap123!',
    }),
  ).rejects.not.toThrow('Неверный email или пароль')
})

it('отклоняет авторизацию пользователя без навыка teach', async () => {
  // Пользователь существует в JSON-данных.
  vi.mocked(usersApi.fetchUsers).mockResolvedValue([jsonUser])

  // Но у него нет ни одного навыка.
  vi.mocked(skillsApi.fetchSkills).mockResolvedValue([])

  // Проверяем, что нарушение целостности данных
  // не маскируется под неправильный email или пароль.
  await expect(
    authenticate({
      email: jsonUser.email,
      password: 'SkillSwap123!',
    }),
  ).rejects.not.toThrow('Неверный email или пароль')
})

it('отклоняет авторизацию пользователя с двумя навыками teach', async () => {
  // Подготавливаем пользователя.
  vi.mocked(usersApi.fetchUsers).mockResolvedValue([jsonUser])

  // Создаём второй навык teach для того же пользователя.
  const secondSkill: Skill = {
    ...jsonSkill,
    id: 'skill-02',
    title: 'Продвинутый JavaScript',
  }

  // Возвращаем два навыка teach.
  vi.mocked(skillsApi.fetchSkills).mockResolvedValue([jsonSkill, secondSkill])

  // Проверяем, что нарушение целостности данных
  // не маскируется под неправильный email или пароль.
  await expect(
    authenticate({
      email: jsonUser.email,
      password: 'SkillSwap123!',
    }),
  ).rejects.not.toThrow('Неверный email или пароль')
})

it('читает свежие данные localStorage при каждом вызове', async () => {
  // Сохраняем исходные данные локального пользователя.
  localStorage.setItem(LOCAL_STORAGE_KEYS.PROJECT_DATA, JSON.stringify(localSnapshot))

  // Первый вход с исходным паролем.
  const firstResult = await authenticate({
    email: localUser.email,
    password: 'AnnaPassword123!',
  })

  expect(firstResult.id).toBe(localUser.id)

  // Создаём обновлённую копию данных с другим паролем.
  const updatedSnapshot: LocalDataSnapshot = {
    ...localSnapshot,
    credentials: [
      {
        userId: localUser.id,
        password: 'UpdatedPassword123!',
      },
    ],
  }

  // Перезаписываем данные в localStorage.
  localStorage.setItem(LOCAL_STORAGE_KEYS.PROJECT_DATA, JSON.stringify(updatedSnapshot))

  // Второй вход с новым паролем.
  const secondResult = await authenticate({
    email: localUser.email,
    password: 'UpdatedPassword123!',
  })

  expect(secondResult.id).toBe(localUser.id)
})

it('не принимает старый пароль после обновления localStorage', async () => {
  // Сохраняем исходные данные локального пользователя.
  localStorage.setItem(LOCAL_STORAGE_KEYS.PROJECT_DATA, JSON.stringify(localSnapshot))

  // Проверяем, что исходный пароль работает.
  await expect(
    authenticate({
      email: localUser.email,
      password: 'AnnaPassword123!',
    }),
  ).resolves.toMatchObject({
    id: localUser.id,
  })

  // Обновляем пароль в локальном хранилище.
  const updatedSnapshot: LocalDataSnapshot = {
    ...localSnapshot,
    credentials: [
      {
        userId: localUser.id,
        password: 'UpdatedPassword123!',
      },
    ],
  }

  localStorage.setItem(LOCAL_STORAGE_KEYS.PROJECT_DATA, JSON.stringify(updatedSnapshot))

  // Старый пароль больше не должен подходить.
  await expect(
    authenticate({
      email: localUser.email,
      password: 'AnnaPassword123!',
    }),
  ).rejects.toThrow('Неверный email или пароль')
})
