import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import authReducer, { setAuthUser } from '@/features/auth/model/authSlice'
import requestsReducer, {
  addNotification,
  addRequest,
  clear,
  restoreRequests,
  setSnapshot,
  startStorageSync,
  stopStorageSync,
} from '@/features/requests/model/requestsSlice'
import { NotificationMenu } from './index'
import {
  readRequestsSnapshot,
  writeRequestsSnapshot,
} from '@/features/requests/model/requestsStorage'
import catalogReducer, { getCatalogThunk } from '@/features/catalog/model/catalogSlice'
import localDataReducer from '@/features/localData/model/localDataSlice'
import profileReducer from '@/features/profile/model/profileSlice'
import favoritesReducer from '@/features/favorites/model/favoritesSlice'
import { LOCAL_STORAGE_KEYS } from '@/shared/lib/constants'
import { fetchUsers } from '@/api/users'
import { fetchSkills } from '@/api/skills'
import type { Skill, User } from '@/shared/types'

vi.mock('@/api/users', () => ({ fetchUsers: vi.fn() }))
vi.mock('@/api/skills', () => ({ fetchSkills: vi.fn() }))

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const user = {
  id: 'user-1',
  name: 'Тестовый пользователь',
  email: 'user@test.ru',
  token: 'test-token',
}

const otherUser = {
  id: 'user-2',
  name: 'Другой пользователь',
  email: 'other@test.ru',
  token: 'other-token',
}

const request = {
  id: 'request-1',
  skillId: 'skill-1',
  fromUserId: 'user-1',
  toUserId: 'user-2',
  status: 'pending' as const,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
}

const catalogUsers: User[] = [user, otherUser].map((entry) => ({
  ...entry,
  city: 'Москва',
  age: 30,
  gender: 'female',
  avatarUrl: null,
  description: '',
  likesCount: 0,
  createdAt: '2026-10-01',
}))
const catalogSkills: Skill[] = catalogUsers.map((entry, index) => ({
  id: index === 1 ? request.skillId : 'own-skill',
  authorId: entry.id,
  title: 'Фотография',
  type: 'teach',
  category: 'Творчество и искусство',
  tags: ['Фотография'],
  description: '',
  imageUrl: null,
  createdAt: '2026-10-01',
}))

const makeStore = (loggedIn = true) => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      requests: requestsReducer,
      catalog: catalogReducer,
      localData: localDataReducer,
      profile: profileReducer,
      favorites: favoritesReducer,
    },
  })

  localStorage.clear()
  store.dispatch(getCatalogThunk.fulfilled({ users: catalogUsers, skills: catalogSkills }, 'test'))

  writeRequestsSnapshot({
    version: 1,
    requests: [request],
    notifications: [
      {
        id: 'notification-new',
        requestId: request.id,
        userId: user.id,
        message: 'Новое уведомление',
        createdAt: '2026-10-22T10:00:00.000Z',
        read: false,
      },
      {
        id: 'notification-read',
        requestId: request.id,
        userId: user.id,
        message: 'Прочитанное уведомление',
        createdAt: '2026-10-21T10:00:00.000Z',
        read: true,
      },
      {
        id: 'notification-other',
        requestId: request.id,
        userId: otherUser.id,
        message: 'Чужое уведомление',
        createdAt: '2026-10-23T10:00:00.000Z',
        read: false,
      },
    ],
  })

  store.dispatch(clear())
  if (loggedIn) store.dispatch(setAuthUser(user))
  store.dispatch(addRequest(request))

  store.dispatch(
    addNotification({
      id: 'notification-new',
      requestId: request.id,
      userId: user.id,
      message: 'Новое уведомление',
      createdAt: '2026-10-22T10:00:00.000Z',
      read: false,
    }),
  )

  store.dispatch(
    addNotification({
      id: 'notification-read',
      requestId: request.id,
      userId: user.id,
      message: 'Прочитанное уведомление',
      createdAt: '2026-10-21T10:00:00.000Z',
      read: true,
    }),
  )

  store.dispatch(
    addNotification({
      id: 'notification-other',
      requestId: request.id,
      userId: otherUser.id,
      message: 'Чужое уведомление',
      createdAt: '2026-10-23T10:00:00.000Z',
      read: false,
    }),
  )

  return store
}

const renderMenu = (loggedIn = true) => {
  const store = makeStore(loggedIn)

  render(
    <Provider store={store}>
      <MemoryRouter
        initialEntries={['/']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/" element={<NotificationMenu />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )

  return store
}

describe('NotificationMenu', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.mocked(fetchUsers).mockResolvedValue(catalogUsers)
    vi.mocked(fetchSkills).mockResolvedValue(catalogSkills)
  })

  afterEach(() => {
    cleanup()
    stopStorageSync()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('не отображается для гостя', () => {
    renderMenu(false)

    expect(screen.queryByRole('button', { name: /уведомления/i })).not.toBeInTheDocument()
  })

  it('показывает кнопку с количеством непрочитанных уведомлений', () => {
    renderMenu()

    expect(
      screen.getByRole('button', { name: 'Уведомления, непрочитанных: 1' }),
    ).toBeInTheDocument()
  })

  it('открывает меню и разделяет новые и прочитанные уведомления', () => {
    renderMenu()

    fireEvent.click(screen.getByRole('button', { name: /уведомления/i }))

    expect(screen.getByRole('region', { name: 'Уведомления' })).toBeInTheDocument()
    expect(screen.getByText('Новые')).toBeInTheDocument()
    expect(screen.getByText('Прочитанные')).toBeInTheDocument()
    expect(screen.getByText('Новое уведомление')).toBeInTheDocument()
    expect(screen.getByText('Прочитанное уведомление')).toBeInTheDocument()
    expect(screen.queryByText('Чужое уведомление')).not.toBeInTheDocument()
  })

  it('сортирует уведомления от новых к старым', () => {
    renderMenu()

    fireEvent.click(screen.getByRole('button', { name: /уведомления/i }))

    const region = screen.getByRole('region', { name: 'Уведомления' })
    const messages = within(region)
      .getAllByText(/уведомление/i)
      .map((element) => element.textContent)

    expect(messages.indexOf('Новое уведомление')).toBeLessThan(
      messages.indexOf('Прочитанное уведомление'),
    )
  })

  it('отмечает уведомление прочитанным и переходит к навыку', () => {
    const store = renderMenu()

    fireEvent.click(screen.getByRole('button', { name: /уведомления/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Перейти' }))

    expect(
      store
        .getState()
        .requests.snapshot.notifications.find(
          (notification) => notification.id === 'notification-new',
        )?.read,
    ).toBe(true)
    expect(mockNavigate).toHaveBeenCalledWith('/skill/skill-1')
    expect(screen.queryByRole('region', { name: 'Уведомления' })).not.toBeInTheDocument()
  })

  it('отмечает все уведомления текущего пользователя прочитанными', () => {
    const store = renderMenu()

    fireEvent.click(screen.getByRole('button', { name: /уведомления/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Прочитать всё' }))

    const notifications = store.getState().requests.snapshot.notifications

    expect(notifications.find((item) => item.id === 'notification-new')?.read).toBe(true)
    expect(notifications.find((item) => item.id === 'notification-read')?.read).toBe(true)
    expect(notifications.find((item) => item.id === 'notification-other')?.read).toBe(false)
  })

  it('закрывает меню по Escape и возвращает фокус кнопке', () => {
    renderMenu()

    const trigger = screen.getByRole('button', { name: /уведомления/i })
    fireEvent.click(trigger)

    expect(screen.getByRole('region', { name: 'Уведомления' })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('region', { name: 'Уведомления' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('показывает ошибку чтения вместо пустого списка и повторно загружает очередь', async () => {
    const store = renderMenu()
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.REQUESTS)!
    act(() => {
      store.dispatch(setSnapshot({ version: 1, requests: [], notifications: [] }))
    })
    localStorage.setItem(LOCAL_STORAGE_KEYS.REQUESTS, 'broken')
    await act(async () => {
      await store.dispatch(restoreRequests())
    })
    fireEvent.click(screen.getByRole('button', { name: 'Уведомления' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось прочитать уведомления.')
    expect(screen.queryByText('Новых уведомлений нет')).not.toBeInTheDocument()
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.REQUESTS)).toBe('broken')
    localStorage.setItem(LOCAL_STORAGE_KEYS.REQUESTS, saved)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('Новое уведомление')).toBeInTheDocument()
  })

  it('обновляет read по событию реального ключа storage и обрабатывает очистку', () => {
    const store = renderMenu()
    startStorageSync(store.dispatch)
    fireEvent.click(screen.getByRole('button', { name: /уведомления/i }))
    const next = readRequestsSnapshot()
    next.notifications = next.notifications.map((entry) => ({ ...entry, read: true }))
    writeRequestsSnapshot(next)
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: LOCAL_STORAGE_KEYS.REQUESTS,
          newValue: JSON.stringify(next),
          storageArea: localStorage,
        }),
      )
    })
    expect(screen.queryByRole('button', { name: 'Перейти' })).not.toBeInTheDocument()
    expect(screen.getByText('Новых уведомлений нет')).toBeInTheDocument()
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: null }))
    })
    expect(store.getState().requests.snapshot.notifications).toEqual([])
    expect(screen.getByText('Прочитанных уведомлений нет')).toBeInTheDocument()
  })

  it('при ошибке каталога сохраняет read=false, а после повтора проверяет свежие данные и переходит', async () => {
    const store = renderMenu()
    act(() => {
      store.dispatch(getCatalogThunk.fulfilled({ users: [], skills: [] }, 'fresh-load'))
      store.dispatch(getCatalogThunk.rejected(new Error('network'), 'test'))
    })
    fireEvent.click(screen.getByRole('button', { name: /уведомления/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Перейти' }))
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(readRequestsSnapshot().notifications[0].read).toBe(false)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Не удалось загрузить навык или его автора.',
    )
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
    })
    expect(mockNavigate).toHaveBeenCalledWith('/skill/skill-1')
    expect(readRequestsSnapshot().notifications[0].read).toBe(true)
  })

  it.each(['skill', 'type', 'author'] as const)(
    'не помечает сообщение при недоступной цели: %s',
    (invalid) => {
      const store = renderMenu()
      act(() => {
        store.dispatch(
          getCatalogThunk.fulfilled(
            {
              users: invalid === 'author' ? [catalogUsers[0]] : catalogUsers,
              skills:
                invalid === 'skill'
                  ? [catalogSkills[0]]
                  : catalogSkills.map((entry) => ({
                      ...entry,
                      type:
                        invalid === 'type' && entry.id === request.skillId ? 'learn' : entry.type,
                    })),
            },
            'test',
          ),
        )
      })
      fireEvent.click(screen.getByRole('button', { name: /уведомления/i }))
      fireEvent.click(screen.getByRole('button', { name: 'Перейти' }))
      expect(mockNavigate).not.toHaveBeenCalled()
      expect(readRequestsSnapshot().notifications[0].read).toBe(false)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    },
  )

  it.each(['Перейти', 'Прочитать всё'])(
    'повторяет действие после отказа записи: %s',
    async (action) => {
      renderMenu()
      fireEvent.click(screen.getByRole('button', { name: /уведомления/i }))
      const failedWrite = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('quota')
      })
      fireEvent.click(screen.getByRole('button', { name: action }))
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(readRequestsSnapshot().notifications[0].read).toBe(false)
      expect(mockNavigate).not.toHaveBeenCalled()
      failedWrite.mockRestore()
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
      })
      expect(readRequestsSnapshot().notifications[0].read).toBe(true)
      expect(readRequestsSnapshot().notifications[2].read).toBe(false)
      if (action === 'Перейти') expect(mockNavigate).toHaveBeenCalledWith('/skill/skill-1')
      else expect(screen.getByText('Новых уведомлений нет')).toBeInTheDocument()
    },
  )
})
