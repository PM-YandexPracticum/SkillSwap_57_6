import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit'
import {
  createRequest as createRequestRule,
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
  setOperationError,
} from './requestsSlice'
import type { RequestsSnapshot, RequestNotification } from './types'
import { generateId } from '@/shared/lib/helpers'
import { readLocalDataSnapshot } from '@/features/localData/model/localDataStorage'

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

const readErrorMessage = 'Не удалось прочитать данные. Повторите попытку.'
const operationErrorMessage = 'Не удалось выполнить операцию. Повторите попытку.'

export const createRequest =
  (skillId: string): RequestThunk =>
  (dispatch, getState) => {
    const userId = getState().auth.user?.id

    if (!userId || !skillId) {
      dispatch(setOperationError('Войдите в аккаунт и выберите навык.'))
      return false
    }

    let snapshot: RequestsSnapshot
    let localData

    try {
      snapshot = readRequestsSnapshot()
      localData = readLocalDataSnapshot()
      dispatch(setReadError(null))
    } catch {
      dispatch(setReadError(readErrorMessage))
      return false
    }

    // За время чтения аккаунт мог измениться.
    if (getState().auth.user?.id !== userId) return false

    const catalog = getState().catalog

    // Сначала ищем навык в локальных данных.
    const skill =
      localData.skills.find((entry) => entry.id === skillId) ??
      catalog.skills.find((entry) => entry.id === skillId)

    // Локальная запись имеет приоритет, в том числе если её тип отличается.
    const isTeachSkill = skill?.type === 'teach'

    // Автора также ищем сначала в локальных данных, затем в каталоге.
    const owner = skill
      ? (localData.users.find((user) => user.id === skill.authorId) ??
        catalog.users.find((user) => user.id === skill.authorId))
      : undefined

    if (!skill || !isTeachSkill || !owner) {
      dispatch(setOperationError('Навык не найден или недоступен для обмена.'))
      return false
    }

    const now = new Date().toISOString()
    const requestId = generateId()

    const request = createRequestRule(skill, userId, requestId, now, now, snapshot.requests)

    if (!request) {
      dispatch(
        setOperationError(
          'Нельзя отправить заявку на собственный навык или создать повторную активную заявку.',
        ),
      )
      return false
    }

    const notification: RequestNotification = {
      id: generateId(),
      requestId: request.id,
      userId,
      message: `Вы предложили обмен ${skill.title}`,
      createdAt: now,
      read: false,
    }

    const next: RequestsSnapshot = {
      ...snapshot,
      requests: [...snapshot.requests, request],
      notifications: [...snapshot.notifications, notification],
    }

    if (getState().auth.user?.id !== userId) return false

    try {
      writeRequestsSnapshot(next)
    } catch {
      dispatch(setOperationError(operationErrorMessage))
      return false
    }

    dispatch(setSnapshot(next))
    dispatch(setOperationError(null))
    return true
  }

export const markNotificationRead =
  (id: string): RequestThunk =>
  (dispatch, getState) => {
    const userId = getState().auth.user?.id

    if (!userId || !id) {
      dispatch(setOperationError('Войдите в аккаунт, чтобы изменить уведомление.'))
      return false
    }

    let snapshot: RequestsSnapshot

    try {
      snapshot = readRequestsSnapshot()
      dispatch(setReadError(null))
    } catch {
      dispatch(setReadError(readErrorMessage))
      return false
    }

    if (getState().auth.user?.id !== userId) return false

    const notification = snapshot.notifications.find((entry) => entry.id === id)

    if (!notification || notification.userId !== userId) {
      dispatch(setOperationError('Уведомление не найдено или недоступно.'))
      return false
    }

    // Повторное действие безопасно и не требует записи.
    if (notification.read === true) {
      dispatch(setSnapshot(snapshot))
      dispatch(setOperationError(null))
      return true
    }

    const next: RequestsSnapshot = {
      ...snapshot,
      notifications: snapshot.notifications.map((entry) =>
        entry.id === id && entry.userId === userId ? { ...entry, read: true } : entry,
      ),
    }

    if (getState().auth.user?.id !== userId) return false

    try {
      writeRequestsSnapshot(next)
    } catch {
      dispatch(setOperationError(operationErrorMessage))
      return false
    }

    dispatch(setSnapshot(next))
    dispatch(setOperationError(null))
    return true
  }

export const markAllNotificationsRead = (): RequestThunk => (dispatch, getState) => {
  const userId = getState().auth.user?.id

  if (!userId) {
    dispatch(setOperationError('Войдите в аккаунт, чтобы изменить уведомления.'))
    return false
  }

  let snapshot: RequestsSnapshot

  try {
    snapshot = readRequestsSnapshot()
    dispatch(setReadError(null))
  } catch {
    dispatch(setReadError(readErrorMessage))
    return false
  }

  if (getState().auth.user?.id !== userId) return false

  const hasUnread = snapshot.notifications.some(
    (notification) => notification.userId === userId && notification.read !== true,
  )

  // Если непрочитанных нет, сохранять снимок повторно не нужно.
  if (!hasUnread) {
    dispatch(setSnapshot(snapshot))
    dispatch(setOperationError(null))
    return true
  }

  const next: RequestsSnapshot = {
    ...snapshot,
    notifications: snapshot.notifications.map((notification) =>
      notification.userId === userId && notification.read !== true
        ? { ...notification, read: true }
        : notification,
    ),
  }

  if (getState().auth.user?.id !== userId) return false

  try {
    writeRequestsSnapshot(next)
  } catch {
    dispatch(setOperationError(operationErrorMessage))
    return false
  }

  dispatch(setSnapshot(next))
  dispatch(setOperationError(null))
  return true
}
