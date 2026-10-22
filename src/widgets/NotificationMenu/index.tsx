import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/shared/lib/constants'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '@/features/requests/model/requestThunks'
import { selectUnreadNotifications } from '@/features/requests/model/requestsSlice'
import type { RequestNotification } from '@/features/requests/model/types'

import styles from './NotificationMenu.module.css'

type FailedAction =
  | { type: 'notification'; notification: RequestNotification }
  | { type: 'all' }
  | null

const getTimestamp = (value: string | number): number => {
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

const formatDate = (value: string | number): string => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const getDateTime = (value: string | number): string | undefined => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return undefined

  return date.toISOString()
}

export const NotificationMenu = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((state) => state.auth.user)
  const requests = useAppSelector((state) => state.requests.snapshot.requests)
  const allNotifications = useAppSelector((state) => state.requests.snapshot.notifications)
  const unreadNotifications = useAppSelector((state) =>
    selectUnreadNotifications(state, state.auth.user?.id ?? ''),
  )

  const [isOpen, setIsOpen] = useState(false)
  const [actionError, setActionError] = useState('')
  const [failedAction, setFailedAction] = useState<FailedAction>(null)

  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  const userNotifications = allNotifications
    .filter((notification) => notification.userId === user?.id)
    .sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt))

  const unreadIds = new Set(unreadNotifications.map((notification) => notification.id))

  const readNotifications = userNotifications.filter(
    (notification) => !unreadIds.has(notification.id),
  )

  const closeMenu = useCallback(() => {
    setIsOpen(false)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        closeMenu()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu()
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, closeMenu])

  useEffect(() => {
    setIsOpen(false)
    setActionError('')
    setFailedAction(null)
  }, [user?.id])

  const handleOpenNotification = useCallback(
    (notification: RequestNotification) => {
      setActionError('')
      setFailedAction(null)

      const request = requests.find((entry) => entry.id === notification.requestId)

      if (!request) {
        setActionError('Не удалось найти заявку. Попробуйте ещё раз.')
        setFailedAction({ type: 'notification', notification })
        return
      }

      const markedRead = dispatch(markNotificationRead(notification.id))

      if (!markedRead) {
        setActionError('Не удалось отметить уведомление прочитанным.')
        setFailedAction({ type: 'notification', notification })
        return
      }

      closeMenu()
      navigate(generatePath(ROUTES.SKILL, { id: request.skillId }))
    },
    [dispatch, requests, navigate, closeMenu],
  )

  const handleMarkAllRead = useCallback(() => {
    setActionError('')
    setFailedAction(null)

    const markedRead = dispatch(markAllNotificationsRead())

    if (!markedRead) {
      setActionError('Не удалось прочитать все уведомления.')
      setFailedAction({ type: 'all' })
    }
  }, [dispatch])

  const handleRetry = useCallback(() => {
    if (!failedAction) return

    if (failedAction.type === 'all') {
      handleMarkAllRead()
      return
    }

    handleOpenNotification(failedAction.notification)
  }, [failedAction, handleMarkAllRead, handleOpenNotification])

  if (!user) return null

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        type="button"
        aria-label={
          unreadNotifications.length > 0
            ? `Уведомления, непрочитанных: ${unreadNotifications.length}`
            : 'Уведомления'
        }
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={styles.bell}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>

        {unreadNotifications.length > 0 && <span className={styles.badge} aria-hidden="true" />}
      </button>

      {isOpen && (
        <section className={styles.menu} id={menuId} aria-label="Уведомления">
          <div className={styles.heading}>
            <h2>Уведомления</h2>

            {unreadNotifications.length > 0 && (
              <button className={styles.markAll} type="button" onClick={handleMarkAllRead}>
                Прочитать всё
              </button>
            )}
          </div>

          {actionError && (
            <div className={styles.error} role="alert">
              <p>{actionError}</p>
              <button type="button" onClick={handleRetry}>
                Повторить
              </button>
            </div>
          )}

          {userNotifications.length === 0 ? (
            <p className={styles.empty}>Уведомлений пока нет</p>
          ) : (
            <>
              {unreadNotifications.length > 0 && (
                <div className={styles.section}>
                  <h3>Новые</h3>

                  <ul className={styles.list}>
                    {userNotifications
                      .filter((notification) => unreadIds.has(notification.id))
                      .map((notification) => (
                        <li className={styles.notification} key={notification.id}>
                          <p>{notification.message}</p>
                          <time dateTime={getDateTime(notification.createdAt)}>
                            {formatDate(notification.createdAt)}
                          </time>
                          <button
                            className={styles.goTo}
                            type="button"
                            onClick={() => handleOpenNotification(notification)}
                          >
                            Перейти
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {readNotifications.length > 0 && (
                <div className={styles.section}>
                  <h3>Прочитанные</h3>

                  <ul className={styles.list}>
                    {readNotifications.map((notification) => (
                      <li className={`${styles.notification} ${styles.read}`} key={notification.id}>
                        <p>{notification.message}</p>
                        <time dateTime={getDateTime(notification.createdAt)}>
                          {formatDate(notification.createdAt)}
                        </time>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  )
}
