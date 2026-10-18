import type { CatalogItem } from '@/shared/types'

export function filterCatalogBySkillTitle(items: CatalogItem[], query: string) {
  // Сначала обрабатываем сам запрос, убираем пробелы по краям
  const trimmedQuery = query.trim()

  // Если запрос пустой после обрезки пробелов, возвращаем все как есть
  if (!trimmedQuery) {
    return items
  }

  const lowerQuery = trimmedQuery.toLowerCase()
  const seenIds = new Set<string>() // Сюда будем складывать ID пользователей,которых уже нашли
  const result: CatalogItem[] = [] // Сюда будем складывать итоговые карточки

  for (const item of items) {
    // 1. Сначала проверяем, не добавляли ли мы уже этого пользователя (защита от дублей)
    const userId = item.user.id

    if (seenIds.has(userId)) {
      continue // Если уже видели этого пользователя, пропускаем дальше
    }

    // 2. Ищем совпадение среди навыков
    const hasMatchingSkill = item.skills.some((skill: { title: string }) => {
      // Приводим и название навыка и запрос к нижнему регистру
      // includes проверяет, содержится ли запрос внутри названия навыка
      return skill.title.toLowerCase().includes(lowerQuery)
    })

    // 3. Если совпадений найдено, добавляем пользователя в результат
    if (hasMatchingSkill) {
      seenIds.add(userId) // Запоминаем, что этого пользователя мы уже обработали
      result.push(item) // Добавляем карточку в список результатов
    }
  }

  return result
}
