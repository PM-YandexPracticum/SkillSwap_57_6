import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/lib/constants';
import styles from './Header.module.css';
import { APP_TITLE } from '@/shared/lib/appTitle';

export const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>{APP_TITLE}</div>
      <div className={styles.search}>Искать навык</div>
      <nav className={styles.nav}>
        <Link to={ROUTES.LOGIN}>Войти</Link>
        <Link to={ROUTES.REGISTER}>Зарегистрироваться</Link>
      </nav>
    </header>
  );
}
