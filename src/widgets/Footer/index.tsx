import styles from './Footer.module.css'
import { APP_TITLE } from '@/shared/lib/appTitle'
import { Logo } from '@/shared/ui/Logo'
import { AllSkillsMenu } from '@/widgets/AllSkillsMenu'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/shared/lib/constants'

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.brand}>
        <Link to={ROUTES.HOME}>
          <Logo />
        </Link>
        <div className={styles.copyright}>{APP_TITLE} — 2025</div>
      </div>
      <div className={styles.column}>
        <Link to={ROUTES.ABOUT}>О проекте</Link>
        <AllSkillsMenu placement="top" />
      </div>
      <div className={styles.column}>
        <span>Контакты</span>
        <span>Блог</span>
      </div>
      <div className={styles.column}>
        <span>Политика конфиденциальности</span>
        <span>Пользовательское соглашение</span>
      </div>
    </footer>
  )
}
