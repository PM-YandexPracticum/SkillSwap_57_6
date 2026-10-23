import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useStore } from 'react-redux'
import { generatePath, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/shared/lib/constants'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '@/features/requests/model/requestThunks'
import { restoreRequests } from '@/features/requests/model/requestsSlice'
import { selectCatalogData } from '@/features/catalog/model/catalogSelectors'
import { getCatalogThunk } from '@/features/catalog/model/catalogSlice'
import { restoreLocalData } from '@/features/localData/model/localDataSlice'
import type { RootState } from '@/store'
import type { RequestNotification } from '@/features/requests/model/types'

import styles from './NotificationMenu.module.css'

type FailedAction =
  | { type: 'notification'; notification: RequestNotification }
  | { type: 'target'; notification: RequestNotification }
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
  const store = useStore<RootState>()
  const navigate = useNavigate()
  const user = useAppSelector((state) => state.auth.user)
  const allNotifications = useAppSelector((state) => state.requests.snapshot.notifications)
  const readError = useAppSelector((state) => state.requests.readError)

  const [isOpen, setIsOpen] = useState(false)
  const [actionError, setActionError] = useState('')
  const [failedAction, setFailedAction] = useState<FailedAction>(null)

  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  const userNotifications = allNotifications
    .filter((notification) => notification.userId === user?.id)
    .sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt))

  const unreadNotifications = userNotifications.filter((notification) => notification.read !== true)
  const readNotifications = userNotifications.filter((notification) => notification.read === true)
  const menuError = actionError || (readError ? 'Не удалось прочитать уведомления.' : '')

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
      const state = store.getState()
      if (notification.userId !== state.auth.user?.id) return

      setActionError('')
      setFailedAction(null)

      const request = state.requests.snapshot.requests.find(
        (entry) => entry.id === notification.requestId,
      )

      if (!request) {
        setActionError('Не удалось найти заявку. Попробуйте ещё раз.')
        setFailedAction({ type: 'notification', notification })
        return
      }

      const { users, skills, mergeError } = selectCatalogData(state)
      const skill = skills.find((entry) => entry.id === request.skillId)
      const author = users.find((entry) => entry.id === skill?.authorId)
      if (
        state.catalog.status !== 'success' ||
        state.localData.readError ||
        mergeError ||
        !skill ||
        skill.type !== 'teach' ||
        !author ||
        author.id !== request.toUserId
      ) {
        setActionError('Не удалось загрузить навык или его автора. Повторите попытку.')
        setFailedAction({ type: 'target', notification })
        return
      }

      const markedRead = dispatch(markNotificationRead(notification.id))

      if (!markedRead) {
        setActionError('Не удалось отметить уведомление прочитанным.')
        setFailedAction({ type: 'notification', notification })
        return
      }

      closeMenu()
      navigate(generatePath(ROUTES.SKILL, { id: skill.id }))
    },
    [dispatch, store, navigate, closeMenu],
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

  const handleRetry = useCallback(async () => {
    if (!failedAction) {
      await dispatch(restoreRequests())
      return
    }

    if (failedAction.type === 'all') {
      handleMarkAllRead()
      return
    }

    if (failedAction.type === 'target') {
      await dispatch(getCatalogThunk())
      dispatch(restoreLocalData())
    }
    if (!(await dispatch(restoreRequests()))) return
    handleOpenNotification(failedAction.notification)
  }, [dispatch, failedAction, handleMarkAllRead, handleOpenNotification])

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
        <span className={styles.bell} aria-hidden="true" />

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

          {menuError && (
            <div className={styles.error} role="alert">
              <p>{menuError}</p>
              <button type="button" onClick={handleRetry}>
                Повторить
              </button>
            </div>
          )}

          {!readError && (
            <>
              <div className={styles.section}>
                <h3>Новые</h3>

                {unreadNotifications.length > 0 ? (
                  <ul className={styles.list}>
                    {unreadNotifications.map((notification) => (
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
                ) : (
                  <p className={styles.empty}>Новых уведомлений нет</p>
                )}
              </div>

              <div className={styles.section}>
                <h3>Прочитанные</h3>

                {readNotifications.length > 0 ? (
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
                ) : (
                  <p className={styles.empty}>Прочитанных уведомлений нет</p>
                )}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
