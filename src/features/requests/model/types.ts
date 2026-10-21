import type { SwapRequest } from '../../../shared/types'

export interface RequestNotification {
  id: string
  requestId: string
  userId: string
  message: string
  createdAt: string | number
  read?: boolean
}

export interface RequestsSnapshot {
  version: 1
  requests: SwapRequest[]
  notifications: RequestNotification[]
}
