import editIcon from '@/shared/assets/icons/edit.svg'
import { useState, useId } from 'react'
import type { User, City } from '@/shared/types'
import { FormInput } from '@/shared/ui/FormInput'
import { DatePicker } from '@/shared/ui/DatePicker'
import { Select } from '@/shared/ui/Select'
import { ImagePicker } from '@/shared/ui/ImagePicker'
import { validateRegistrationPersonalDraft } from '@/features/auth/model/registrationValidation'
import { validateCredentials } from '@/features/auth/model/Credentials'
import formStyles from '@/shared/styles/formControls.module.css'
import styles from './ProfileForm.module.css'

export interface ProfileDraft {
  email: string
  name: string
  birthDate: Date | null
  city: string
  about: string
  avatarFile: File | null
  password?: string
}

interface ProfileFormProps {
  initialValues: User & { about?: string }
  cities: City[]
  onSubmit: (draft: ProfileDraft) => void | Promise<void>
  externalError?: string
  disabled?: boolean
}

export function ProfileForm({
  initialValues,
  cities,
  onSubmit,
  externalError,
  disabled = false,
}: ProfileFormProps) {
  // --- Состояния полей ---
  const [email, setEmail] = useState(initialValues.email)
  const [name, setName] = useState(initialValues.name)
  const [birthDate, setBirthDate] = useState<Date | null>(
    initialValues.birthDate ? new Date(initialValues.birthDate) : null,
  )
  const [city, setCity] = useState(initialValues.city)
  const [about, setAbout] = useState(initialValues.about ?? initialValues.description ?? '')

  // Аватар
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [validatedAvatar, setValidatedAvatar] = useState<File | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const isAvatarPending = avatarFile !== null && avatarFile !== validatedAvatar

  // Пароль
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Ошибки валидации DatePicker (внутренние)
  const [dateValidationError, setDateValidationError] = useState<string | null>(null)

  // Ошибки формы
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formId = useId()
  const today = new Date()
  const cityNames = cities.map((c) => c.name)

  // --- Отправка формы ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (disabled || isSubmitting || isAvatarPending) return

    const newErrors: Record<string, string> = {}

    // 1. Валидация личных данных (имя, дата, город)
    const personalDraft = {
      name,
      birthDate,
      gender: initialValues.gender,
      city,
    }

    const personalErrors = validateRegistrationPersonalDraft(personalDraft, cities, today)

    if (personalErrors.birthDate && !birthDate) {
      delete personalErrors.birthDate
    }

    Object.assign(newErrors, personalErrors)

    if (dateValidationError) {
      newErrors.birthDate = dateValidationError
    }

    // 2. Валидация email (режим 'login' не требует пароль)
    const emailErrors = validateCredentials({ email }, 'login')
    if (emailErrors.email) {
      newErrors.email = emailErrors.email
    }

    // 3. Валидация пароля (только если пользователь его меняет)
    if (showPassword && password) {
      const passwordErrors = validateCredentials({ email, password }, 'register')
      if (passwordErrors.password) {
        setPasswordError(passwordErrors.password)
        newErrors.password = passwordErrors.password
      } else {
        setPasswordError(null)
      }
    } else {
      setPasswordError(null)
    }

    // 4. Ошибки аватара
    if (avatarError) {
      newErrors.avatar = avatarError
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      return
    }

    // 5. Отправка
    try {
      setIsSubmitting(true)
      await onSubmit({
        email,
        name,
        birthDate,
        city,
        about,
        avatarFile,
        password: showPassword && password ? password : undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormDisabled = disabled || isSubmitting

  return (
    <form className={formStyles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.layout}>
        {/* Левая колонка с полями */}
        <div className={styles.fields}>
          <div className={styles.credentials}>
            <FormInput
              label="Почта"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isFormDisabled}
              error={errors.email}
              endAdornment={<img src={editIcon} alt="" width={20} height={20} />}
            />

            <div className={styles.passwordBlock}>
              {!showPassword ? (
                <button
                  type="button"
                  className={styles.changePasswordBtn}
                  onClick={() => setShowPassword(true)}
                  disabled={isFormDisabled}
                >
                  Изменить пароль
                </button>
              ) : (
                <FormInput
                  label="Новый пароль"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isFormDisabled}
                  error={passwordError || undefined}
                />
              )}
            </div>
          </div>

          <FormInput
            label="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isFormDisabled}
            error={errors.name}
            endAdornment={<img src={editIcon} alt="" width={20} height={20} />}
          />

          <div className={styles.row}>
            <DatePicker
              label="Дата рождения"
              value={birthDate}
              onChange={setBirthDate}
              maxDate={today}
              disabled={isFormDisabled}
              error={errors.birthDate}
              onValidationChange={setDateValidationError}
            />
            <Select
              label="Пол"
              options={['Мужской', 'Женский']}
              value={initialValues.gender === 'female' ? 'Женский' : 'Мужской'}
              onChange={() => {}}
              disabled={true}
              error={errors.gender}
            />
          </div>

          <Select
            label="Город"
            options={cityNames}
            value={city}
            onChange={setCity}
            disabled={isFormDisabled}
            error={errors.city}
          />

          <div className={styles.textareaWrapper}>
            <label className={styles.label} htmlFor={`${formId}-about`}>
              О себе
            </label>
            <div className={styles.textareaContainer}>
              <textarea
                id={`${formId}-about`}
                className={styles.textarea}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                disabled={isFormDisabled}
                rows={4}
              />
              <span className={styles.textareaIcon}>
                <img src={editIcon} alt="" width={20} height={20} />
              </span>
            </div>
          </div>

          {externalError && <p className={formStyles.error}>{externalError}</p>}

          <button
            type="submit"
            className={`${formStyles.button} ${formStyles.primaryButton} ${styles.submitButton}`}
            disabled={isFormDisabled || isAvatarPending}
          >
            {isSubmitting ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>

        {/* Правая колонка с аватаром */}
        <div className={styles.avatarColumn}>
          <ImagePicker
            value={avatarFile}
            onChange={setAvatarFile}
            acceptedTypes={['image/jpeg', 'image/png']}
            disabled={isFormDisabled}
            error={avatarError ?? undefined}
            onValidationChange={setAvatarError}
            onPreviewLoad={setValidatedAvatar}
            previewClassName={styles.avatarWrapper}
            placeholder={
              initialValues.avatarUrl ? (
                <img
                  src={initialValues.avatarUrl}
                  alt="Текущий аватар"
                  className={styles.avatarPreview}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>{initialValues.name.charAt(0)}</div>
              )
            }
          />
        </div>
      </div>
    </form>
  )
}
