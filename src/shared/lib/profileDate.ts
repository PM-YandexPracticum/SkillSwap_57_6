// Календарная дата в местном времени, без преобразования в UTC
export function formatBirthDate(date: Date): string | null {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return null
  const year = date.getFullYear()
  if (year < 1 || year > 9999) return null
  return [year.toString().padStart(4, '0'), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('-')
}

export function parseBirthDate(value: string): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(0)
  date.setHours(0, 0, 0, 0)
  date.setFullYear(year, month - 1, day)
  return formatBirthDate(date) === value ? date : null
}

export function isValidBirthDate(value: string, today = new Date()): boolean {
  const currentDate = formatBirthDate(today)
  return parseBirthDate(value) !== null && currentDate !== null && value <= currentDate
}

/** Полные годы; для некорректной или будущей даты возвращает null. */
export function calculateAge(birthDate: string, today = new Date()): number | null {
  const date = parseBirthDate(birthDate)
  if (!date || !isValidBirthDate(birthDate, today)) return null
  const birthdayAhead =
    today.getMonth() < date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())
  return today.getFullYear() - date.getFullYear() - Number(birthdayAhead)
}
