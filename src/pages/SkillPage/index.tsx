import { useEffect, useRef, useState } from 'react'
import { generatePath, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { SkillDescription } from '@/entities/skill/ui/SkillDescription'
import SkillGallery from '@/entities/skill/ui/SkillGallery'
import { getSkillImageUrls } from '@/entities/skill/model/getSkillImageUrls'
import { UserCard } from '@/entities/user/ui/UserCard'
import { selectCatalogData } from '@/features/catalog/model/catalogSelectors'
import { getCatalogThunk } from '@/features/catalog/model/catalogSlice'
import { FavoriteToggle } from '@/features/favorites/ui/FavoriteToggle'
import { restoreLocalData } from '@/features/localData/model/localDataSlice'
import { restoreProfiles } from '@/features/profile/model/profileSlice'
import { createRequest } from '@/features/requests/model/requestThunks'
import {
  restoreRequests,
  selectActiveRequestForSkill,
} from '@/features/requests/model/requestsSlice'
import { ROUTES } from '@/shared/lib/constants'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { CatalogState } from '@/widgets/CatalogState'
import { PageLayout } from '@/widgets/PageLayout'
import { UserCardsGrid } from '@/widgets/UserCardsGrid'
import styles from './SkillPage.module.css'

export default function SkillPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const userId = useAppSelector((state) => state.auth.user?.id)
  const { users, skills, mergeError } = useAppSelector(selectCatalogData)
  const { status, error: catalogError } = useAppSelector((state) => state.catalog)
  const localError = useAppSelector((state) => state.localData.readError)
  const profileError = useAppSelector((state) => state.profile.readError)
  const requestsError = useAppSelector((state) => state.requests.readError)
  const activeRequest = useAppSelector((state) => {
    if (!userId || !id) return undefined
    const request = selectActiveRequestForSkill(state, userId, id)
    return request?.fromUserId === userId ? request : undefined
  })
  const [searchValue, setSearchValue] = useState('')
  const [restoredFor, setRestoredFor] = useState<string | null>()
  const [isPending, setIsPending] = useState(false)
  const [exchangeError, setExchangeError] = useState<{ key: string; message: string } | null>(null)
  const submitting = useRef(false)
  const owner = userId ?? null
  const actionKey = `${owner}:${id}`

  useEffect(() => {
    if (status === 'idle') void dispatch(getCatalogThunk())
  }, [dispatch, status])

  useEffect(() => {
    let active = true
    dispatch(restoreLocalData())
    dispatch(restoreProfiles())
    void dispatch(restoreRequests()).then(() => {
      if (active) setRestoredFor(owner)
    })
    return () => {
      active = false
    }
  }, [dispatch, owner])

  const skill = skills.find((entry) => entry.id === id)
  const author = users.find((entry) => entry.id === skill?.authorId)
  const ownSkill = author?.id === userId
  const issues = [
    {
      error: status === 'error' && catalogError,
      label: 'каталога',
      retry: () => dispatch(getCatalogThunk()),
    },
    {
      error: localError || mergeError,
      label: 'локальных данных',
      retry: () => dispatch(restoreLocalData()),
    },
    { error: profileError, label: 'профилей', retry: () => dispatch(restoreProfiles()) },
  ].filter(({ error }) => error)

  const handleExchange = async () => {
    if (!skill || ownSkill || activeRequest || submitting.current || requestsError) return
    if (!userId) {
      navigate(ROUTES.LOGIN, {
        state: { returnTo: location.pathname + location.search + location.hash },
      })
      return
    }
    submitting.current = true
    setIsPending(true)
    setExchangeError(null)
    try {
      if (!(await dispatch(createRequest(skill.id)))) {
        setExchangeError({
          key: actionKey,
          message: 'Не удалось предложить обмен. Повторите попытку.',
        })
      }
    } finally {
      submitting.current = false
      setIsPending(false)
    }
  }

  let content
  if (status === 'idle' || status === 'loading' || restoredFor !== owner) {
    content = <CatalogState state="loading" />
  } else if (issues.length > 0) {
    content = issues.map(({ error, label, retry }) => (
      <CatalogState
        key={label}
        state="error"
        messages={{ error: `Ошибка ${label}: ${error}` }}
        retryLabel={`Повторить загрузку ${label}`}
        onRetry={retry}
      />
    ))
  } else if (!skill || !author) {
    content = <CatalogState state="empty" messages={{ empty: 'Навык или его автор не найден.' }} />
  } else if (skill.type === 'learn') {
    const teach = skills.find(
      (entry) => entry.authorId === skill.authorId && entry.type === 'teach',
    )
    content = teach ? (
      <Navigate
        to={generatePath(ROUTES.SKILL, { id: teach.id }) + location.search + location.hash}
        replace
      />
    ) : (
      <CatalogState state="empty" messages={{ empty: 'Предложение автора не найдено.' }} />
    )
  } else {
    const recommendedItems = skills
      .filter(
        (entry) =>
          entry.type === 'teach' &&
          entry.id !== skill.id &&
          entry.authorId !== author.id &&
          entry.authorId !== userId &&
          entry.category === skill.category &&
          entry.tags.some((tag) => skill.tags.includes(tag)),
      )
      .flatMap((entry) => {
        const user = users.find((candidate) => candidate.id === entry.authorId)
        return user ? [{ user, skills: [entry] }] : []
      })
      .slice(0, 4)
    content = (
      <>
        <div className={styles.layout}>
          <div className={styles.author}>
            <UserCard
              user={author}
              skills={skills.filter((entry) => entry.authorId === author.id)}
              action={<FavoriteToggle skillId={skill.id} />}
            />
            {author.description && <p className={styles.about}>{author.description}</p>}
          </div>
          <div className={styles.skill}>
            <div>
              <SkillDescription
                title={skill.title}
                category={skill.category}
                tags={skill.tags}
                description={skill.description}
                onExchange={handleExchange}
                disabled={ownSkill || !!activeRequest || !!requestsError}
                isPending={isPending}
                exchangeLabel={activeRequest ? 'Обмен предложен' : undefined}
              />
              {exchangeError?.key === actionKey && <p role="alert">{exchangeError.message}</p>}
              {requestsError && (
                <div role="alert">
                  <p>Не удалось прочитать заявки. Повторите загрузку перед обменом.</p>
                  <button type="button" onClick={() => void dispatch(restoreRequests())}>
                    Повторить загрузку заявок
                  </button>
                </div>
              )}
            </div>
            <SkillGallery
              key={skill.id}
              images={getSkillImageUrls(skill).map((src) => ({ src, alt: skill.title }))}
            />
          </div>
        </div>
        {recommendedItems.length > 0 && (
          <section aria-labelledby="similar-skills-title">
            <h2 id="similar-skills-title">Похожие предложения</h2>
            <UserCardsGrid
              items={recommendedItems}
              hideEmptyGroups
              getItemKey={({ skills }) => skills[0].id}
              renderAction={({ skills }) => <FavoriteToggle skillId={skills[0].id} />}
            />
          </section>
        )}
      </>
    )
  }
  return (
    <PageLayout
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      mainClassName={styles.main}
    >
      {content}
    </PageLayout>
  )
}
