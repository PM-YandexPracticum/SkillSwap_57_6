import { useState, useId } from 'react'
import type { User, City } from '@/shared/types'
import { FormInput } from '@/shared/ui/FormInput'
import { DatePicker } from '@/shared/ui/DatePicker'
import { Select } from '@/shared/ui/Select'
import { ImagePicker } from '@/shared/ui/ImagePicker'
import { validateRegistrationPersonalDraft } from '@/features/auth/model/registrationValidation'
import { validateCredentials } from '@/features/auth/model/Credentials'
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
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.layout}>
        {/* Левая колонка с полями */}
        <div className={styles.fields}>
          <FormInput
            label="Почта"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isFormDisabled}
            error={errors.email}
            endAdornment={<EditIcon />}
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

          <FormInput
            label="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isFormDisabled}
            error={errors.name}
            endAdornment={<EditIcon />}
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
                <EditIcon />
              </span>
            </div>
          </div>

          {externalError && <p className={styles.externalError}>{externalError}</p>}

          <button
            type="submit"
            className={styles.submitButton}
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

// --- Иконка карандаша (из макета) ---
const EditIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6.0874 18.9705C5.51527 18.9705 4.98065 18.7735 4.59611 18.4078C4.10839 17.9482 3.87391 17.2541 3.95832 16.5038L4.30535 13.4649C4.371 12.8928 4.71804 12.1331 5.12134 11.7204L12.8217 3.56987C14.7444 1.53458 16.7515 1.47831 18.7868 3.40105C20.8221 5.32378 20.8784 7.33093 18.9557 9.36621L11.2553 17.5167C10.8614 17.9388 10.1298 18.3327 9.5577 18.4265L6.5376 18.9424C6.37815 18.9518 6.23746 18.9705 6.0874 18.9705ZM15.8324 3.39167C15.1102 3.39167 14.4818 3.84187 13.844 4.51717L6.14367 12.6771C5.95609 12.874 5.74037 13.343 5.70285 13.615L5.35582 16.6538C5.3183 16.9634 5.39334 17.2166 5.56216 17.376C5.73099 17.5355 5.98423 17.5918 6.29374 17.5449L9.31384 17.029C9.58584 16.9821 10.036 16.7383 10.2236 16.5413L17.9239 8.39078C19.087 7.15272 19.509 6.00846 17.8114 4.414C17.0611 3.6918 16.4139 3.39167 15.8324 3.39167Z"
      fill="#69735D"
    />
    <path
      d="M17.1516 10.9325C17.1328 10.9325 17.1047 10.9325 17.0859 10.9325C14.1596 10.6418 11.8054 8.41889 11.3552 5.51134C11.299 5.1268 11.5616 4.77039 11.9461 4.70473C12.3307 4.64846 12.6871 4.91108 12.7527 5.29562C13.1092 7.56539 14.9475 9.30992 17.236 9.53502C17.6205 9.57254 17.9019 9.91956 17.8644 10.3041C17.8175 10.6605 17.508 10.9325 17.1516 10.9325Z"
      fill="#69735D"
    />
    <path
      d="M20.586 22H3.70344C3.31889 22 3 21.6811 3 21.2966C3 20.912 3.31889 20.5931 3.70344 20.5931H20.586C20.9705 20.5931 21.2894 20.912 21.2894 21.2966C21.2894 21.6811 20.9705 22 20.586 22Z"
      fill="#69735D"
    />
  </svg>
)
