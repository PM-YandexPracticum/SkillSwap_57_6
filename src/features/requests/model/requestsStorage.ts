import { LOCAL_STORAGE_KEYS } from '../../../shared/lib/constants'
import type { RequestsSnapshot, RequestNotification } from './types'
import type { SwapRequest, RequestStatus } from '../../../shared/types' // добавили RequestStatus

const KEY = LOCAL_STORAGE_KEYS.REQUESTS

const VALID_STATUSES = ['pending', 'accepted', 'inProgress', 'rejected', 'done'] as const

function isValidDateValue(value: unknown): boolean {
  if (typeof value === 'string') {
    const time = new Date(value).getTime()
    return Number.isFinite(time)
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0
  }
  return false
}

// Утилита для валидации статуса
function isValidStatus(value: unknown): value is RequestStatus {
  if (typeof value !== 'string') return false
  return (VALID_STATUSES as readonly RequestStatus[]).includes(value as RequestStatus)
}

function isValidSwapRequest(value: unknown): value is SwapRequest {
  if (!value || typeof value !== 'object') return false
  const r = value as Record<string, unknown>

  if (typeof r.id !== 'string' || r.id.length === 0) return false
  if (typeof r.skillId !== 'string' || r.skillId.length === 0) return false
  if (typeof r.fromUserId !== 'string' || r.fromUserId.length === 0) return false
  if (typeof r.toUserId !== 'string' || r.toUserId.length === 0) return false
  if (r.fromUserId === r.toUserId) return false

  // Используем утилиту — никаких ручных приведений в основном коде
  if (!isValidStatus(r.status)) return false

  if (r.createdAt !== undefined && !isValidDateValue(r.createdAt)) {
    return false
  }

  return true
}

function isValidNotification(value: unknown): value is RequestNotification {
  if (!value || typeof value !== 'object') return false
  const n = value as Record<string, unknown>

  if (typeof n.id !== 'string' || n.id.length === 0) return false
  if (typeof n.requestId !== 'string' || n.requestId.length === 0) return false
  if (typeof n.userId !== 'string' || n.userId.length === 0) return false
  if (typeof n.message !== 'string') return false

  if (n.createdAt !== undefined && !isValidDateValue(n.createdAt)) {
    return false
  }

  if (n.read !== undefined && typeof n.read !== 'boolean') {
    return false
  }

  return true
}

export function validateSnapshot(snapshot: RequestsSnapshot): void {
  if (snapshot.version !== 1) {
    throw new Error('Data integrity error: Unsupported snapshot version')
  }
  if (!Array.isArray(snapshot.requests)) {
    throw new Error('Data integrity error: "requests" must be an array')
  }
  if (!Array.isArray(snapshot.notifications)) {
    throw new Error('Data integrity error: "notifications" must be an array')
  }

  const requestIds = new Set<string>()
  for (const r of snapshot.requests) {
    if (!isValidSwapRequest(r)) {
      throw new Error('Data integrity error: Invalid request entry')
    }
    if (requestIds.has(r.id)) {
      throw new Error(`Data integrity error: Duplicate request id: ${r.id}`)
    }
    requestIds.add(r.id)
  }

  const notificationIds = new Set<string>()
  for (const n of snapshot.notifications) {
    if (!isValidNotification(n)) {
      throw new Error('Data integrity error: Invalid notification entry')
    }
    if (notificationIds.has(n.id)) {
      throw new Error(`Data integrity error: Duplicate notification id: ${n.id}`)
    }
    notificationIds.add(n.id)

    const exists = snapshot.requests.some((r) => r.id === n.requestId)
    if (!exists) {
      throw new Error(
        `Data integrity error: Notification ${n.id} refers to non-existent request ${n.requestId}`,
      )
    }
  }
}

export const readRequestsSnapshot = (): RequestsSnapshot => {
  const raw = localStorage.getItem(KEY)
  if (!raw) {
    return { version: 1, requests: [], notifications: [] }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    throw new Error(
      `Failed to parse requests snapshot: ${e instanceof Error ? e.message : String(e)}`,
    )
  }

  validateSnapshot(parsed as RequestsSnapshot)
  return parsed as RequestsSnapshot
}

export const writeRequestsSnapshot = (snapshot: RequestsSnapshot): void => {
  validateSnapshot(snapshot)
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot))
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    throw new Error(`Failed to write requests snapshot: ${message}`)
  }
}
