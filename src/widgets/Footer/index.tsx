import styles from './Footer.module.css'
import { APP_TITLE } from '@/shared/lib/appTitle'

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.brand}>
        <div className={styles.logo}>{APP_TITLE}</div>
        <div className={styles.copyright}>{APP_TITLE} - 2025</div>
      </div>
      <div className={styles.column}>
        <span>О проекте</span>
        <span>Все навыки</span>
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
