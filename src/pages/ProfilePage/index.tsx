// TODO: реализовать страницу ProfilePage
import { useEffect, useState } from 'react'
import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { PageLayout } from '@/widgets/PageLayout'
import { ProfileForm, type ProfileDraft } from '@/features/profile/ui/ProfileForm'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  saveProfileChanges,
  selectCurrentProfile,
  selectProfileWriteError,
} from '@/features/profile/model/profileSlice'
import { fetchCities } from '@/api/cities'
import type { City } from '@/shared/types'
import { ROUTES } from '@/shared/lib/constants'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentProfile)
  const authUser = useAppSelector((state) => state.auth.user)
  const writeError = useAppSelector(selectProfileWriteError)

  const [cities, setCities] = useState<City[]>([])
  const [isLoadingCities, setIsLoadingCities] = useState(true)
  const [citiesError, setCitiesError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    fetchCities()
      .then((data) => {
        if (isMounted) setCities(data)
      })
      .catch(() => {
        if (isMounted) setCitiesError('Не удалось загрузить список городов')
      })
      .finally(() => {
        if (isMounted) setIsLoadingCities(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  if (!authUser) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (!user) {
    return (
      <PageLayout>
        <div className={styles.loader}>Загрузка профиля...</div>
      </PageLayout>
    )
  }

  const handleSave = async (draft: ProfileDraft) => {
    let newAvatarUrl: string | undefined = undefined
    if (draft.avatarFile) {
      const reader = new FileReader()
      newAvatarUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(draft.avatarFile!)
      })
    }

    const patch = {
      name: draft.name,
      email: draft.email,
      birthDate: draft.birthDate ? draft.birthDate.toISOString() : undefined,
      city: draft.city,
      description: draft.about,
      avatarUrl: newAvatarUrl ?? user.avatarUrl ?? undefined,
    }

    await dispatch(saveProfileChanges(user.id, patch, draft.password))
  }

  return (
    <PageLayout>
      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            {/* Заглушки для будущих страниц (по AC #125) */}
            <span className={styles.navLinkDisabled}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H5C4.46957 17 3.96086 16.7893 3.58579 16.4142C3.21071 16.0391 3 15.5304 3 15V6C3 5.46957 3.21071 4.96086 3.58579 4.58579C3.96086 4.21071 4.46957 4 5 4H9L11 7H19C19.5304 7 20.0391 7.21071 20.4142 7.58579C20.7893 7.96086 21 8.46957 21 9V15Z"
                  stroke="#253017"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 11V15M10 13H14"
                  stroke="#253017"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Заявки
            </span>
            <span className={styles.navLinkDisabled}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
                  stroke="#253017"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Мои обмены
            </span>

            {/* Рабочие ссылки */}
            <NavLink
              to={ROUTES.FAVORITES}
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39465C21.7563 5.72718 21.351 5.12082 20.84 4.61Z"
                  stroke="#253017"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Избранное
            </NavLink>

            <span className={styles.navLinkDisabled}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="#253017"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="#253017"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="#253017"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Мои навыки
            </span>

            <NavLink
              to={ROUTES.PROFILE}
              end
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                  stroke="#253017"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                  stroke="#253017"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Личные данные
            </NavLink>
          </nav>
        </aside>

        <main className={styles.content}>
          <Routes>
            <Route
              index
              element={
                <>
                  {isLoadingCities ? (
                    <div className={styles.loader}>Загрузка городов...</div>
                  ) : citiesError ? (
                    <div className={styles.error}>{citiesError}</div>
                  ) : (
                    <ProfileForm
                      initialValues={user}
                      cities={cities}
                      onSubmit={handleSave}
                      externalError={writeError ?? undefined}
                    />
                  )}
                </>
              }
            />
            <Route path="favorites" element={<Navigate to={ROUTES.FAVORITES} replace />} />
          </Routes>
        </main>
      </div>
    </PageLayout>
  )
}
