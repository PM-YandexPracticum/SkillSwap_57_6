// TODO: реализовать страницу SkillPage
import { useEffect, useState } from 'react'
import { PageLayout } from '../../widgets/PageLayout'
import styles from './SkillPage.module.css'
import { SkillDescription } from '@/entities/skill/ui/SkillDescription'
import { useParams } from 'react-router-dom'
import { fetchSkillById } from '@/api/skills'
import { CatalogItem, Skill, User } from '@/shared/types'
import { fetchUserById } from '@/api/users'
import SkillGallery from '@/entities/skill/ui/SkillGallery'
import { UserCardsGrid } from '@/widgets/UserCardsGrid'
import { FavoriteToggle } from '@/features/favorites/ui/FavoriteToggle'
import { useAppSelector } from '@/store/hooks'
import { selectCatalogItems } from '@/features/catalog/model/catalogSelectors'

export default function SkillPage() {
  const { id } = useParams<{ id: string }>()
  const [searchValue, setSearchValue] = useState('')
  const [skill, setSkill] = useState<Skill>()
  const [author, setAuthor] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const catalogItems = useAppSelector(selectCatalogItems)
  /*Рекомендованным карточки с аналогичным навыком который можно изучить */
  const recommendedItems = catalogItems
    .filter((item) =>
      item.skills.some(
        (itemSkill) => itemSkill.category === skill?.category && itemSkill.type === 'teach',
      ),
    )
    .slice(0, 4)

  /*Нажатая карточка */
  const skillItem = catalogItems
    .filter((item) => item.skills.some((itemSkill) => itemSkill.id === skill?.id))
    .slice(0, 1)

  const renderFavoriteAction = ({ skills }: CatalogItem) => {
    const target =
      skills.find((skill) => skill.type === 'teach') ??
      skills.find((skill) => skill.type === 'learn')
    return target ? <FavoriteToggle skillId={target.id} /> : null
  }

  const handleExchange = () => {
    console.log('Предложить обмен')
  }

  useEffect(() => {
    if (!id) return

    setIsLoading(true)
    setError(null)

    fetchSkillById(id)
      .then(async (data) => {
        if (!data) {
          setError('Навык не найден.')
          return
        }
        setSkill(data)

        const user = await fetchUserById(data.authorId)
        if (!user) {
          setError('Автор навыка не найден.')
          return
        }
        setAuthor(user)
      })
      .catch(() => {
        setError('Не удалось загрузить данные.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [id])

  return (
    <PageLayout
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      mainClassName={styles.main}
    >
      {isLoading && <p>Загрузка…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!isLoading && !error && (
        <>
          <div className={styles.layout}>
            {author && <UserCardsGrid items={skillItem} renderAction={renderFavoriteAction} />}
            <div className={styles.skill}>
              {skill && (
                <SkillDescription
                  title={skill.title}
                  category={skill.category}
                  tags={skill.tags}
                  description={skill.description}
                  onExchange={handleExchange}
                />
              )}
              <SkillGallery images={[]} />
            </div>
          </div>
          <h2>Похожие предложения</h2>
          <UserCardsGrid items={recommendedItems} renderAction={renderFavoriteAction} />
        </>
      )}
    </PageLayout>
  )
}
