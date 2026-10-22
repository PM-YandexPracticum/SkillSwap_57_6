import { PageLayout } from '@/widgets/PageLayout'
import { APP_TITLE } from '@/shared/lib/appTitle'
import team from './team.json'
import styles from '../InfoPages.module.css'

export default function AboutPage() {
  return (
    <PageLayout mainClassName={styles.main}>
      <h1>О проекте</h1>
      <p>
        {APP_TITLE} — платформа для обмена навыками. Делитесь тем, что умеете, находите людей с
        интересными вам навыками и предлагайте обмен.
      </p>
      <section aria-labelledby="team-title">
        <h2 id="team-title">Команда разработчиков {APP_TITLE}</h2>
        <ul className={styles.team}>
          {team.map(({ name, github, role }) => (
            <li className={styles.member} key={github}>
              <h3>{name}</h3>
              <p>{role}</p>
              <a
                href={`https://github.com/${github}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${name} — GitHub ${github}`}
              >
                GitHub: {github}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </PageLayout>
  )
}
