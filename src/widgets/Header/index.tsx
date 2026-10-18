import { Link } from 'react-router-dom'
import { ROUTES } from '@/shared/lib/constants'
import styles from './Header.module.css'
import { APP_TITLE } from '@/shared/lib/appTitle'
import { SearchInput } from '@/shared/ui/SearchInput'

type HeaderProps = {
  searchValue: string
  onSearchChange: (value: string) => void
}
export const Header = ({ searchValue, onSearchChange }: HeaderProps) => {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>{APP_TITLE}</div>
      <div className={styles.search}>
        <SearchInput value={searchValue} onChange={onSearchChange} />
      </div>
      <nav className={styles.nav}>
        <Link to={ROUTES.LOGIN}>Войти</Link>
        <Link to={ROUTES.REGISTER}>Зарегистрироваться</Link>
      </nav>
    </header>
  )
}
