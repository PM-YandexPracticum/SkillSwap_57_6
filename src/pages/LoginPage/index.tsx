import styles from './LoginPage.module.css'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import googleIcon from './svg/Google.svg'
import appleIcon from './svg/apple.svg'
import lightBulb from './svg/light-bulb.svg'
import { PageLayout } from '@/widgets/PageLayout'
import { CredentialForm } from '@/features/auth/ui/CredentialForm'
import type { Credentials } from '@/features/auth/model/Credentials'
import { authenticate } from '@/features/auth/model/authenticate'
import { startSession } from '@/features/auth/model/authThunks'
import { getSafeReturnTo } from '@/features/auth/lib/getSafeReturnTo'
import { selectAuthUser } from '@/features/auth/model/authSlice'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getCatalogThunk } from '@/features/catalog/model/catalogSlice'
import {
  restoreLocalData,
  selectLocalDataReadError,
} from '@/features/localData/model/localDataSlice'
import { restoreProfiles, selectProfileReadError } from '@/features/profile/model/profileSlice'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const user = useAppSelector(selectAuthUser)
  const catalogStatus = useAppSelector((state) => state.catalog.status)
  const catalogError = useAppSelector((state) => state.catalog.error)
  const localDataError = useAppSelector(selectLocalDataReadError)
  const profileError = useAppSelector(selectProfileReadError)

  const [loginError, setLoginError] = useState<string | null>(null)

  const returnTo = getSafeReturnTo(location.state?.returnTo)

  useEffect(() => {
    if (catalogStatus === 'idle') {
      void dispatch(getCatalogThunk())
    }

    dispatch(restoreLocalData())
    dispatch(restoreProfiles())
  }, [dispatch])

  useEffect(() => {
    if (user) {
      navigate(returnTo, { replace: true })
    }
  }, [user, returnTo, navigate])

  const isReady = catalogStatus === 'success' && !localDataError && !profileError

  const handleSubmit = async (credentials: Credentials): Promise<void> => {
    if (!isReady) return

    setLoginError(null)

    try {
      const authenticatedUser = await authenticate(credentials)
      const success = dispatch(startSession(authenticatedUser))

      if (!success) {
        setLoginError('Не удалось сохранить сессию')
        return
      }

      navigate(returnTo, { replace: true })
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Не удалось выполнить вход')
    }
  }

  return (
    <PageLayout variant="auth">
      <section className={styles.container}>
        <h1 className={styles.title}>Вход</h1>

        <div className={styles.columns}>
          <div className={styles.card}>
            <div className={styles.socialButtons}>
              <button type="button" className={styles.socialButton} disabled>
                <img src={googleIcon} alt="" />
                Продолжить с Google
              </button>

              <button type="button" className={styles.socialButton} disabled>
                <img src={appleIcon} alt="" />
                Продолжить с Apple
              </button>
            </div>

            <div className={styles.divider}>
              <span>или</span>
            </div>

            <CredentialForm
              mode="login"
              onSubmit={handleSubmit}
              disabled={!isReady}
              externalError={loginError}
              returnTo={returnTo}
            />

            {catalogStatus === 'loading' && <p>Загружаем каталог...</p>}

            {catalogStatus === 'error' && (
              <div role="alert">
                <p>{catalogError ?? 'Не удалось загрузить каталог'}</p>
                <button type="button" onClick={() => void dispatch(getCatalogThunk())}>
                  Повторить загрузку каталога
                </button>
              </div>
            )}

            {localDataError && (
              <div role="alert">
                <p>{localDataError}</p>
                <button type="button" onClick={() => dispatch(restoreLocalData())}>
                  Повторить загрузку локальных данных
                </button>
              </div>
            )}

            {profileError && (
              <div role="alert">
                <p>{profileError}</p>
                <button type="button" onClick={() => dispatch(restoreProfiles())}>
                  Повторить загрузку профилей
                </button>
              </div>
            )}
          </div>

          <div className={styles.illustrationCard}>
            <img src={lightBulb} alt="Лампочка SkillSwap" className={styles.illustration} />

            <h2 className={styles.welcomeTitle}>С возвращением в SkillSwap!</h2>

            <p className={styles.welcomeText}>Обменивайтесь знаниями и навыками с другими людьми</p>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
