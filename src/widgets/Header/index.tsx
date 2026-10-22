import { useEffect, useRef } from 'react'
import { shallowEqual } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/shared/lib/constants'
import styles from './Header.module.css'
import { APP_TITLE } from '@/shared/lib/appTitle'
import { SearchInput } from '@/shared/ui/SearchInput'
import { AllSkillsMenu } from '@/widgets/AllSkillsMenu'
import { NotificationMenu } from '@/widgets/NotificationMenu'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectAuthError, selectAuthUser } from '@/features/auth/model/authSlice'
import { logout } from '@/features/auth/model/authThunks'
import { selectCurrentProfile } from '@/features/profile/model/profileSlice'
import { getCatalogThunk } from '@/features/catalog/model/catalogSlice'

export type HeaderProps = {
  variant?: 'default' | 'auth'
  searchValue?: string
  onSearchChange?: (value: string) => void
}
export const Header = ({ variant = 'default', searchValue, onSearchChange }: HeaderProps) => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector(selectAuthUser)
  const profile = useAppSelector(selectCurrentProfile, shallowEqual)
  const error = useAppSelector(selectAuthError)
  const status = useAppSelector((state) => state.catalog.status)
  const menuRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    if (variant === 'default' && status === 'idle') dispatch(getCatalogThunk())
  }, [dispatch, status, variant])

  useEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    const closeOutside = (event: PointerEvent) => {
      if (!menu.contains(event.target as Node)) menu.open = false
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !menu.open) return
      menu.open = false
      menu.querySelector('summary')?.focus()
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [user?.id, variant])

  return (
    <header className={styles.header}>
      <Link className={styles.logo} to={ROUTES.HOME}>
        {APP_TITLE}
      </Link>
      {variant === 'auth' ? (
        <Link to={ROUTES.HOME}>Закрыть ×</Link>
      ) : (
        <>
          <Link to={ROUTES.ABOUT}>О проекте</Link>
          <AllSkillsMenu />
          {searchValue !== undefined && onSearchChange && (
            <div className={styles.search}>
              <SearchInput value={searchValue} onChange={onSearchChange} />
            </div>
          )}
          <nav className={styles.nav} aria-label="Основная навигация">
            <Link to={ROUTES.FAVORITES}>Избранное</Link>
            {user && <NotificationMenu />}
            {user ? (
              <details className={styles.profile} ref={menuRef} key={user.id}>
                <summary className={styles.trigger}>
                  <span className={styles.name}>{profile?.name ?? user.name}</span>
                  <span className={styles.avatar} aria-hidden="true">
                    {(profile?.name ?? user.name).charAt(0)}
                    {profile?.avatarUrl && (
                      <img
                        key={profile.avatarUrl}
                        src={profile.avatarUrl}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.hidden = true
                        }}
                      />
                    )}
                  </span>
                </summary>
                <div className={styles.menu}>
                  <Link
                    to={ROUTES.PROFILE}
                    onClick={() => {
                      if (menuRef.current) menuRef.current.open = false
                    }}
                  >
                    Личный кабинет
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (dispatch(logout())) navigate(ROUTES.HOME, { replace: true })
                    }}
                  >
                    Выйти
                  </button>
                </div>
              </details>
            ) : (
              <>
                <Link to={ROUTES.LOGIN}>Войти</Link>
                <Link to={ROUTES.REGISTER}>Зарегистрироваться</Link>
              </>
            )}
          </nav>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </header>
  )
}
