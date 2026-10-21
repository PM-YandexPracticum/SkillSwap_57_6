import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit'
import type { AuthUser } from '@/shared/types'
import type { RootState } from '@/store'
import { saveAuthUser, clearAuthUser } from './authUtils'
import { setAuthUser, setAuthError } from './authSlice'

type AuthThunk = ThunkAction<boolean, RootState, unknown, UnknownAction>

export const startSession =
  (user: Omit<AuthUser, 'token'>): AuthThunk =>
  (dispatch) => {
    try {
      const authUser = saveAuthUser(user)

      dispatch(setAuthUser(authUser))

      return true
    } catch {
      dispatch(setAuthError('Не удалось сохранить сессию'))

      return false
    }
  }

export const logout = (): AuthThunk => (dispatch) => {
  try {
    clearAuthUser()

    dispatch(setAuthUser(null))

    return true
  } catch {
    dispatch(setAuthError('Не удалось выйти из аккаунта'))

    return false
  }
}
