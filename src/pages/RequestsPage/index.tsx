import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { selectCatalogData } from '@/features/catalog/model/catalogSelectors'
import { getCatalogThunk } from '@/features/catalog/model/catalogSlice'
import { restoreLocalData } from '@/features/localData/model/localDataSlice'
import { restoreProfiles } from '@/features/profile/model/profileSlice'
import {
  acceptRequest,
  rejectRequest,
  completeRequest,
} from '@/features/requests/model/requestThunks'
import { restoreRequests } from '@/features/requests/model/requestsSlice'
import { ROUTES } from '@/shared/lib/constants'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { PageLayout } from '@/widgets/PageLayout'
import { RequestsList } from '@/widgets/RequestsList'
import styles from './RequestsPage.module.css'

export default function RequestsPage() {
  const dispatch = useAppDispatch()
  const userId = useAppSelector((state) => state.auth.user?.id)
  const { users, skills, mergeError } = useAppSelector(selectCatalogData)
  const { status, error: catalogError } = useAppSelector((state) => state.catalog)
  const localError = useAppSelector((state) => state.localData.readError)
  const profileError = useAppSelector((state) => state.profile.readError)
  const { snapshot, readError, operations } = useAppSelector((state) => state.requests)
  const [restoredFor, setRestoredFor] = useState<string>()

  useEffect(() => {
    if (status === 'idle') dispatch(getCatalogThunk())
  }, [dispatch, status])

  useEffect(() => {
    let active = true
    dispatch(restoreLocalData())
    dispatch(restoreProfiles())
    void dispatch(restoreRequests()).then(() => {
      if (active) setRestoredFor(userId)
    })
    return () => {
      active = false
    }
  }, [dispatch, userId])

  if (!userId) return null

  const requests = snapshot.requests.filter(
    (request) => request.fromUserId === userId || request.toUserId === userId,
  )
  const userOperations = Object.entries(operations).filter(
    ([, operation]) => operation?.userId === userId,
  )
  const actionErrors = Object.fromEntries(
    userOperations.flatMap(([id, operation]) => (operation?.error ? [[id, operation.error]] : [])),
  )
  const loadingActionId = userOperations.find(
    ([, operation]) => operation?.status === 'pending',
  )?.[0]
  const issues = [
    status === 'error' && `Не удалось загрузить каталог: ${catalogError}`,
    localError && `Не удалось прочитать локальные данные: ${localError}`,
    profileError && `Не удалось прочитать профили: ${profileError}`,
    mergeError && `Не удалось объединить каталог: ${mergeError}`,
  ].filter(Boolean)
  const error = issues.length ? issues.join(' ') : null
  const retry = () => {
    if (status === 'error' || mergeError) dispatch(getCatalogThunk())
    dispatch(restoreLocalData())
    dispatch(restoreProfiles())
    void dispatch(restoreRequests())
  }

  return (
    <PageLayout mainClassName={styles.main}>
      <Link className={styles.profileLink} to={ROUTES.PROFILE}>
        Личный кабинет
      </Link>
      <section className={styles.content} aria-labelledby="requests-title">
        <h1 id="requests-title">Заявки</h1>
        {readError && requests.length > 0 && (
          <div className={styles.error} role="alert">
            <p>Не удалось прочитать заявки. Показаны последние загруженные данные.</p>
            <button type="button" onClick={() => void dispatch(restoreRequests())}>
              Повторить загрузку заявок
            </button>
          </div>
        )}
        <RequestsList
          key={userId}
          currentUserId={userId}
          requests={requests}
          allUsers={users}
          allSkills={skills}
          isLoading={restoredFor !== userId || status === 'idle' || status === 'loading'}
          error={error ?? (readError && !requests.length ? 'Не удалось прочитать заявки.' : null)}
          onRetry={retry}
          onAccept={(id) => dispatch(acceptRequest(id))}
          onReject={(id) => dispatch(rejectRequest(id))}
          onComplete={(id) => dispatch(completeRequest(id))}
          loadingActionId={loadingActionId}
          actionErrors={actionErrors}
        />
      </section>
    </PageLayout>
  )
}
