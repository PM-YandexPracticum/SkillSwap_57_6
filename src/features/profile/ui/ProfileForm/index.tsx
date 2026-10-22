import { useState, useId } from 'react'
import type { User, City } from '@/shared/types'
import { FormInput } from '@/shared/ui/FormInput'
import { DatePicker } from '@/shared/ui/DatePicker'
import { Select } from '@/shared/ui/Select'
import { validateRegistrationPersonalDraft } from '@/features/auth/model/registrationValidation'
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

  // Ошибки формы
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formId = useId()
  const today = new Date()
  const cityNames = cities.map((c) => c.name)

  // --- Обработчик выбора аватара ---
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setAvatarError('Допустимы только форматы JPEG и PNG')
      return
    }

    setAvatarError(null)
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
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

    // 2. Валидация email (базовая)
    if (!email.includes('@')) newErrors.email = 'Введите корректный email'

    // 3. Валидация пароля (если введен)
    if (showPassword && password) {
      if (password.length < 6) {
        setPasswordError('Пароль должен быть не менее 6 символов')
        newErrors.password = 'Ошибка пароля'
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
              {/* Иконка "Изображение с карандашом" из макета */}
              <EditAvatarIcon />
            </label>
          </div>
          {avatarError && <p className={styles.avatarError}>{avatarError}</p>}
        </div>
      </div>
    </form>
  )
}

// --- Иконки ---
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

const EditAvatarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9.20595 10.84C7.79234 10.84 6.64844 9.69609 6.64844 8.28248C6.64844 6.86888 7.79234 5.72498 9.20595 5.72498C10.6195 5.72498 11.7635 6.86888 11.7635 8.28248C11.7635 9.69609 10.6195 10.84 9.20595 10.84ZM9.20595 7.11998C8.56424 7.11998 8.04344 7.64078 8.04344 8.28248C8.04344 8.92419 8.56424 9.44499 9.20595 9.44499C9.84765 9.44499 10.3684 8.92419 10.3684 8.28248C10.3684 7.64078 9.84765 7.11998 9.20595 7.11998Z"
      fill="#253017"
    />
    <path
      d="M14.7875 21.9999H9.20752C4.15761 21.9999 2 19.8423 2 14.7924V9.21241C2 4.16249 4.15761 2.00488 9.20752 2.00488H12.9275C13.3088 2.00488 13.625 2.32108 13.625 2.70238C13.625 3.08369 13.3088 3.39989 12.9275 3.39989H9.20752C4.92021 3.39989 3.395 4.92509 3.395 9.21241V14.7924C3.395 19.0797 4.92021 20.6049 9.20752 20.6049H14.7875C19.0749 20.6049 20.6001 19.0797 20.6001 14.7924V10.1424C20.6001 9.76111 20.9163 9.44491 21.2976 9.44491C21.6789 9.44491 21.9951 9.76111 21.9951 10.1424V14.7924C21.9951 19.8423 19.8375 21.9999 14.7875 21.9999Z"
      fill="#253017"
    />
    <path
      d="M15.4115 9.90996C15.0488 9.90996 14.714 9.77976 14.4722 9.52866C14.1839 9.24036 14.0444 8.81256 14.1095 8.37546L14.2955 7.08275C14.342 6.75725 14.5373 6.35735 14.7791 6.12485L18.155 2.74894C19.5035 1.40044 20.6753 2.17234 21.2519 2.74894C21.8006 3.29764 22.0517 3.87424 21.9959 4.46945C21.9494 4.94375 21.7076 5.39945 21.2519 5.84585L17.876 9.22176C17.6435 9.45426 17.2436 9.64956 16.9181 9.70536L15.6254 9.89136C15.551 9.90996 15.4766 9.90996 15.4115 9.90996ZM19.1315 3.74404L15.7556 7.11995C15.7277 7.14785 15.6812 7.25015 15.6719 7.29665L15.4952 8.50566L16.7135 8.33826C16.7507 8.32896 16.853 8.28246 16.8902 8.24526L20.2661 4.86935C20.4707 4.66475 20.5916 4.47875 20.6009 4.33925C20.6195 4.14394 20.4242 3.90214 20.2661 3.74404C19.7825 3.26044 19.5593 3.31624 19.1315 3.74404Z"
      fill="#253017"
    />
    <path
      d="M20.275 6.54342C20.2099 6.54342 20.1448 6.53412 20.089 6.51552C18.8428 6.16212 17.8477 5.16702 17.4943 3.92081C17.392 3.54881 17.6059 3.16751 17.9779 3.06521C18.3499 2.96291 18.7312 3.17681 18.8335 3.54881C19.0567 4.33001 19.6798 4.96242 20.4703 5.18562C20.8423 5.28792 21.0562 5.67852 20.9539 6.04122C20.8516 6.33882 20.5726 6.54342 20.275 6.54342Z"
      fill="#253017"
    />
    <path
      d="M3.32012 19.1636C3.09692 19.1636 2.87372 19.052 2.74352 18.8567C2.52962 18.5405 2.61332 18.1034 2.92952 17.8895L7.51444 14.8112C8.51884 14.1416 9.90454 14.216 10.8159 14.9879L11.1228 15.2576C11.5878 15.6575 12.3783 15.6575 12.8341 15.2576L16.7029 11.9375C17.6887 11.0912 19.2418 11.0912 20.2369 11.9375L21.7528 13.2395C22.0411 13.4906 22.0783 13.9277 21.8272 14.2253C21.5761 14.5136 21.139 14.5508 20.8414 14.2997L19.3255 12.9977C18.8605 12.5978 18.07 12.5978 17.6143 12.9977L13.7455 16.3178C12.7597 17.1641 11.2065 17.1641 10.2114 16.3178L9.90454 16.0481C9.47674 15.6854 8.76994 15.6482 8.29564 15.9737L3.72002 19.052C3.58982 19.1264 3.45032 19.1636 3.32012 19.1636Z"
      fill="#253017"
    />
  </svg>
)
