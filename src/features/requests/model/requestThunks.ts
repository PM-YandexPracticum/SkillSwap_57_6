import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit'
import {
  acceptRequest as accept,
  rejectRequest as reject,
  completeRequest as complete,
} from '@/entities/request/model/requestRules'
import type { RootState } from '@/store'
import { readRequestsSnapshot, writeRequestsSnapshot } from './requestsStorage'
import {
  requestOperationStarted,
  requestOperationFinished,
  selectRequestOperation,
  setReadError,
  setSnapshot,
} from './requestsSlice'
import type { RequestsSnapshot } from './types'

type RequestThunk = ThunkAction<boolean, RootState, unknown, UnknownAction>

const changeRequest =
  (id: string, apply: typeof accept): RequestThunk =>
  (dispatch, getState) => {
    const userId = getState().auth.user?.id
    if (!userId || !id || selectRequestOperation(getState(), id)?.status === 'pending') {
      return false
    }
    dispatch(requestOperationStarted({ requestId: id, userId }))
    const finish = (error: string | null) => {
      dispatch(requestOperationFinished({ requestId: id, userId, error }))
      return error === null
    }
    let snapshot: RequestsSnapshot
    try {
      snapshot = readRequestsSnapshot()
      dispatch(setReadError(null))
    } catch {
      const error = 'Не удалось прочитать заявки. Повторите попытку.'
      if (getState().auth.user?.id === userId) dispatch(setReadError(error))
      return finish(error)
    }
    const request = snapshot.requests.find((entry) => entry.id === id)
    const updated = request && apply(request, userId, new Date().toISOString())
    if (!updated || getState().auth.user?.id !== userId) {
      return finish('Действие недоступно. Проверьте статус заявки и текущий аккаунт.')
    }
    const next: RequestsSnapshot = {
      ...snapshot,
      requests: snapshot.requests.map((entry) => (entry.id === id ? updated : entry)),
    }
    try {
      writeRequestsSnapshot(next)
    } catch {
      return finish('Не удалось сохранить заявку. Повторите попытку.')
    }
    dispatch(setSnapshot(next))
    return finish(null)
  }

export const acceptRequest = (id: string): RequestThunk => changeRequest(id, accept)
export const rejectRequest = (id: string): RequestThunk => changeRequest(id, reject)
export const completeRequest = (id: string): RequestThunk => changeRequest(id, complete)
