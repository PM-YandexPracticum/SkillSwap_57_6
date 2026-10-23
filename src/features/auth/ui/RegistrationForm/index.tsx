import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { City } from '@/shared/types'
import type { SkillGalleryImage } from '@/entities/skill/ui/SkillGallery'
import type { RegistrationSkillDraft } from '@/entities/skill/model/registrationSkillDraft'
import { CredentialForm } from '../CredentialForm'
import type { Credentials } from '../../model/Credentials'
import type { AvatarSettings, RegistrationProfileDraft } from '../../model/registrationTypes'
import { RegistrationProfileFields } from '../RegistrationProfileFields'
import { RegistrationPreview } from '../RegistrationPreview'
import { SkillForm } from '@/features/skills/ui/SkillForm'
import styles from './RegistrationForm.module.css'

export interface RegistrationFormProps {
  cities: readonly City[]
  avatarSettings: AvatarSettings
  onSubmit: (
    credentials: Credentials,
    profileDraft: RegistrationProfileDraft,
    skillDraft: RegistrationSkillDraft,
  ) => Promise<void>
  externalError?: string | null
  feedback?: ReactNode
  disabled?: boolean
  returnTo?: string
  onStepChange?: (step: 1 | 2 | 3) => void
  citiesLoading?: boolean
  citiesError?: string | null
  onRetryCities?: () => void
}

const INITIAL_PROFILE: RegistrationProfileDraft = {
  name: '',
  birthDate: null,
  gender: '',
  city: '',
  avatarFile: null,
  learnCategories: [],
  learnSubcategories: [],
}

const INITIAL_SKILL: RegistrationSkillDraft = {
  title: '',
  description: '',
  type: 'teach',
  category: '',
  tags: [],
  imageFiles: [],
}

interface PreviewUrls {
  avatarFile: File
  imageFiles: File[]
  avatarUrl: string
  images: SkillGalleryImage[]
}

export function RegistrationForm({
  cities,
  avatarSettings,
  onSubmit,
  externalError,
  feedback,
  disabled = false,
  returnTo,
  onStepChange,
  citiesLoading = false,
  citiesError,
  onRetryCities,
}: RegistrationFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [profileDraft, setProfileDraft] = useState(INITIAL_PROFILE)
  const [skillDraft, setSkillDraft] = useState(INITIAL_SKILL)
  const [showPreview, setShowPreview] = useState(false)
  const [previewUrls, setPreviewUrls] = useState<PreviewUrls | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const isFormDisabled = disabled || isSubmitting

  const goToStep = (nextStep: 1 | 2 | 3) => {
    setStep(nextStep)
    onStepChange?.(nextStep)
  }

  useEffect(() => {
    if (!showPreview || !profileDraft.avatarFile) {
      setPreviewUrls(null)
      return
    }

    const avatarUrl = URL.createObjectURL(profileDraft.avatarFile)
    const images = skillDraft.imageFiles.map((file) => ({
      src: URL.createObjectURL(file),
      alt: file.name || skillDraft.title,
    }))
    setPreviewUrls({
      avatarFile: profileDraft.avatarFile,
      imageFiles: skillDraft.imageFiles,
      avatarUrl,
      images,
    })

    return () => {
      URL.revokeObjectURL(avatarUrl)
      images.forEach(({ src }) => URL.revokeObjectURL(src))
    }
  }, [showPreview, profileDraft.avatarFile, skillDraft.imageFiles, skillDraft.title])

  const previewIsReady =
    previewUrls?.avatarFile === profileDraft.avatarFile &&
    previewUrls.imageFiles.length === skillDraft.imageFiles.length &&
    previewUrls.imageFiles.every((file, index) => file === skillDraft.imageFiles[index])

  const handleCredentialsSubmit = async (value: Credentials) => {
    setCredentials(value)
    goToStep(2)
  }

  const handleSkillSubmit = (draft: RegistrationSkillDraft) => {
    setSkillDraft(draft)
    setSubmitError(null)
    setPreviewUrls(null)
    setShowPreview(true)
  }

  const handleConfirm = async () => {
    if (!credentials || disabled || isSubmitting || submittingRef.current) return

    submittingRef.current = true
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await onSubmit(credentials, profileDraft, skillDraft)
      setShowPreview(false)
      setPreviewUrls(null)
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Не удалось завершить регистрацию. Попробуйте ещё раз.',
      )
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.form}>
      {!showPreview && feedback}
      <div className={styles.step} hidden={step !== 1}>
        <CredentialForm
          mode="register"
          onSubmit={handleCredentialsSubmit}
          externalError={externalError}
          disabled={isFormDisabled}
          returnTo={returnTo}
          submitLabel="Далее"
        />
      </div>

      <div className={styles.step} hidden={step !== 2}>
        {citiesLoading && <p role="status">Загружаем список городов...</p>}
        {citiesError && (
          <div role="alert">
            <p>Не удалось загрузить список городов: {citiesError}</p>
            {onRetryCities && (
              <button type="button" onClick={onRetryCities} disabled={isSubmitting}>
                Повторить
              </button>
            )}
          </div>
        )}
        <RegistrationProfileFields
          value={profileDraft}
          cities={cities}
          avatarSettings={avatarSettings}
          disabled={isFormDisabled || citiesLoading || !!citiesError}
          onChange={setProfileDraft}
          onBack={() => goToStep(1)}
          onContinue={() => goToStep(3)}
        />
      </div>

      <div className={styles.step} hidden={step !== 3}>
        <SkillForm
          initialValues={skillDraft}
          onSubmit={handleSkillSubmit}
          externalError={externalError ?? undefined}
          disabled={isFormDisabled}
          onBack={(draft) => {
            setSkillDraft(draft)
            goToStep(2)
          }}
        />
      </div>

      {showPreview &&
        (previewUrls && previewIsReady ? (
          <RegistrationPreview
            skill={{
              title: skillDraft.title,
              category: skillDraft.category,
              tags: skillDraft.tags,
              description: skillDraft.description,
            }}
            images={previewUrls.images}
            onEdit={() => {
              setShowPreview(false)
              setPreviewUrls(null)
              setSubmitError(null)
              goToStep(3)
            }}
            onConfirm={handleConfirm}
            disabled={isFormDisabled}
            error={submitError ?? externalError}
            feedback={feedback}
          />
        ) : (
          <p className={styles.previewStatus} role="status">
            Подготавливаем предпросмотр...
          </p>
        ))}
    </div>
  )
}
