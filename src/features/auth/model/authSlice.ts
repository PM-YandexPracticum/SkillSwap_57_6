import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthUser } from '@/shared/types'
import type { RootState } from '@/store'
import { getAuthUser } from '@/features/auth/model/authUtils'

interface AuthState {
  user: AuthUser | null
  error: string | null
}

const initialState: AuthState = {
  user: getAuthUser(),
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload
      state.error = null
    },

    setAuthError(state, action: PayloadAction<string>) {
      state.error = action.payload
    },

    clearAuthError(state) {
      state.error = null
    },
  },
})

export const { setAuthUser, setAuthError, clearAuthError } = authSlice.actions

export const selectAuthUser = (state: RootState) => state.auth.user

export const selectAuthError = (state: RootState) => state.auth.error

export const selectIsAuthenticated = (state: RootState) => state.auth.user !== null

export default authSlice.reducer
