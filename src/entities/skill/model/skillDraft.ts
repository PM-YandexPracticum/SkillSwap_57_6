import { SKILL_CATEGORIES } from '@/shared/lib/constants'
import { getAllSubcategories, isSubcategoryOfCategory } from '@/shared/lib/skillCategories'
import { validateImageFile } from '@/shared/lib/validateImageFile'
import type { SkillType } from '@/shared/types'

export interface SkillDraft {
  title: string
  description: string
  type: SkillType
  category: string
  tags: string[]
  imageFile: File | null
}

/** Ошибки по полям; поле без ошибки отсутствует */
export type SkillDraftErrors = Partial<Record<keyof SkillDraft, string>>

export const SKILL_TITLE_MIN_LENGTH = 3
export const SKILL_TITLE_MAX_LENGTH = 50
export const SKILL_DESCRIPTION_MAX_LENGTH = 500
export const SKILL_TAGS_MAX_COUNT = 5
export const SKILL_IMAGE_TYPES = ['image/jpeg', 'image/png'] as const
export const SKILL_IMAGE_MAX_SIZE_BYTES = 2 * 1024 * 1024

const SKILL_TYPES: readonly SkillType[] = ['teach', 'learn']

/** Начальные значения формы; каждый вызов возвращает новый объект и новый массив tags */
export function createInitialSkillDraft(): SkillDraft {
  return {
    title: '',
    description: '',
    type: 'teach',
    category: '',
    tags: [],
    imageFile: null,
  }
}

function validateTags(category: string, tags: string[]): string | undefined {
  if (tags.length > SKILL_TAGS_MAX_COUNT) {
    return `Можно выбрать не больше ${SKILL_TAGS_MAX_COUNT} подкатегорий`
  }
  if (new Set(tags).size !== tags.length) {
    return 'Подкатегории не должны повторяться'
  }
  if (tags.some((tag) => !getAllSubcategories().includes(tag))) {
    return 'Неизвестная подкатегория'
  }
  if (tags.some((tag) => !isSubcategoryOfCategory(category, tag))) {
    return 'Подкатегория не относится к выбранной категории'
  }
  return undefined
}

/** Проверяет черновик навыка и возвращает ошибки полей; сам черновик не изменяет */
export function validateSkillDraft(draft: SkillDraft): SkillDraftErrors {
  const errors: SkillDraftErrors = {}
  const titleLength = draft.title.trim().length

  if (titleLength < SKILL_TITLE_MIN_LENGTH || titleLength > SKILL_TITLE_MAX_LENGTH) {
    errors.title = `Название должно содержать от ${SKILL_TITLE_MIN_LENGTH} до ${SKILL_TITLE_MAX_LENGTH} символов`
  }

  if (draft.description.length > SKILL_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Описание должно быть не длиннее ${SKILL_DESCRIPTION_MAX_LENGTH} символов`
  }

  if (!SKILL_TYPES.includes(draft.type)) {
    errors.type = 'Выберите тип навыка'
  }

  if (!draft.category) {
    errors.category = 'Выберите категорию'
  } else if (!SKILL_CATEGORIES.some((category) => category === draft.category)) {
    errors.category = 'Неизвестная категория'
  }

  const tagsError = validateTags(draft.category, draft.tags)
  if (tagsError) errors.tags = tagsError

  if (draft.imageFile) {
    const imageError = validateImageFile(
      draft.imageFile,
      SKILL_IMAGE_TYPES,
      SKILL_IMAGE_MAX_SIZE_BYTES,
    )
    if (imageError) errors.imageFile = imageError
  }

  return errors
}
