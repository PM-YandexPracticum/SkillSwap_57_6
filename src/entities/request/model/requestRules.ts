import { SwapRequest, RequestStatus, Skill } from '../../../shared/types'

export type RequestAction = 'accept' | 'reject' | 'complete'

//Вспомогательная функция для проверки активности статуса // Активные статусы: pending, accepted, inProgress
const isActiveStatus = (status: RequestStatus) =>
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

// Эта функция делает проверяет права и применяет изменения.
function applyActionIfAllowed(
  request: SwapRequest,
  userId: string,
  action: RequestAction,
  updates: Partial<SwapRequest>,
  now: string,
): SwapRequest | null {
  // Шаг 1: Спрашиваем: "Можно ли этому пользователю делать это действие?"
  const allowedActions = getAllowedRequestActions(request, userId)

  // Шаг 2: Если действия нет в списке разрешённых — стоп. Возвращаем null.
  if (!allowedActions.includes(action)) {
    return null
  }

  // Шаг 3: Если всё ок, формируем новый объект.
  return {
    ...request, // Сохраняем все старые данные (включая createdAt)
    ...updates, // Накладываем изменения (статус, completedAt и т.д.)
    updatedAt: now, // Обязательно обновляем время последнего изменения
  }
}

// 2. ПУБЛИЧНЫЕ ФУНКЦИИ (теперь они просто делегируют работу помощнику)
// Чистая функция: принятие заявки
export function acceptRequest(
  request: SwapRequest,
  userId: string,
  now: string,
): SwapRequest | null {
  // Пытаемся применить действие 'accept' с обновлением статуса
  return applyActionIfAllowed(
    request,
    userId,
    'accept',
    {
      status: 'inProgress',
    },
    now,
  )
}

// Чистая функция: отклонение заявки
export function rejectRequest(
  request: SwapRequest,
  userId: string,
  now: string,
): SwapRequest | null {
  // Пытаемся применить действие 'reject' с обновлением статуса
  return applyActionIfAllowed(
    request,
    userId,
    'reject',
    {
      status: 'rejected',
    },
    now,
  )
}

// Чистая функция: завершение заявки
export function completeRequest(
  request: SwapRequest,
  userId: string,
  now: string,
): SwapRequest | null {
  // Пытаемся применить действие 'complete' с обновлением статуса и даты завершения
  return applyActionIfAllowed(
    request,
    userId,
    'complete',
    {
      status: 'done',
      completedAt: now, // Равен моменту события
    },
    now,
  )
}

//Чистая функция: создание новой заявки.
export function createRequest(
  skill: Skill | undefined,
  fromUserId: string,
  id: string,
  createdAt: string,
  updatedAt: string,
  existingRequests: SwapRequest[],
): SwapRequest | null {
  //Проверка: существует ли навык
  if (!skill) {
    return null
  }
  //Проверка: нельзя создавать заявку самому себе (на свой навык)
  if (skill.authorId === fromUserId) {
    return null
  }

  // 1. Проверяем, нет ли уже активной заявки от этого пользователя на этот навык.
  const hasActiveDuplicate = existingRequests.some(
    (req) =>
      req.fromUserId === fromUserId && req.skillId === skill.id && isActiveStatus(req.status),
  )

  // Если активный дубль найден — создание невозможно.
  // Возвращаем null, чтобы вызывающий код мог обработать ошибку.
  if (hasActiveDuplicate) {
    return null
  }

  // 2. Создание заявки
  return {
    id,
    fromUserId,
    toUserId: skill.authorId, // Получатель — автор навыка
    skillId: skill.id, // ID навыка из объекта
    status: 'pending', // По ТЗ: новая заявка всегда создаётся в статусе pending
    createdAt, // Сохраняем исходную дату создания (передаётся извне)
    updatedAt, // Сохраняем исходную дату обновления (для новой заявки она равна createdAt)
    // completedAt не указываем т к заявка только создана
  }
}
