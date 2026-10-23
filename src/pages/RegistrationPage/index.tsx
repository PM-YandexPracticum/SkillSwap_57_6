import { useEffect, useRef, useState } from 'react'
import { fetchCities } from '@/api/cities'
import { RegistrationForm } from '@/features/auth/ui/RegistrationForm'
import { registerFullAccount, type RegisteredAccount } from '@/features/auth/model/registration'
import { selectAuthError, selectAuthUser } from '@/features/auth/model/authSlice'
import { startSession } from '@/features/auth/model/authThunks'
import { getCatalogThunk } from '@/features/catalog/model/catalogSlice'
import { restoreLocalData } from '@/features/localData/model/localDataSlice'
import { restoreProfiles } from '@/features/profile/model/profileSlice'
import { RegistrationSuccessDialog } from '@/features/auth/ui/RegistrationSuccessDialog'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getSafeReturnTo } from '@/features/auth/lib/getSafeReturnTo'
import type { City } from '@/shared/types'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/shared/lib/constants'
import { PageLayout } from '@/widgets/PageLayout'
import styles from './RegistrationPage.module.css'
import lightBulbIllustration from './assets/light-bulb.svg'
import userInfoIllustration from './assets/user-info.svg'
import presentationBoardIllustration from './assets/presentation-board.svg'

const AVATAR_SETTINGS = {
  acceptedTypes: ['image/jpeg', 'image/png'],
}

export default function RegistrationPage() {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const returnTo = getSafeReturnTo(location.state?.returnTo)
  const user = useAppSelector(selectAuthUser)
  const authError = useAppSelector(selectAuthError)
  const { status: catalogStatus, error: catalogError } = useAppSelector((state) => state.catalog)
  const localDataError = useAppSelector((state) => state.localData.readError)
  const profileError = useAppSelector((state) => state.profile.readError)
  const [registeredAccount, setRegisteredAccount] = useState<RegisteredAccount | null>(null)
  const savedAccountRef = useRef<RegisteredAccount | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [cities, setCities] = useState<City[]>([])
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [citiesError, setCitiesError] = useState<string | null>(null)
  const [citiesRetry, setCitiesRetry] = useState(0)

  useEffect(() => {
    if (catalogStatus === 'idle') void dispatch(getCatalogThunk())
  }, [dispatch, catalogStatus])

  useEffect(() => {
    dispatch(restoreLocalData())
    dispatch(restoreProfiles())
  }, [dispatch])

  useEffect(() => {
    if (user && !savedAccountRef.current) navigate(ROUTES.HOME, { replace: true })
  }, [user, navigate])

  useEffect(() => {
    const controller = new AbortController()
    setCitiesLoading(true)
    setCitiesError(null)

    fetchCities(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setCities(value)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setCitiesError(error instanceof Error ? error.message : 'Не удалось загрузить города')
      })
      .finally(() => {
        if (!controller.signal.aborted) setCitiesLoading(false)
      })

    return () => controller.abort()
  }, [citiesRetry])

  const isReady =
    catalogStatus === 'success' &&
    !localDataError &&
    !profileError &&
    !citiesLoading &&
    !citiesError
  const beginSession = (account: RegisteredAccount) => {
    if (dispatch(startSession(account))) setRegistrationComplete(true)
  }

  const handleRegistrationSubmit = async (
    credentials: Parameters<typeof registerFullAccount>[0],
    profileDraft: Parameters<typeof registerFullAccount>[1],
    skillDraft: Parameters<typeof registerFullAccount>[2],
  ): Promise<void> => {
    if (savedAccountRef.current) return
    if (!isReady) throw new Error('Дождитесь загрузки данных и повторите попытку.')
    const account = await dispatch(
      registerFullAccount(credentials, profileDraft, skillDraft, cities, AVATAR_SETTINGS),
    )
    savedAccountRef.current = account
    setRegisteredAccount(account)
    beginSession(account)
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

  const feedback = (
    <div className={styles.feedback}>
      {(catalogStatus === 'loading' || citiesLoading) && <p role="status">Загружаем данные...</p>}
      {[
        { error: catalogError, label: 'каталога', retry: () => dispatch(getCatalogThunk()) },
        {
          error: localDataError,
          label: 'локальных данных',
          retry: () => dispatch(restoreLocalData()),
        },
        { error: profileError, label: 'профилей', retry: () => dispatch(restoreProfiles()) },
        { error: citiesError, label: 'городов', retry: () => setCitiesRetry((retry) => retry + 1) },
      ].map(
        ({ error, label, retry }) =>
          error && (
            <div role="alert" key={label}>
              <p>{error}</p>
              <button type="button" onClick={retry}>
                Повторить загрузку {label}
              </button>
            </div>
          ),
      )}
    </div>
  )

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
              disabled={!isReady || registeredAccount !== null}
              returnTo={returnTo}
              onStepChange={setStep}
              feedback={feedback}
            />
            {registeredAccount && !registrationComplete && (
              <div className={styles.feedback} role="alert">
                <p>Аккаунт сохранён. {authError}</p>
                <button type="button" onClick={() => beginSession(registeredAccount)}>
                  Повторить вход
                </button>
              </div>
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
      </div>
      {registrationComplete && (
        <RegistrationSuccessDialog onClose={() => navigate(returnTo, { replace: true })} />
      )}
    </PageLayout>
  )
}
