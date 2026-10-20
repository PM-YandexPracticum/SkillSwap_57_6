import { generateId } from '@/shared/lib/helpers'
import {
  validateRegistrationSkillDraft,
  type RegistrationSkillDraft,
} from './registrationSkillDraft'
import type { Skill } from './types'

/** Читает фотографию и проверяет, что браузер может её декодировать. */
export async function readImageDataUrl(file: File): Promise<string> {
  if (!(file instanceof File)) throw new Error('Выберите файл изображения')
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Не удалось прочитать изображение'))
    reader.onabort = () => reject(new Error('Чтение изображения отменено'))
    reader.onload = () => {
      if (typeof reader.result !== 'string' || !reader.result.startsWith('data:image/')) {
        reject(new Error('Некорректные данные изображения'))
        return
      }
      resolve(reader.result)
    }
    reader.readAsDataURL(file)
  })

  const image = new Image()
  image.src = dataUrl
  try {
    await image.decode()
  } catch {
    throw new Error('Не удалось декодировать изображение')
  }
  return dataUrl
}

/** Создаёт навык из снимка черновика, не меняя форму и хранилище. */
export async function createSkillFromDraft(
  draft: RegistrationSkillDraft,
  authorId: string,
): Promise<Skill> {
  const snapshot: RegistrationSkillDraft = {
    ...draft,
    tags: [...draft.tags],
    imageFiles: [...draft.imageFiles],
  }
  const errors = validateRegistrationSkillDraft(snapshot)
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors).join('. '))
  }
  if (typeof authorId !== 'string' || !authorId.trim()) {
    throw new Error('Укажите автора навыка')
  }

  const imageUrls = await Promise.all(snapshot.imageFiles.map(readImageDataUrl))
  return {
    id: generateId(),
    title: snapshot.title.trim(),
    description: snapshot.description,
    type: snapshot.type,
    category: snapshot.category,
    tags: snapshot.tags,
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
    authorId,
    createdAt: new Date().toISOString(),
  }
}
