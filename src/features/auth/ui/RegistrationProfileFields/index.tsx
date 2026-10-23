import { useEffect, useState } from 'react'
import type {
  AvatarSettings,
  RegistrationProfileDraft,
  RegistrationProfileErrors,
} from '../../model/registrationTypes'
import { validateRegistrationProfileDraft } from '../../model/registrationValidation'
import { RegistrationPersonalFields } from '../RegistrationPersonalFields'
import { ImagePicker } from '@/shared/ui/ImagePicker'
import { SkillCategorySelect } from '@/shared/ui/SkillCategorySelect'
import styles from './RegistrationProfileFields.module.css'
import type { City } from '@/shared/types'

export interface RegistrationProfileFieldsProps {
  value: RegistrationProfileDraft
  cities: readonly City[]
  avatarSettings: AvatarSettings
  disabled?: boolean
  resetKey?: number
  onChange: (value: RegistrationProfileDraft) => void
  onBack: () => void
  onContinue: (value: RegistrationProfileDraft) => void
}

export function RegistrationProfileFields({
  value,
  cities,
  avatarSettings,
  disabled = false,
  resetKey,
  onChange,
  onBack,
  onContinue,
}: RegistrationProfileFieldsProps) {
  const [errors, setErrors] = useState<RegistrationProfileErrors>({})
  const [dateError, setDateError] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  useEffect(() => {
    setErrors({})
    setDateError(null)
    setAvatarError(null)
  }, [resetKey])

  const clearErrors = (fields: (keyof RegistrationProfileErrors)[]) => {
    setErrors((previous) => {
      const next = { ...previous }
      fields.forEach((field) => delete next[field])
      return next
    })
  }

  const handlePersonalChange = (
    personal: Pick<RegistrationProfileDraft, 'name' | 'birthDate' | 'gender' | 'city'>,
  ) => {
    const changedFields = (['name', 'birthDate', 'gender', 'city'] as const).filter(
      (field) => !Object.is(value[field], personal[field]),
    )
    clearErrors(changedFields)
    onChange({ ...value, ...personal })
  }

  const handleAvatarChange = (avatarFile: File | null) => {
    clearErrors(['avatarFile'])
    onChange({ ...value, avatarFile })
  }

  const handleInterestsChange = (interests: { categories: string[]; subcategories: string[] }) => {
    clearErrors(['learnCategories', 'learnSubcategories'])
    onChange({
      ...value,
      learnCategories: interests.categories,
      learnSubcategories: interests.subcategories,
    })
  }

  const handleContinue = () => {
    const nextErrors = validateRegistrationProfileDraft(value, cities, avatarSettings)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || dateError || avatarError) return
    onContinue(value)
  }

  return (
    <div className={styles.container}>
      <div className={styles.fields}>
        <ImagePicker
          variant="avatar"
          value={value.avatarFile}
          onChange={handleAvatarChange}
          acceptedTypes={avatarSettings.acceptedTypes}
          maxSizeBytes={avatarSettings.maxSizeBytes}
          disabled={disabled}
          error={avatarError ?? errors.avatarFile}
          onValidationChange={setAvatarError}
        />

        <RegistrationPersonalFields
          value={value}
          errors={errors}
          cities={cities}
          disabled={disabled}
          resetKey={resetKey}
          onChange={handlePersonalChange}
          onDateErrorChange={setDateError}
        />

        <SkillCategorySelect
          categoryMode="multiple"
          value={{
            categories: value.learnCategories,
            subcategories: value.learnSubcategories,
          }}
          onChange={handleInterestsChange}
          categoryLabel="Категории интересов"
          subcategoryLabel="Подкатегории интересов"
          categoryError={errors.learnCategories}
          subcategoryError={errors.learnSubcategories}
          categoryRequired
          subcategoryRequired
          disabled={disabled}
        />
      </div>

      <div className={styles.actions}>
        <button className={styles.backButton} type="button" onClick={onBack} disabled={disabled}>
          Назад
        </button>
        <button
          className={styles.continueButton}
          type="button"
          onClick={handleContinue}
          disabled={disabled}
        >
          Продолжить
        </button>
      </div>
    </div>
  )
}
