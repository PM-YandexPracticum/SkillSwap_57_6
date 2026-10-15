import {
  createSlice,
  type PayloadAction,
  type ThunkAction,
  type UnknownAction,
} from '@reduxjs/toolkit'
import type { Skill, User } from '@/shared/types'
import { readLocalDataSnapshot, writeLocalDataSnapshot } from './localDataStorage'
import type { LocalDataSnapshot } from './types'

export interface LocalDataState {
  users: User[]
  skills: Skill[]
  readError: string | null
  writeError: string | null
}

const initialState: LocalDataState = {
  users: [],
  skills: [],
  readError: null,
  writeError: null,
}

type LocalRecords = Pick<LocalDataSnapshot, 'users' | 'skills'>

const toRecords = ({ users, skills }: LocalDataSnapshot): LocalRecords => ({ users, skills })

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Неизвестная ошибка локальных данных'

export const localDataSlice = createSlice({
  name: 'localData',
  initialState,
  reducers: {
    localDataRestored(state, { payload }: PayloadAction<LocalRecords>) {
      state.users = payload.users
      state.skills = payload.skills
      state.readError = null
    },
    localDataReadFailed(state, { payload }: PayloadAction<string>) {
      state.readError = payload
    },
    localDataCommitted(state, { payload }: PayloadAction<LocalRecords>) {
      state.users = payload.users
      state.skills = payload.skills
      state.readError = null
      state.writeError = null
    },
    localDataWriteFailed(state, { payload }: PayloadAction<string>) {
      state.writeError = payload
    },
  },
})

const { localDataRestored, localDataReadFailed, localDataCommitted, localDataWriteFailed } =
  localDataSlice.actions

type LocalDataThunk = ThunkAction<boolean, unknown, unknown, UnknownAction>

export const restoreLocalData = (): LocalDataThunk => (dispatch) => {
  try {
    dispatch(localDataRestored(toRecords(readLocalDataSnapshot())))
    return true
  } catch (error) {
    dispatch(localDataReadFailed(getErrorMessage(error)))
    return false
  }
}

export const commitLocalData =
  (updater: (snapshot: LocalDataSnapshot) => LocalDataSnapshot): LocalDataThunk =>
  (dispatch) => {
    let current: LocalDataSnapshot

    try {
      current = readLocalDataSnapshot()
    } catch (error) {
      dispatch(localDataReadFailed(getErrorMessage(error)))
      return false
    }

    try {
      const next = updater(current)
      writeLocalDataSnapshot(next)
      dispatch(localDataCommitted(toRecords(next)))
      return true
    } catch (error) {
      dispatch(localDataWriteFailed(getErrorMessage(error)))
      return false
    }
  }

type StateWithLocalData = { localData: LocalDataState }

export const selectLocalUsers = (state: StateWithLocalData) => state.localData.users
export const selectLocalSkills = (state: StateWithLocalData) => state.localData.skills
export const selectLocalDataReadError = (state: StateWithLocalData) => state.localData.readError
export const selectLocalDataWriteError = (state: StateWithLocalData) => state.localData.writeError

export default localDataSlice.reducer
