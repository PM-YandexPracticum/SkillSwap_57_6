import { SKILL_CATEGORIES } from '@/shared/lib/constants'
import { formatBirthDate, isValidBirthDate } from '@/shared/lib/profileDate'
import { getAllSubcategories, isSubcategoryOfCategory } from '@/shared/lib/skillCategories'
import { validateImageFile } from '@/shared/lib/validateImageFile'
import type { City } from '@/shared/types'
import type {
  AvatarSettings,
  RegistrationPersonalDraft,
  RegistrationPersonalErrors,
  RegistrationProfileDraft,
  RegistrationProfileErrors,
} from './registrationTypes'

export function validateRegistrationPersonalDraft(
  draft: RegistrationPersonalDraft,
  cities: readonly City[],
  today = new Date(),
): RegistrationPersonalErrors {
  const errors: RegistrationPersonalErrors = {}
  if (typeof draft.name !== 'string' || !draft.name.trim()) errors.name = 'Введите имя'
  const birthDate = draft.birthDate && formatBirthDate(draft.birthDate)
  if (!birthDate || !isValidBirthDate(birthDate, today)) {
    errors.birthDate = 'Укажите существующую дату рождения не позже сегодняшней'
  }
  if (!['male', 'female', 'other'].includes(draft.gender)) errors.gender = 'Выберите пол'
  if (!draft.city || !cities.some((city) => city.name === draft.city)) {
    errors.city = 'Выберите город из списка'
  }
  return errors
}

function validateInterests(values: string[], catalogue: readonly string[]): string | undefined {
  if (!Array.isArray(values) || values.length === 0) return 'Выберите хотя бы одно значение'
  if (new Set(values).size !== values.length) return 'Значения не должны повторяться'
  if (values.some((value) => !catalogue.includes(value))) return 'Неизвестное значение'
  return undefined
}

export function validateRegistrationProfileDraft(
  draft: RegistrationProfileDraft,
  cities: readonly City[],
  avatarSettings: AvatarSettings,
  today = new Date(),
): RegistrationProfileErrors {
  const errors: RegistrationProfileErrors = validateRegistrationPersonalDraft(draft, cities, today)
  const avatarError =
    draft.avatarFile instanceof File
      ? validateImageFile(
          draft.avatarFile,
          avatarSettings.acceptedTypes,
          avatarSettings.maxSizeBytes,
        )
      : 'Выберите аватар'
  if (avatarError) errors.avatarFile = avatarError
  const categoriesError = validateInterests(draft.learnCategories, SKILL_CATEGORIES)
  const subcategoriesError = validateInterests(draft.learnSubcategories, getAllSubcategories())
  if (categoriesError) errors.learnCategories = categoriesError
  if (subcategoriesError) errors.learnSubcategories = subcategoriesError
  else if (
    !Array.isArray(draft.learnCategories) ||
    draft.learnSubcategories.some(
      (subcategory) =>
        !draft.learnCategories.some((category) => isSubcategoryOfCategory(category, subcategory)),
    )
  ) {
    errors.learnSubcategories = 'Подкатегории должны относиться к выбранным категориям'
  }
  return errors
}
