import type { ReactNode } from 'react'
import { Header, type HeaderProps } from '@/widgets/Header'
import { Footer } from '@/widgets/Footer'
import styles from './PageLayout.module.css'

type PageLayoutProps = HeaderProps & {
  children: ReactNode
  mainClassName?: string
}

export const PageLayout = ({ children, mainClassName, ...headerProps }: PageLayoutProps) => (
  <div className={styles.page}>
    <Header {...headerProps} />
    <main className={`${styles.main} ${mainClassName ?? ''}`}>{children}</main>
    {headerProps.variant !== 'auth' && <Footer />}
  </div>
)
