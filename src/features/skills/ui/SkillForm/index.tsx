import { useState, useRef, type FormEvent } from 'react'

import {
  validateRegistrationSkillDraft,
  type RegistrationSkillDraft,
  type RegistrationSkillDraftErrors,
} from '@/entities/skill/model/registrationSkillDraft'

import { SKILL_IMAGE_TYPES, SKILL_IMAGE_MAX_SIZE_BYTES } from '@/entities/skill/model/skillDraft'

import { FormInput } from '@/shared/ui/FormInput'
import { SkillCategorySelect } from '@/shared/ui/SkillCategorySelect'
import { MultiImagePicker } from '@/shared/ui/MultiImagePicker'
import styles from './SkillForm.module.css'

interface SkillFormProps {
  initialValues: RegistrationSkillDraft
  onSubmit: (draft: RegistrationSkillDraft) => void | Promise<void>
  externalError?: string
  disabled?: boolean
  onBack?: (draft: RegistrationSkillDraft) => void
}

export function SkillForm({
  initialValues,
  onBack,
  onSubmit,
  externalError,
  disabled = false,
}: SkillFormProps) {
  const [draft, setDraft] = useState<RegistrationSkillDraft>(() => ({
    ...initialValues,
    type: 'teach',
    tags: [...initialValues.tags],
    imageFiles: [...initialValues.imageFiles],
  }))

  const [imageSlots, setImageSlots] = useState<(File | null)[]>(() => [...initialValues.imageFiles])

  const [imageError, setImageError] = useState<string | null>(null)

  const [errors, setErrors] = useState<RegistrationSkillDraftErrors>({})

  const [isSubmitting, setIsSubmitting] = useState(false)

  const submittingRef = useRef(false)

  const [submitError, setSubmitError] = useState<string | null>(null)

  const isDisabled = disabled || isSubmitting

  const updateField = <K extends keyof RegistrationSkillDraft>(
    field: K,
    value: RegistrationSkillDraft[K],
  ) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
      type: 'teach',
    }))

    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }))

    setSubmitError(null)
  }

  const photoError = imageError || errors.imageFiles

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isDisabled || submittingRef.current) {
      return
    }
    const validationErrors = validateRegistrationSkillDraft(draft)

    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0 || imageError !== null) {
      return
    }
    submittingRef.current = true
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await onSubmit(draft)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Не удалось отправить форму. Попробуйте ещё раз.',
      )
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <FormInput
        label="Название навыка"
        placeholder="Введите название навыка"
        value={draft.title}
        onChange={(event) => updateField('title', event.target.value)}
        error={errors.title}
        disabled={isDisabled}
        required
      />
      <SkillCategorySelect
        categoryMode="single"
        maxSubcategories={1}
        disabled={isDisabled}
        categoryError={errors.category}
        subcategoryError={errors.tags}
        value={{
          categories: draft.category ? [draft.category] : [],
          subcategories: draft.tags,
        }}
        onChange={({ categories, subcategories }) => {
          setDraft((prev) => ({
            ...prev,
            category: categories[0] ?? '',
            tags: subcategories,
            type: 'teach',
          }))

          setErrors((prev) => ({
            ...prev,
            category: undefined,
            tags: undefined,
          }))
          setSubmitError(null)
        }}
      />

      <div className={styles.descriptionField}>
        <label htmlFor="skill-description" className={styles.label}>
          Описание навыка
        </label>

        <textarea
          id="skill-description"
          name="description"
          className={styles.textarea}
          placeholder="Расскажите о навыке, которому хотите научить"
          value={draft.description}
          onChange={(event) => updateField('description', event.target.value)}
          disabled={isDisabled}
          rows={5}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'skill-description-error' : undefined}
        />

        {errors.description && (
          <p id="skill-description-error" className={styles.error} role="alert">
            {errors.description}
          </p>
        )}
      </div>

      <MultiImagePicker
        value={imageSlots}
        disabled={isDisabled}
        onValidationChange={setImageError}
        onChange={(files) => {
          setImageSlots(files)

          updateField(
            'imageFiles',
            files.filter((file): file is File => file !== null),
          )
        }}
        acceptedTypes={SKILL_IMAGE_TYPES}
        maxSizeBytes={SKILL_IMAGE_MAX_SIZE_BYTES}
      />

      {photoError && (
        <p className={styles.error} role="alert">
          {photoError}
        </p>
      )}

      {externalError && (
        <p className={styles.error} role="alert">
          {externalError}
        </p>
      )}

      {submitError && (
        <p className={styles.error} role="alert">
          {submitError}
        </p>
      )}

      <div className={styles.actions}>
        {onBack && (
          <button
            type="button"
            className={`${styles.button} ${styles.backButton}`}
            onClick={() => onBack(draft)}
            disabled={isDisabled}
          >
            Назад
          </button>
        )}

        <button
          type="submit"
          className={`${styles.button} ${styles.submitButton}`}
          disabled={isDisabled}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Отправка...' : 'Продолжить'}
        </button>
      </div>
    </form>
  )
}
