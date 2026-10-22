import { useState, useId } from 'react'
import type { User, City } from '@/shared/types'
import { FormInput } from '@/shared/ui/FormInput'
import { DatePicker } from '@/shared/ui/DatePicker'
import { Select } from '@/shared/ui/Select'
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)

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

  // --- Обработчик выбора аватара (с проверкой на повреждение) ---
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Проверка MIME-типа
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setAvatarError('Допустимы только форматы JPEG и PNG')
      return
    }

    // Проверка на то, что файл реально открывается как картинка
    const img = new Image()
    img.onload = () => {
      setAvatarError(null)
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
    img.onerror = () => {
      setAvatarError('Файл поврежден или не является изображением')
    }
    img.src = URL.createObjectURL(file)
  }

  // --- Отправка формы ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (disabled || isSubmitting) return

    const newErrors: Record<string, string> = {}

    // 1. Валидация личных данных (имя, дата, город)
    const personalDraft = {
      name,
      birthDate,
      gender: initialValues.gender,
      city,
    }

    const personalErrors = validateRegistrationPersonalDraft(personalDraft, cities, today)

    // По AC: если дата пустая, это не ошибка (можно сохранить без неё)
    if (personalErrors.birthDate && !birthDate) {
      delete personalErrors.birthDate
    }

    Object.assign(newErrors, personalErrors)

    // Проверка на внутреннюю ошибку DatePicker (например, 31.02.2024)
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
      // Режим 'register' требует минимум 8 символов
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

    // Если есть ошибки — блокируем отправку
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
            <textarea
              id={`${formId}-about`}
              className={styles.textarea}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              disabled={isFormDisabled}
              rows={4}
            />
          </div>

          {externalError && <p className={styles.externalError}>{externalError}</p>}

          <button type="submit" className={styles.submitButton} disabled={isFormDisabled}>
            {isSubmitting ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>

        {/* Правая колонка с аватаром */}
        <div className={styles.avatarColumn}>
          <div className={styles.avatarWrapper}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Новый аватар" className={styles.avatarPreview} />
            ) : initialValues.avatarUrl ? (
              <img
                src={initialValues.avatarUrl}
                alt="Текущий аватар"
                className={styles.avatarPreview}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>{initialValues.name.charAt(0)}</div>
            )}

            <label className={styles.avatarUpload}>
              <input
                type="file"
                accept="image/jpeg, image/png"
                onChange={handleAvatarChange}
                disabled={isFormDisabled}
                className={styles.fileInput}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M9.206 10.84a2.556 2.556 0 0 1-2.558-2.558 2.556 2.556 0 0 1 2.558-2.557 2.556 2.556 0 0 1 2.558 2.557 2.556 2.556 0 0 1-2.558 2.558m0-3.72a1.163 1.163 0 1 0 0 2.326 1.163 1.163 0 0 0 0-2.326"
                />
                <path
                  fill="currentColor"
                  d="M14.788 22h-5.58C4.158 22 2 19.842 2 14.792v-5.58c0-5.05 2.158-7.207 7.208-7.207h3.72c.38 0 .697.316.697.697a.703.703 0 0 1-.697.698h-3.72c-4.288 0-5.813 1.525-5.813 5.812v5.58c0 4.288 1.525 5.813 5.813 5.813h5.58c4.287 0 5.812-1.525 5.812-5.813v-4.65c0-.38.316-.697.698-.697.38 0 .697.316.697.697v4.65c0 5.05-2.158 7.208-7.208 7.208"
                />
                <path
                  fill="currentColor"
                  d="M15.412 9.91c-.363 0-.698-.13-.94-.381a1.35 1.35 0 0 1-.362-1.154l.186-1.292c.046-.326.241-.726.483-.958l3.376-3.376c1.348-1.349 2.52-.577 3.097 0 .549.549.8 1.125.744 1.72-.047.475-.288.93-.744 1.377l-3.376 3.376a1.96 1.96 0 0 1-.958.483l-1.293.186c-.074.019-.148.019-.213.019m3.72-6.166L15.756 7.12a.5.5 0 0 0-.084.177l-.177 1.209 1.219-.168a.5.5 0 0 0 .176-.093l3.376-3.376c.205-.204.326-.39.335-.53.018-.195-.177-.437-.335-.595-.483-.484-.707-.428-1.134 0"
                />
                <path
                  fill="currentColor"
                  d="M20.275 6.543a.6.6 0 0 1-.186-.027 3.79 3.79 0 0 1-2.595-2.595.69.69 0 0 1 .484-.856.69.69 0 0 1 .855.484 2.4 2.4 0 0 0 1.637 1.637.697.697 0 0 1 .484.855.735.735 0 0 1-.679.502M3.32 19.164a.699.699 0 0 1-.39-1.274l4.584-3.079c1.005-.67 2.39-.595 3.302.177l.307.27c.465.4 1.255.4 1.711 0l3.869-3.32c.986-.847 2.539-.847 3.534 0l1.516 1.301a.703.703 0 0 1 .074.986.703.703 0 0 1-.986.075l-1.515-1.302c-.466-.4-1.256-.4-1.712 0l-3.869 3.32c-.985.846-2.538.846-3.534 0l-.306-.27c-.428-.363-1.135-.4-1.61-.074L3.72 19.052a.8.8 0 0 1-.4.112"
                />
              </svg>
            </label>
          </div>
          {avatarError && <p className={styles.avatarError}>{avatarError}</p>}
        </div>
      </div>
    </form>
  )
}

// --- Иконка карандаша для полей ввода ---
const EditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14.166 2.50001C14.3859 2.28011 14.6477 2.10569 14.9366 1.98652C15.2254 1.86735 15.5356 1.80591 15.849 1.80591C16.1624 1.80591 16.4725 1.86735 16.7614 1.98652C17.0503 2.10569 17.3121 2.28011 17.532 2.50001C17.7519 2.71992 17.9263 2.98175 18.0455 3.27061C18.1647 3.55947 18.2261 3.8696 18.2261 4.18301C18.2261 4.49642 18.1647 4.80655 18.0455 5.09541C17.9263 5.38427 17.7519 5.6461 17.532 5.86601L6.41602 16.982L2.02148 18.2285L3.26798 13.834L14.166 2.50001Z"
      stroke="#253017"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
