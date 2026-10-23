import { Link } from 'react-router-dom'
import { PageLayout } from '@/widgets/PageLayout'
import { ROUTES } from '@/shared/lib/constants'
import illustration from '@/shared/assets/illustrations/error-404.svg'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  return (
    <PageLayout mainClassName={styles.main}>
      <section className={styles.content} aria-labelledby="not-found-title">
        <img className={styles.illustration} src={illustration} alt="Ошибка 404" />
        <h1 className={styles.title} id="not-found-title">
          Страница не найдена
        </h1>
        <p className={styles.description}>
          К сожалению, эта страница недоступна. Вернитесь
          <br className={styles.desktopBreak} /> на главную страницу или попробуйте позже
        </p>
        <div className={styles.actions}>
          <button className={styles.reportButton} type="button" disabled>
            Сообщить об ошибке
          </button>
          <Link className={styles.homeButton} to={ROUTES.HOME}>
            На главную
          </Link>
        </div>
      </section>
    </PageLayout>
  )
}
