import { APP_TITLE } from '@/shared/lib/appTitle'
import logo from '@/shared/assets/logo.svg'
import styles from './Logo.module.css'

export const Logo = () => (
  <span className={styles.logo}>
    <img src={logo} alt="" width={40} height={40} />
    <span>{APP_TITLE}</span>
  </span>
)
