import type { SwapRequest } from '../../../shared/types'; // путь под твой проект

export interface RequestNotification {
  id: string;
  requestId: string;          // ссылается на SwapRequest.id
  userId: string;             // участник заявки
  message: string;
  createdAt: string;          // ISO
  read: boolean;
}

export interface RequestsSnapshot {
  version: 1;
  requests: SwapRequest[];
  notifications: RequestNotification[];
}
