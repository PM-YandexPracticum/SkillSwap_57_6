import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { store } from '@/store'
import { setAuthUser } from '@/features/auth/model/authSlice'
import type { Skill, User, SwapRequest } from '@/shared/types'
import type { LocalDataSnapshot } from '@/features/localData/model/types'
import { writeLocalDataSnapshot } from '@/features/localData/model/localDataStorage'
import { LOCAL_STORAGE_KEYS } from '@/shared/lib/constants'
import {
  acceptRequest,
  rejectRequest,
  completeRequest,
  createRequest,
  markNotificationRead,
  markAllNotificationsRead,
} from './requestThunks'
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

const testUsers: User[] = [
  {
    id: 'requester',
    name: 'Отправитель',
    email: 'requester@test.ru',
    avatarUrl: null,
    createdAt: '2026-10-01T10:00:00.000Z',
    age: 25,
    gender: 'other',
    city: 'Москва',
    description: '',
    likesCount: 0,
  },
  {
    id: 'receiver',
    name: 'Автор навыка',
    email: 'receiver@test.ru',
    avatarUrl: null,
    createdAt: '2026-10-01T10:00:00.000Z',
    age: 30,
    gender: 'other',
    city: 'Москва',
    description: '',
    likesCount: 0,
  },
]

const testSkill: Skill = {
  id: 'skill',
  title: 'Английский язык',
  description: 'Помощь с английским',
  type: 'teach',
  category: 'Языки',
  tags: [],
  imageUrl: null,
  authorId: 'receiver',
  createdAt: '2026-10-01T10:00:00.000Z',
}

const requesterSkill: Skill = {
  ...testSkill,
  id: 'requester-skill',
  title: 'Рисование',
  authorId: 'requester',
}

const localData: LocalDataSnapshot = {
  version: 1,
  users: testUsers,
  skills: [testSkill, requesterSkill],
  credentials: [
    { userId: 'requester', password: 'test-password' },
    { userId: 'receiver', password: 'test-password' },
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

it('creates a request and one notification for the sender', () => {
  writeLocalDataSnapshot(localData)
  login('requester')

  expect(store.dispatch(createRequest('skill'))).toBe(true)

  const saved = readRequestsSnapshot()
  const createdRequest = saved.requests.find(
    (entry) => entry.fromUserId === 'requester' && entry.skillId === 'skill',
  )

  expect(createdRequest).toMatchObject({
    skillId: 'skill',
    fromUserId: 'requester',
    toUserId: 'receiver',
    status: 'pending',
  })

  expect(saved.notifications).toHaveLength(snapshot.notifications.length + 1)
  expect(saved.notifications).toContainEqual(
    expect.objectContaining({
      requestId: createdRequest?.id,
      userId: 'requester',
      message: 'Вы предложили обмен Английский язык',
      read: false,
    }),
  )

  expect(store.getState().requests.snapshot).toEqual(saved)
})

it('rejects guests, own skills, unknown skills and duplicate active requests', () => {
  writeLocalDataSnapshot(localData)
  login(null)

  const write = vi.spyOn(Storage.prototype, 'setItem')

  expect(store.dispatch(createRequest('skill'))).toBe(false)
  expect(write).not.toHaveBeenCalled()

  login('receiver')
  expect(store.dispatch(createRequest('skill'))).toBe(false)
  expect(write).not.toHaveBeenCalled()

  login('requester')
  expect(store.dispatch(createRequest('unknown-skill'))).toBe(false)
  expect(write).not.toHaveBeenCalled()

  write.mockRestore()

  writeRequestsSnapshot({
    ...snapshot,
    requests: [{ ...request, fromUserId: 'requester' }, ...snapshot.requests.slice(1)],
  })

  const duplicateWrite = vi.spyOn(Storage.prototype, 'setItem')

  expect(store.dispatch(createRequest('skill'))).toBe(false)
  expect(duplicateWrite).not.toHaveBeenCalled()
})

it('allows users to mark only their own notifications as read', () => {
  login('receiver')

  expect(store.dispatch(markNotificationRead('notice'))).toBe(false)
  expect(readRequestsSnapshot().notifications[0].read).toBe(false)

  login('sender')

  expect(store.dispatch(markNotificationRead('notice'))).toBe(true)
  expect(readRequestsSnapshot().notifications[0].read).toBe(true)

  // Повторное действие безопасно.
  expect(store.dispatch(markNotificationRead('notice'))).toBe(true)
})

it('marks all notifications read only for the current user', () => {
  writeRequestsSnapshot({
    ...snapshot,
    notifications: [
      ...snapshot.notifications,
      {
        id: 'receiver-notice',
        requestId: 'other',
        userId: 'receiver',
        message: 'Уведомление получателю',
        createdAt: request.createdAt,
        read: false,
      },
    ],
  })

  login('sender')

  expect(store.dispatch(markAllNotificationsRead())).toBe(true)

  const saved = readRequestsSnapshot()

  expect(saved.notifications.find((entry) => entry.id === 'notice')?.read).toBe(true)
  expect(saved.notifications.find((entry) => entry.id === 'receiver-notice')?.read).toBe(false)

  // Повторный вызов не должен ломать данные.
  expect(store.dispatch(markAllNotificationsRead())).toBe(true)
})

it('preserves the Redux and storage snapshots when creating a request fails to save', () => {
  writeLocalDataSnapshot(localData)
  login('requester')

  const beforeStorage = localStorage.getItem(LOCAL_STORAGE_KEYS.REQUESTS)
  const beforeRedux = store.getState().requests.snapshot

  vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
    throw new Error('storage unavailable')
  })

  expect(store.dispatch(createRequest('skill'))).toBe(false)
  expect(localStorage.getItem(LOCAL_STORAGE_KEYS.REQUESTS)).toBe(beforeStorage)
  expect(store.getState().requests.snapshot).toEqual(beforeRedux)
  expect(store.getState().requests.operationError).toBeTruthy()
})
