// TODO: реализовать страницу CatalogPage
import { useState } from 'react'
import FiltersBar from '@/widgets/FiltersBar'
import type { SkillTypeFilter, SkillCategoryFilter } from '@/widgets/FiltersBar'
import { Header } from '../../widgets/Header'
import { Footer } from '../../widgets/Footer'
import styles from './CatalogPage.module.css'

//export default function CatalogPage() {
const CatalogPage = () => {
  const [selectedType, setSelectedType] = useState<SkillTypeFilter>('all')
  const [selectedCategory, setSelectedCategory] = useState<SkillCategoryFilter>('all')

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <aside className={styles.filters}>
          <h2>Фильтры</h2>
          <FiltersBar
            selectedType={selectedType}
            selectedCategory={selectedCategory}
            onTypeChange={setSelectedType}
            onCategoryChange={setSelectedCategory}
          />
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
