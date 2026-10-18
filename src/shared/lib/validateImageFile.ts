export function validateImageFile(
  file: File,
  acceptedTypes: readonly string[],
  maxSizeBytes?: number,
): string | null {
  if (!acceptedTypes.includes(file.type)) {
    return `Недопустимый тип файла. Допустимые типы: ${acceptedTypes.join(', ')}.`
  }

  if (maxSizeBytes !== undefined && file.size > maxSizeBytes) {
    return `Размер файла не должен превышать ${maxSizeBytes} байт.`
  }

  return null
}
