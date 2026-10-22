import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import authReducer, { setAuthUser } from '@/features/auth/model/authSlice'
import requestsReducer, {
  addNotification,
  addRequest,
  clear,
} from '@/features/requests/model/requestsSlice'
import { NotificationMenu } from './index'
import { writeRequestsSnapshot } from '@/features/requests/model/requestsStorage'

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

const makeStore = (loggedIn = true) => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      requests: requestsReducer,
    },
  })

  localStorage.clear()

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
      <MemoryRouter initialEntries={['/']}>
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
  })

  afterEach(() => {
    cleanup()
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
})
