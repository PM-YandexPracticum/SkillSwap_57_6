import { useEffect, useState } from 'react'
import { fetchCities } from '@/api/cities'
import { RegistrationProfileFields } from '@/features/auth/ui/RegistrationProfileFields'
import { CredentialForm } from '@/features/auth/ui/CredentialForm'
import type { Credentials } from '@/features/auth/model/Credentials'
import type { RegistrationProfileDraft } from '@/features/auth/model/registrationTypes'
import type { City } from '@/shared/types'
import styles from './RegisterPage.module.css'
import lightBulbIllustration from './assets/light-bulb.svg'
import userInfoIllustration from './assets/user-info.svg'

const INITIAL_PROFILE: RegistrationProfileDraft = {
  name: '',
  birthDate: null,
  gender: '',
  city: '',
  avatarFile: null,
  learnCategories: [],
  learnSubcategories: [],
}

const AVATAR_SETTINGS = {
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxSizeBytes: 5 * 1024 * 1024,
}

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [profile, setProfile] = useState(INITIAL_PROFILE)
  const [cities, setCities] = useState<City[]>([])
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [citiesError, setCitiesError] = useState<string | null>(null)
  const [citiesRetry, setCitiesRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setCitiesLoading(true)
    setCitiesError(null)

    fetchCities(controller.signal)
      .then(setCities)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setCitiesError(error instanceof Error ? error.message : 'Не удалось загрузить города')
      })
      .finally(() => {
        if (!controller.signal.aborted) setCitiesLoading(false)
      })

    return () => controller.abort()
  }, [citiesRetry])

  const handleCredentialsSubmit = async (values: Credentials) => {
    setCredentials(values)
    setStep(2)
  }

  const sideContent = {
    1: {
      image: lightBulbIllustration,
      title: 'Добро пожаловать в\u00a0SkillSwap!',
      description:
        'Присоединяйтесь к\u00a0SkillSwap и\u00a0обменивайтесь знаниями и\u00a0навыками с\u00a0другими людьми',
    },
    2: {
      image: userInfoIllustration,
      title: 'Расскажите немного о себе',
      description: 'Это поможет другим людям лучше вас узнать, чтобы выбрать для обмена.',
    },
  }[step]

  return (
    <main className={styles.page}>
      <div className={styles.stepProgress}>
        <p className={styles.stepLabel}>Шаг {step} из 3</p>
        <div className={styles.progress} aria-label={`Шаг ${step} из 3`}>
          {[1, 2, 3].map((item) => (
            <span
              className={item <= step ? styles.progressActive : styles.progressStep}
              key={item}
            />
          ))}
        </div>
      </div>
      <div className={styles.layout}>
        <section className={styles.card} aria-label={`Регистрация, шаг ${step}`}>
          {step === 1 && (
            <CredentialForm
              mode="register"
              onSubmit={handleCredentialsSubmit}
              returnTo="/register"
            />
          )}

          {step === 2 &&
            (citiesLoading ? (
              <p role="status">Загружаем список городов...</p>
            ) : citiesError ? (
              <div className={styles.loadError} role="alert">
                <p>Не удалось загрузить список городов: {citiesError}</p>
                <button type="button" onClick={() => setCitiesRetry((retry) => retry + 1)}>
                  Повторить
                </button>
              </div>
            ) : (
              <RegistrationProfileFields
                value={profile}
                cities={cities}
                avatarSettings={AVATAR_SETTINGS}
                onChange={setProfile}
                onBack={() => setStep(1)}
                onContinue={setProfile}
              />
            ))}

          {step === 1 && credentials && (
            <p className={styles.savedEmail}>Email: {credentials.email}</p>
          )}
        </section>

        <aside className={styles.infoPanel} aria-label={sideContent.title}>
          <img className={styles.illustration} src={sideContent.image} alt="" />
          <div className={styles.infoCopy}>
            <h2>{sideContent.title}</h2>
            <p>{sideContent.description}</p>
          </div>
        </aside>
      </div>
    </main>
  )
}
