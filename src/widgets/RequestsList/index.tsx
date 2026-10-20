import { useState } from 'react'
import { RequestCard } from '../RequestCard'
import styles from './RequestsList.module.css'
import type { SwapRequest, User, Skill } from '@/shared/types'

interface RequestsListProps {
  requests: SwapRequest[]
  currentUserId: string
  allUsers: User[]
  allSkills: Skill[]
  onAccept?: (id: string) => void
  onReject?: (id: string) => void
  onComplete?: (id: string) => void
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  loadingActionId?: string | null
  actionErrors?: Record<string, string>
}

export const RequestsList = ({
  requests,
  currentUserId,
  allUsers,
  allSkills,
  onAccept,
  onReject,
  onComplete,
  isLoading = false,
  error,
  onRetry,
  loadingActionId,
  actionErrors = {},
}: RequestsListProps) => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming')

  const incomingRequests = requests.filter((r) => r.toUserId === currentUserId)
  const outgoingRequests = requests.filter((r) => r.fromUserId === currentUserId)

  const sortByDate = (a: SwapRequest, b: SwapRequest) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

  const displayedRequests = (activeTab === 'incoming' ? incomingRequests : outgoingRequests)
    .slice()
    .sort(sortByDate)

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button
          type="button"
          onClick={() => setActiveTab('incoming')}
          className={activeTab === 'incoming' ? styles.active : ''}
          aria-pressed={activeTab === 'incoming'}
        >
          Входящие ({incomingRequests.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('outgoing')}
          className={activeTab === 'outgoing' ? styles.active : ''}
          aria-pressed={activeTab === 'outgoing'}
        >
          Исходящие ({outgoingRequests.length})
        </button>
      </div>

      {isLoading ? (
        <div className={styles.loading} role="status">
          Загрузка списка...
        </div>
      ) : error ? (
        <div className={styles.error} role="alert">
          <p>{error}</p>
          {onRetry && (
            <button type="button" onClick={onRetry} className={styles.retryBtn}>
              Повторить
            </button>
          )}
        </div>
      ) : displayedRequests.length === 0 ? (
        <div className={styles.empty}>
          {activeTab === 'incoming' ? 'Нет входящих заявок' : 'Нет исходящих заявок'}
        </div>
      ) : (
        <div className={styles.list}>
          {displayedRequests.map((req) => {
            const skill = allSkills.find((item) => item.id === req.skillId)
            const fromUser = allUsers.find((user) => user.id === req.fromUserId)
            const toUser = allUsers.find((user) => user.id === req.toUserId)

            return (
              <RequestCard
                key={req.id}
                request={req}
                currentUserId={currentUserId}
                skill={skill}
                fromUser={fromUser}
                toUser={toUser}
                onAccept={onAccept ? () => onAccept(req.id) : undefined}
                onReject={onReject ? () => onReject(req.id) : undefined}
                onComplete={onComplete ? () => onComplete(req.id) : undefined}
                isLoading={loadingActionId === req.id}
                actionError={actionErrors[req.id]}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
