import { validateImageFile } from '@/shared/lib/validateImageFile'
import {
  SKILL_IMAGE_MAX_SIZE_BYTES,
  SKILL_IMAGE_TYPES,
  validateSkillDraft,
  type SkillDraft,
} from './skillDraft'

export interface RegistrationSkillDraft extends Omit<SkillDraft, 'imageFile'> {
  imageFiles: File[]
}

export type RegistrationSkillDraftErrors = Partial<Record<keyof RegistrationSkillDraft, string>>

export function validateRegistrationSkillDraft(
  draft: RegistrationSkillDraft,
): RegistrationSkillDraftErrors {
  const files = Array.isArray(draft.imageFiles) ? draft.imageFiles : []
  const { imageFile, ...errors } = validateSkillDraft({
    ...draft,
    imageFile: files[0] instanceof File ? files[0] : null,
  })
  const result: RegistrationSkillDraftErrors = errors
  if (draft.type !== 'teach') result.type = 'При регистрации можно предложить только свой навык'
  if (draft.tags.length !== 1) result.tags = 'Выберите ровно одну подкатегорию'
  const invalidFile = files.some((file) => !(file instanceof File))
  const extraImageError = files
    .slice(1)
    .filter((file) => file instanceof File)
    .map((file) => validateImageFile(file, SKILL_IMAGE_TYPES, SKILL_IMAGE_MAX_SIZE_BYTES))
    .find(Boolean)
  if (!Array.isArray(draft.imageFiles) || invalidFile || imageFile || extraImageError) {
    result.imageFiles = imageFile || extraImageError || 'Выберите файлы изображений'
  }
  return result
}
