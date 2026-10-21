import type { SwapRequest, User, Skill } from '@/shared/types'
import { Link } from 'react-router-dom'
import styles from './RequestCard.module.css'
import { getAllowedRequestActions } from '../../entities/request/model/requestRules'

//Простая функция для форматирования даты (можно вынести в utils)
const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'Нет даты'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return 'Некорректная дата'
  }
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Функция для понятного названия статуса
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: 'Ожидает',
    accepted: 'Принята',
    rejected: 'Отклонена',
    inProgress: 'В работе',
    done: 'Завершена',
  }
  return map[status] || status
}

interface RequestCardProps {
  request: SwapRequest
  currentUserId: string
  skill?: Skill | null
  fromUser?: User | null
  toUser?: User | null
  onAccept?: () => void
  onReject?: () => void
  onComplete?: () => void
  isLoading?: boolean
  actionError?: string | null
}

export const RequestCard = ({
  request,
  currentUserId,
  skill,
  fromUser,
  toUser,
  onAccept,
  onReject,
  onComplete,
  isLoading = false,
  actionError,
}: RequestCardProps) => {
  const isSender = request.fromUserId === currentUserId
  const isReceiver = request.toUserId === currentUserId

  if (!isSender && !isReceiver) return null

  const otherUser = isSender ? toUser : fromUser

  const allowedActions = getAllowedRequestActions(request, currentUserId)
  const statusClass = styles[`badge--${request.status}`] || ''

  return (
    <div className={styles.card}>
      <div className={styles.col}>
        {skill ? (
          <Link to={`/skill/${request.skillId}`} className={styles.link}>
            {skill.title}
          </Link>
        ) : (
          <span className={styles.placeholder}>Навык не найден</span>
        )}
      </div>

      <div className={styles.col}>
        {otherUser ? (
          <span className={styles.link}>{otherUser.name}</span>
        ) : (
          <span className={styles.placeholder}>Пользователь не найден</span>
        )}
      </div>

      <div className={styles.col}>
        <span className={`${styles.badge} ${statusClass}`}>{getStatusText(request.status)}</span>
        <div className={styles.date}>Создано: {formatDate(request.createdAt)}</div>
        {request.status === 'done' && (
          <div className={styles.date}>Завершено: {formatDate(request.completedAt)}</div>
        )}
      </div>

      <div className={styles.col}>
        {allowedActions.includes('accept') && (
          <button
            type="button"
            onClick={onAccept}
            disabled={isLoading || !onAccept}
            className={styles.btn}
          >
            {isLoading ? 'Обработка...' : 'Принять'}
          </button>
        )}

        {allowedActions.includes('reject') && (
          <button
            type="button"
            onClick={onReject}
            disabled={isLoading || !onReject}
            className={`${styles.btn} ${styles['btn--danger']}`}
          >
            {isLoading ? 'Обработка...' : 'Отклонить'}
          </button>
        )}

        {allowedActions.includes('complete') && (
          <button
            type="button"
            onClick={onComplete}
            disabled={isLoading || !onComplete}
            className={styles.btn}
          >
            {isLoading ? 'Обработка...' : 'Завершить'}
          </button>
        )}
        {actionError && (
          <p className={styles.error} role="alert">
            {actionError}
          </p>
        )}
      </div>
    </div>
  )
}
