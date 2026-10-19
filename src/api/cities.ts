import type { City } from '../shared/types'; // или путь, где у тебя City

const CITIES_URL = '/db/cities.json';

export const fetchCities = async (
  signal?: AbortSignal
): Promise<City[]> => {
  const controller = signal ? new AbortController() : undefined;

  if (signal) {
    // Пробрасываем отмену внешнего сигнала в наш контроллер
    const abort = () => controller?.abort();
    signal.addEventListener('abort', abort, { once: true });
  }

  const response = await fetch(CITIES_URL, {
    signal: controller?.signal ?? signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch (e) {
    throw new Error('Не удалось распарсить JSON: ' + (e instanceof Error ? e.message : 'unknown error'));
  }

  if (!Array.isArray(raw)) {
    throw new Error('Ответ не является массивом городов');
  }

  const result: City[] = [];
  const seenNames = new Set<string>();

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];

    if (typeof item !== 'object' || item === null) {
      throw new Error(`Элемент на позиции ${i} не является объектом`);
    }

    const typedItem = item as Record<string, unknown>;

    if (typeof typedItem.name !== 'string') {
      throw new Error(`Элемент на позиции ${i}: поле "name" отсутствует или не является строкой`);
    }

    const name = typedItem.name.trim();

    if (!name) {
      throw new Error(`Пустое название города на позиции ${i}`);
    }

    if (seenNames.has(name)) {
      throw new Error(`Дубликат города "${name}" на позиции ${i}`);
    }

    seenNames.add(name);
    result.push({ name });
  }

  return result;
};
