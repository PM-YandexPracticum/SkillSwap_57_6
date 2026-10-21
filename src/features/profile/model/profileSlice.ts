import {
  createSlice,
  type PayloadAction,
  type ThunkAction,
  type UnknownAction,
} from '@reduxjs/toolkit'
import { fetchUsers } from '@/api/users'
import { readLocalDataSnapshot } from '@/features/localData/model/localDataStorage'
import { LOCAL_STORAGE_KEYS } from '@/shared/lib/constants'
import type { User } from '@/shared/types'
import type { RootState } from '@/store'
import {
  applyProfileOverrides,
  assertProfilePatch,
  isValidProfilePassword,
  normalizeEmail,
  readProfileSnapshot,
  type ProfileOverrides,
  type ProfilePatch,
  type ProfileSnapshot,
} from './profileStorage'

interface ProfileState {
  profiles: ProfileOverrides
  readError: string | null
  writeError: string | null
}
const initialState: ProfileState = { profiles: {}, readError: null, writeError: null }
const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    profilesRestored(state, { payload }: PayloadAction<ProfileOverrides>) {
      state.profiles = payload
      state.readError = null
    },
    profileReadFailed(state, { payload }: PayloadAction<string | null>) {
      state.readError = payload
    },
    profileWriteFailed(state, { payload }: PayloadAction<string | null>) {
      state.writeError = payload
    },
  },
})
const { profilesRestored, profileReadFailed, profileWriteFailed } = profileSlice.actions
type ProfileThunk<R> = ThunkAction<R, RootState, unknown, UnknownAction>

export const restoreProfiles = (): ProfileThunk<boolean> => (dispatch) => {
  try {
    dispatch(profilesRestored(readProfileSnapshot().profiles))
    return true
  } catch {
    dispatch(profileReadFailed('Не удалось прочитать изменения профилей. Повторите загрузку.'))
    return false
  }
}

export const saveProfileChanges =
  (userId: string, patch: ProfilePatch, password?: string): ProfileThunk<Promise<boolean>> =>
  async (dispatch, getState) => {
    let changes: ProfilePatch
    try {
      if (!userId || getState().auth.user?.id !== userId) throw new Error()
      assertProfilePatch(patch)
      if (password !== undefined && !isValidProfilePassword(password)) throw new Error()
      changes = { ...patch }
      if (changes.email !== undefined) changes.email = normalizeEmail(changes.email)
    } catch {
      dispatch(profileWriteFailed('Проверьте данные профиля, пароль и текущую сессию.'))
      return false
    }
    let snapshot: ProfileSnapshot
    let users: User[]
    try {
      const jsonUsers = await fetchUsers()
      const local = readLocalDataSnapshot()
      snapshot = readProfileSnapshot()
      users = [...new Map([...jsonUsers, ...local.users].map((user) => [user.id, user])).values()]
      dispatch(profileReadFailed(null))
    } catch {
      dispatch(profileReadFailed('Не удалось прочитать данные профилей. Повторите сохранение.'))
      return false
    }
    try {
      if (getState().auth.user?.id !== userId || !users.some((user) => user.id === userId)) {
        throw new Error('Неизвестный пользователь или сессия изменилась')
      }
      const email = changes.email
      if (
        email !== undefined &&
        users.some(
          (user) =>
            user.id !== userId &&
            normalizeEmail(applyProfileOverrides(user, snapshot.profiles).email) === email,
        )
      ) {
        throw new Error('Этот email уже используется')
      }
      const next: ProfileSnapshot = {
        version: 1,
        profiles: { ...snapshot.profiles, [userId]: { ...snapshot.profiles[userId], ...changes } },
        passwordOverrides: {
          ...snapshot.passwordOverrides,
          ...(password === undefined ? {} : { [userId]: password }),
        },
      }
      localStorage.setItem(LOCAL_STORAGE_KEYS.PROFILE_OVERRIDES, JSON.stringify(next))
      dispatch(profilesRestored(next.profiles))
      dispatch(profileWriteFailed(null))
      return true
    } catch (error) {
      dispatch(
        profileWriteFailed(
          error instanceof Error && error.message === 'Этот email уже используется'
            ? error.message
            : 'Не удалось сохранить профиль. Проверьте сессию и повторите попытку.',
        ),
      )
      return false
    }
  }

export function selectCurrentProfile(state: RootState): User | null {
  const id = state.auth.user?.id
  if (!id) return null
  const user =
    state.localData.users.find((entry) => entry.id === id) ??
    state.catalog.users.find((entry) => entry.id === id)
  return user ? applyProfileOverrides(user, state.profile.profiles) : null
}
export const selectProfileReadError = (state: RootState) => state.profile.readError
export const selectProfileWriteError = (state: RootState) => state.profile.writeError
export default profileSlice.reducer
