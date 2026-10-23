import { useEffect, useState } from 'react'
import { fetchCities } from '@/api/cities'
import { RegistrationForm } from '@/features/auth/ui/RegistrationForm'
import { registerFullAccount } from '@/features/auth/model/registration'
import { RegistrationSuccessDialog } from '@/features/auth/ui/RegistrationSuccessDialog'
import { useAppDispatch } from '@/store/hooks'
import { getSafeReturnTo } from '@/features/auth/lib/getSafeReturnTo'
import type { City } from '@/shared/types'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/shared/lib/constants'
import { PageLayout } from '@/widgets/PageLayout'
import styles from './RegisterPage.module.css'
import lightBulbIllustration from './assets/light-bulb.svg'
import userInfoIllustration from './assets/user-info.svg'
import presentationBoardIllustration from './assets/presentation-board.svg'

const AVATAR_SETTINGS = {
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxSizeBytes: 5 * 1024 * 1024,
}

export default function RegisterPage() {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const returnTo = getSafeReturnTo(location.state?.returnTo)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [registrationComplete, setRegistrationComplete] = useState(false)
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

  const handleRegistrationSubmit = async (
    credentials: Parameters<typeof registerFullAccount>[0],
    profileDraft: Parameters<typeof registerFullAccount>[1],
    skillDraft: Parameters<typeof registerFullAccount>[2],
  ) => {
    await dispatch(
      registerFullAccount(credentials, profileDraft, skillDraft, cities, AVATAR_SETTINGS),
    )
    setRegistrationComplete(true)
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
    3: {
      image: presentationBoardIllustration,
      title: 'Укажите, чем вы готовы поделиться',
      description: 'Так другие люди смогут увидеть ваши предложения и предложить вам обмен!',
    },
  }[step]

  return (
    <PageLayout variant="auth">
      <div className={styles.page}>
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
            <RegistrationForm
              cities={cities}
              avatarSettings={AVATAR_SETTINGS}
              onSubmit={handleRegistrationSubmit}
              returnTo={returnTo}
              onStepChange={setStep}
              citiesLoading={citiesLoading}
              citiesError={citiesError}
              onRetryCities={() => setCitiesRetry((retry) => retry + 1)}
            />
          </section>

          <aside className={styles.infoPanel} aria-label={sideContent.title}>
            <img className={styles.illustration} src={sideContent.image} alt="" />
            <div className={styles.infoCopy}>
              <h2>{sideContent.title}</h2>
              <p>{sideContent.description}</p>
            </div>
          </aside>
        </div>
      </div>
      {registrationComplete && (
        <RegistrationSuccessDialog
          onClose={() => navigate(ROUTES.LOGIN, { state: { returnTo } })}
        />
      )}
    </PageLayout>
  )
}
