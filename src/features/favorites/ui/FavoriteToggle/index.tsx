import { useId, useState } from 'react'
import { selectCatalogData } from '@/features/catalog/model/catalogSelectors'
import { selectIsFavorite } from '@/features/favorites/model/favoritesSlice'
import { addFavoriteThunk, removeFavoriteThunk } from '@/features/favorites/model/favoritesThunks'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import type { RootState } from '@/store'
import styles from './FavoriteToggle.module.css'

const OUTLINE_HEART =
  'M12 20.9535C11.7116 20.9535 11.4326 20.9163 11.2 20.8326C7.64651 19.614 2 15.2884 2 8.89767C2 5.64186 4.63256 3 7.86977 3C9.44186 3 10.9116 3.61395 12 4.71163C13.0884 3.61395 14.5581 3 16.1302 3C19.3674 3 22 5.65116 22 8.89767C22 15.2977 16.3535 19.614 12.8 20.8326C12.5674 20.9163 12.2884 20.9535 12 20.9535ZM7.86977 4.39535C5.40465 4.39535 3.39535 6.41395 3.39535 8.89767C3.39535 15.2512 9.50698 18.786 11.6558 19.5209C11.8233 19.5767 12.186 19.5767 12.3535 19.5209C14.493 18.786 20.614 15.2605 20.614 8.89767C20.614 6.41395 18.6047 4.39535 16.1395 4.39535C14.7256 4.39535 13.414 5.05581 12.5674 6.2C12.307 6.55349 11.7116 6.55349 11.4512 6.2C10.586 5.04651 9.28372 4.39535 7.86977 4.39535Z'
const FILLED_HEART =
  'M12 20.9535C11.7116 20.9535 11.4326 20.9163 11.2 20.8326C7.64651 19.614 2 15.2884 2 8.89767C2 5.64186 4.63256 3 7.86977 3C9.44186 3 10.9116 3.61395 12 4.71163C13.0884 3.61395 14.5581 3 16.1302 3C19.3674 3 22 5.65116 22 8.89767C22 15.2977 16.3535 19.614 12.8 20.8326C12.5674 20.9163 12.2884 20.9535 12 20.9535Z'

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
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path d={isFavorite ? FILLED_HEART : OUTLINE_HEART} fill="currentColor" />
        </svg>
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
