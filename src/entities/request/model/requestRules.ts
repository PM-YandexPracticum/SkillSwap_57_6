export type SwapRequestStatus = 'pending' | 'accepted' | 'inProgress' | 'rejected' | 'done'
export type SwapRequest = {
  id: string
  fromUserId: string
  toUserId: string
  skillId: string
  status: SwapRequestStatus
  createdAt: string
  updatedAt: string
  completedAt?: string
}
export type RequestAction = 'accept' | 'reject' | 'complete'

//Вспомогательная функция для проверки активности статуса // Активные статусы: pending, accepted, inProgress
const isActiveStatus = (status: SwapRequestStatus) =>
  ['pending', 'accepted', 'inProgress'].includes(status)

//Определяет, какие действия доступны пользователю для конкретной заявки.
export function getAllowedRequestActions(request: SwapRequest, userId: string): RequestAction[] {
  const actions: RequestAction[] = []
  const isSender = request.fromUserId === userId
  const isReceiver = request.toUserId === userId

  //Если пользователь не участник заявки — никаких действий
  if (!isSender && !isReceiver) {
    return actions
  }
  switch (request.status) {
    case 'pending':
      //Только получатель может принять или отклонить
      if (isReceiver) {
        actions.push('accept', 'reject')
      }
      break
    case 'inProgress':
      //Любой участник может завершить заявку
      actions.push('complete')
      break
  }
  return actions
}

//Чистая функция: принятие заявки (pending -> accepted)
export function acceptRequest(request: SwapRequest): SwapRequest {
  const now = new Date().toISOString()
  return { ...request, status: 'accepted', updatedAt: now }
}

//Чистая функция: отклонение заявки (pending -> rejected)
export function rejectRequest(request: SwapRequest): SwapRequest {
  const now = new Date().toISOString()
  return { ...request, status: 'rejected', updatedAt: now }
}

//Чистая функция: завершение заявки (inProgress -> done)
export function completeRequest(request: SwapRequest): SwapRequest {
  const now = new Date().toISOString()
  return { ...request, status: 'done', completedAt: now, updatedAt: now }
}

//Чистая функция: создание новой заявки.
export function createRequest(
  skillId: string,
  toUserId: string,
  fromUserId: string,
  id: string,
  createdAt: string,
  updatedAt: string,
  existingRequests: SwapRequest[],
): SwapRequest | null {
  // 1. Проверяем, нет ли уже активной заявки от этого пользователя на этот навык.
  // Активные статусы: pending, accepted, inProgress.
  const hasActiveDuplicate = existingRequests.some(
    (req) => req.fromUserId === fromUserId && req.skillId === skillId && isActiveStatus(req.status),
  )

  // Если активный дубль найден — создание невозможно.
  // Возвращаем null, чтобы вызывающий код мог обработать ошибку.
  if (hasActiveDuplicate) {
    return null
  }

  // 2. Если дублей нет — конструируем и возвращаем новую заявку.
  return {
    id,
    fromUserId,
    toUserId,
    skillId,
    status: 'pending', // По ТЗ: новая заявка всегда создаётся в статусе pending
    createdAt, // Передаётся вызывающим кодом (сохраняем историю создания)
    updatedAt, // Передаётся вызывающим кодом
    // completedAt не указываем — он появится только при завершении
  }
}
