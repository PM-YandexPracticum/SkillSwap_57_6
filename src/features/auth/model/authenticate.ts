import type { Credentials } from './Credentials'
import { validateCredentials } from './Credentials'
import type { AuthUser } from '@/shared/types'

import { fetchUsers } from '@/api/users'
import { fetchSkills } from '@/api/skills'

import { readLocalDataSnapshot } from '@/features/localData/model/localDataStorage'

import {
  normalizeEmail,
  readProfileSnapshot,
  applyProfileOverrides,
} from '@/features/profile/model/profileStorage'

import { assertSingleTeachPerUser } from '@/shared/lib/skillRules'

/**
 * Проверяет учётные данные пользователя.
 *
 * При успешной авторизации возвращает id, name и email.
 */
export async function authenticate(credentials: Credentials): Promise<Omit<AuthUser, 'token'>> {
  // Проверяем корректность email и наличие пароля.
  const errors = validateCredentials(credentials, 'login')

  // Если обнаружены ошибки, прекращаем авторизацию.
  if (Object.keys(errors).length > 0) {
    throw new Error('Неверный email или пароль')
  }

  // Нормализуем email для последующего поиска пользователя.
  const email = normalizeEmail(credentials.email)

  // Получаем пользователей и навыки из JSON.
  const [jsonUsers, jsonSkills] = await Promise.all([fetchUsers(), fetchSkills()])

  // Читаем актуальные локальные данные.
  const localSnapshot = readLocalDataSnapshot()

  // Читаем изменения профилей и паролей.
  const profileSnapshot = readProfileSnapshot()

  // Объединяем JSON-пользователей и локальных пользователей.
  const users = [...jsonUsers, ...localSnapshot.users]

  // Применяем сохранённые изменения профилей.
  const actualUsers = users.map((user) => applyProfileOverrides(user, profileSnapshot.profiles))

  // Ищем пользователя по нормализованному email.
  const user = actualUsers.find((user) => normalizeEmail(user.email) === email)

  // Если пользователь не найден, прекращаем авторизацию.
  if (!user) {
    throw new Error('Неверный email или пароль')
  }

  // Проверяем, является ли найденный пользователь локальным.
  const isLocalUser = localSnapshot.users.some((localUser) => localUser.id === user.id)

  // Ищем учётные данные локального пользователя.
  const localCredential = localSnapshot.credentials.find(
    (credential) => credential.userId === user.id,
  )

  // Получаем изменённый пароль, если пользователь его менял.
  const passwordOverride = profileSnapshot.passwordOverrides[user.id]

  // Определяем пароль в зависимости от источника пользователя.
  const expectedPassword =
    passwordOverride ?? (isLocalUser ? localCredential?.password : 'SkillSwap123!')

  // Сравниваем введённый пароль с сохранённым.
  if (expectedPassword === undefined || credentials.password !== expectedPassword) {
    throw new Error('Неверный email или пароль')
  }

  // Объединяем навыки из JSON и локального хранилища.
  const allSkills = [...jsonSkills, ...localSnapshot.skills]

  // Получаем навыки найденного пользователя.
  const userSkills = allSkills.filter((skill) => skill.authorId === user.id)

  // Проверяем, что у пользователя ровно один навык teach.
  assertSingleTeachPerUser([user], userSkills)

  // Возвращаем данные успешно авторизованного пользователя.
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  }
}
