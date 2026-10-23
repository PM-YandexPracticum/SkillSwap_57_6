// TODO: реализовать страницу ProfilePage
import { Link } from 'react-router-dom'
import { ROUTES } from '@/shared/lib/constants'

export default function ProfilePage() {
  return (
    <main>
      <h1>ProfilePage</h1>
      <Link to={ROUTES.FAVORITES}>Избранное</Link>
      <p>Страница в разработке</p>
    </main>
  )
}
