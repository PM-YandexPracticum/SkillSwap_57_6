import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { AppDispatch } from '../../../store'
import type { RootState } from '../../../store'

import type { SwapRequest, RequestStatus } from '../../../shared/types'
import type { RequestNotification, RequestsSnapshot } from './types'

import { readRequestsSnapshot, validateSnapshot } from './requestsStorage'

const KEY = 'requests_snapshot' // Должен совпадать с тем, что в requestsStorage.ts

interface RequestsState {
  snapshot: RequestsSnapshot
  readError: string | null
  operationError: string | null
}

const initialState: RequestsState = {
  snapshot: { version: 1, requests: [], notifications: [] },
  readError: null,
  operationError: null,
}

const requestsSlice = createSlice({
  name: 'requests',
  initialState,
  reducers: {
    setSnapshot: (state, action: PayloadAction<RequestsSnapshot>) => {
      state.snapshot = action.payload
      state.readError = null
    },
    setReadError: (state, action: PayloadAction<string | null>) => {
      state.readError = action.payload
    },
    setOperationError: (state, action: PayloadAction<string | null>) => {
      state.operationError = action.payload
    },
    clear: (state) => {
      state.snapshot = { version: 1, requests: [], notifications: [] }
      state.operationError = null
      // readError не сбрасываем, чтобы сохранить историю ошибок чтения
    },
    clearReadError: (state) => {
      state.readError = null
    },
    addRequest: (state, action: PayloadAction<SwapRequest>) => {
      const exists = state.snapshot.requests.some((r) => r.id === action.payload.id)
      if (!exists) {
        state.snapshot.requests = [...state.snapshot.requests, action.payload]
      }
    },
    updateRequest: (state, action: PayloadAction<Partial<SwapRequest> & { id: string }>) => {
      const index = state.snapshot.requests.findIndex((r) => r.id === action.payload.id)
      if (index === -1) return

      const current = state.snapshot.requests[index]
      state.snapshot.requests[index] = { ...current, ...action.payload }
    },
    addNotification: (state, action: PayloadAction<RequestNotification>) => {
      const exists = state.snapshot.notifications.some((n) => n.id === action.payload.id)
      if (!exists) {
        state.snapshot.notifications = [...state.snapshot.notifications, action.payload]
      }
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const index = state.snapshot.notifications.findIndex((n) => n.id === action.payload)
      if (index === -1) return

      const notification = state.snapshot.notifications[index]
      state.snapshot.notifications[index] = { ...notification, read: true }
    },
  },
})

// --- Синхронизация между вкладками ---

let unsubscribeFromStorage: (() => void) | null = null

export const startStorageSync = (dispatch: AppDispatch): (() => void) => {
  // Если уже есть активная подписка — сначала корректно отписываемся
  if (unsubscribeFromStorage) {
    unsubscribeFromStorage()
  }

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key !== KEY) return

    // Сценарий 1: ключ удалён (removeItem) или хранилище очищено (clear)
    if (!e.newValue) {
      dispatch(requestsSlice.actions.setSnapshot({ version: 1, requests: [], notifications: [] }))
      dispatch(requestsSlice.actions.clearReadError())
      return
    }

    // Сценарий 2: повреждённый JSON
    let parsed: unknown
    try {
      parsed = JSON.parse(e.newValue)
    } catch (parseError) {
      console.warn('[StorageSync] Invalid JSON in storage event', parseError)
      dispatch(requestsSlice.actions.setReadError('Invalid data format in storage'))
      return
    }

    // Сценарий 3: валидация структуры и связей
    try {
      validateSnapshot(parsed as RequestsSnapshot)

      dispatch(requestsSlice.actions.setSnapshot(parsed as RequestsSnapshot))
      dispatch(requestsSlice.actions.clearReadError())
    } catch (validationError) {
      const msg =
        validationError instanceof Error ? validationError.message : String(validationError)
      console.warn('[StorageSync] Validation failed for storage data', validationError)
      // Важно: старые данные в Redux НЕ перезаписываются битыми данными
      dispatch(requestsSlice.actions.setReadError(msg))
    }
  }

  window.addEventListener('storage', handleStorageEvent)

  // Возвращаем функцию очистки, которая правильно сбрасывает ссылку
  unsubscribeFromStorage = () => {
    window.removeEventListener('storage', handleStorageEvent)
    unsubscribeFromStorage = null
  }

  return unsubscribeFromStorage
}

export const stopStorageSync = () => {
  if (unsubscribeFromStorage) {
    unsubscribeFromStorage()
    // После вызова unsubscribeFromStorage уже обнуляет себя, но для ясности можно оставить
  }
}

// --- Thunk восстановления при старте ---

export const restoreRequests =
  () =>
  async (dispatch: AppDispatch): Promise<boolean> => {
    try {
      const snapshot = readRequestsSnapshot()
      dispatch(requestsSlice.actions.setSnapshot(snapshot))
      dispatch(requestsSlice.actions.clearReadError())
      return true
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      dispatch(requestsSlice.actions.setReadError(errorMessage))
      return false
    }
  }

// --- Селекторы (активные статусы) ---

export const ACTIVE_STATUSES = ['pending', 'accepted', 'inProgress'] as const

export const selectIncomingRequests = (state: RootState, userId: string): SwapRequest[] => {
  const snapshot = state.requests?.snapshot
  if (!snapshot) return []

  return snapshot.requests.filter(
    (r) =>
      r.toUserId === userId && (ACTIVE_STATUSES as readonly RequestStatus[]).includes(r.status),
  )
}

export const selectOutgoingRequests = (state: RootState, userId: string): SwapRequest[] => {
  const snapshot = state.requests?.snapshot
  if (!snapshot) return []

  return snapshot.requests.filter(
    (r) =>
      r.fromUserId === userId && (ACTIVE_STATUSES as readonly RequestStatus[]).includes(r.status),
  )
}

export const selectActiveRequestForSkill = (
  state: RootState,
  userId: string,
  skillId: string,
): SwapRequest | undefined => {
  const snapshot = state.requests?.snapshot
  if (!snapshot) return undefined

  return snapshot.requests.find(
    (r) =>
      (r.fromUserId === userId || r.toUserId === userId) &&
      r.skillId === skillId &&
      (ACTIVE_STATUSES as readonly RequestStatus[]).includes(r.status),
  )
}

export const selectUnreadNotifications = (
  state: RootState,
  userId: string,
): RequestNotification[] => {
  const snapshot = state.requests?.snapshot
  if (!snapshot) return []

  return snapshot.notifications.filter((n) => {
    const isRead = n.read === true
    return n.userId === userId && !isRead
  })
}

export const {
  setSnapshot,
  setReadError,
  setOperationError,
  clear,
  clearReadError,
  addRequest,
  updateRequest,
  addNotification,
  markNotificationRead,
} = requestsSlice.actions

export default requestsSlice.reducer
