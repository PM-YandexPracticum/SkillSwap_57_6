import { useId, useState } from 'react'
import { selectCatalogData } from '@/features/catalog/model/catalogSelectors'
import { selectIsFavorite } from '@/features/favorites/model/favoritesSlice'
import { addFavoriteThunk, removeFavoriteThunk } from '@/features/favorites/model/favoritesThunks'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import type { RootState } from '@/store'
import styles from './FavoriteToggle.module.css'

const selectSkillLikesCount = (state: RootState, skillId: string): number | null => {
  const { users, skills } = selectCatalogData(state)
  const authorId = skills.find((skill) => skill.id === skillId)?.authorId
  return users.find((user) => user.id === authorId)?.likesCount ?? null
}

interface FavoriteToggleProps {
  skillId: string
}

export function FavoriteToggle({ skillId }: FavoriteToggleProps) {
  const dispatch = useAppDispatch()
  const isFavorite = useAppSelector(selectIsFavorite(skillId))
  const likesCount = useAppSelector((state) => selectSkillLikesCount(state, skillId))
  const [error, setError] = useState<string | null>(null)
  const errorId = useId()

  const handleClick = () => {
    const saved = dispatch(isFavorite ? removeFavoriteThunk(skillId) : addFavoriteThunk(skillId))
    setError(saved ? null : 'Не удалось обновить избранное')
  }

  return (
    <div className={styles.root}>
      <button
        className={styles.button}
        type="button"
        aria-label="В избранное"
        aria-pressed={isFavorite}
        aria-describedby={error ? errorId : undefined}
        onClick={handleClick}
      >
        <span className={styles.icon} aria-hidden="true" />
      </button>
      {likesCount !== null && <span className={styles.count}>{likesCount}</span>}
      {error && (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
