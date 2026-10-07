// TODO: реализовать страницу CatalogPage
import { Header } from '../../widgets/Header'
import { Footer } from '../../widgets/Footer'
import styles from './CatalogPage.module.css'
import { useState } from 'react'

const CatalogPage = () => {
  const [searchValue, setSearchValue] = useState('')
  return (
    <div className={styles.page}>
      <Header searchValue={searchValue} onSearchChange={setSearchValue} />
      <main className={styles.main}>
        <aside className={styles.filters}>
          <h2>Фильтры</h2>
        </aside>
        <section className={styles.results}>
          <h2>Результаты</h2>
        </section>
      </main>
      <Footer />
    </div>
  )
}
export default CatalogPage
