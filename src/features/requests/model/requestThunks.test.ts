import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { store } from '@/store'
import { setAuthUser } from '@/features/auth/model/authSlice'
import type { SwapRequest } from '@/shared/types'
import { LOCAL_STORAGE_KEYS } from '@/shared/lib/constants'
import { acceptRequest, rejectRequest, completeRequest } from './requestThunks'
import { clear, restoreRequests, selectRequestOperation, setSnapshot } from './requestsSlice'
import { readRequestsSnapshot, writeRequestsSnapshot } from './requestsStorage'
import type { RequestsSnapshot } from './types'

const request: SwapRequest = {
  id: 'request',
  skillId: 'skill',
  fromUserId: 'sender',
  toUserId: 'receiver',
  status: 'pending',
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
}
const snapshot: RequestsSnapshot = {
  version: 1,
  requests: [request, { ...request, id: 'other' }],
  notifications: [
    {
      id: 'notice',
      requestId: 'request',
      userId: 'sender',
      message: 'Отправлено',
      createdAt: request.createdAt,
      read: false,
    },
  ],
}
const login = (id: string | null) =>
  store.dispatch(setAuthUser(id ? { id, name: id, email: `${id}@test.ru`, token: 'test' } : null))
const operation = () => selectRequestOperation(store.getState(), request.id)
beforeEach(() => {
  localStorage.clear()
  store.dispatch(clear())
  login('receiver')
  writeRequestsSnapshot(snapshot)
})
afterEach(() => vi.restoreAllMocks())

it.each([
  [acceptRequest, 'pending', 'receiver', 'inProgress'],
  [rejectRequest, 'pending', 'receiver', 'rejected'],
  [completeRequest, 'inProgress', 'sender', 'done'],
  [completeRequest, 'inProgress', 'receiver', 'done'],
] as const)(
  'persists an allowed transition and restores it: %s %s %s',
  async (action, status, user, nextStatus) => {
    writeRequestsSnapshot({ ...snapshot, requests: [{ ...request, status }, snapshot.requests[1]] })
    login(user)
    expect(store.dispatch(action(request.id))).toBe(true)
    const saved = readRequestsSnapshot()
    expect(saved.requests[0]).toMatchObject({
      status: nextStatus,
      createdAt: request.createdAt,
      updatedAt: expect.any(String),
    })
    expect(saved.requests[0].updatedAt).not.toBe(request.updatedAt)
    expect(saved.requests[0].completedAt).toBe(
      nextStatus === 'done' ? saved.requests[0].updatedAt : undefined,
    )
    expect(saved.requests[1]).toEqual(snapshot.requests[1])
    expect(saved.notifications).toEqual(snapshot.notifications)
    expect(store.dispatch(action(request.id))).toBe(false)
    store.dispatch(clear())
    expect(await store.dispatch(restoreRequests())).toBe(true)
    expect(store.getState().requests.snapshot).toEqual(saved)
  },
)

it('rejects guests, outsiders, senders of pending requests and missing IDs without writes', () => {
  const write = vi.spyOn(Storage.prototype, 'setItem')
  for (const user of [null, 'outsider', 'sender']) {
    login(user)
    for (const action of [acceptRequest, rejectRequest, completeRequest])
      expect(store.dispatch(action(request.id))).toBe(false)
  }
  login('receiver')
  expect(store.dispatch(acceptRequest('missing'))).toBe(false)
  expect(write).not.toHaveBeenCalled()
})

it.each(['read', 'write'])('preserves the snapshot on %s failure and allows retry', (failure) => {
  store.dispatch(setSnapshot(snapshot))
  const before = localStorage.getItem(LOCAL_STORAGE_KEYS.REQUESTS)
  const fail = vi
    .spyOn(Storage.prototype, failure === 'read' ? 'getItem' : 'setItem')
    .mockImplementationOnce(() => {
      throw new Error('storage unavailable')
    })
  expect(store.dispatch(acceptRequest(request.id))).toBe(false)
  expect(store.getState().requests.snapshot).toEqual(snapshot)
  expect(operation()).toMatchObject({ status: 'error', error: expect.any(String) })
  fail.mockRestore()
  expect(localStorage.getItem(LOCAL_STORAGE_KEYS.REQUESTS)).toBe(before)
  expect(store.dispatch(acceptRequest(request.id))).toBe(true)
  expect(operation()).toMatchObject({ status: 'success', error: null })
  expect(store.getState().requests.readError).toBeNull()
})

it('blocks a duplicate dispatch while pending and clears operation results on account changes', () => {
  let duplicate: boolean | undefined
  const unsubscribe = store.subscribe(() => {
    if (operation()?.status === 'pending' && duplicate === undefined)
      duplicate = store.dispatch(rejectRequest(request.id))
  })
  try {
    expect(store.dispatch(acceptRequest(request.id))).toBe(true)
  } finally {
    unsubscribe()
  }
  expect(duplicate).toBe(false)
  expect(operation()?.status).toBe('success')
  login('sender')
  expect(operation()).toBeUndefined()
  expect(store.getState().requests.operations).toEqual({})
  expect(store.dispatch(rejectRequest(request.id))).toBe(false)
  login('receiver')
  expect(operation()).toBeUndefined()
})
