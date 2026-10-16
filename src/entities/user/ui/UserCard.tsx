import { Link, generatePath } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Skill, User } from '@/shared/types'
import { ROUTES } from '@/shared/lib/constants'
import { formatAge } from '@/shared/lib/helpers'
import likeIcon from './assets/like.svg'
import './UserCard.css'

const MAX_VISIBLE_SKILLS = 2

// Палитра тегов. Цвет выбирается по названию категории
const CATEGORY_COLORS = ['#eee7f7', '#f7e7f2', '#ebe5c5', '#e7f2f6', '#e9f7e7', '#f7ebe5'] as const

const getCategoryColor = (category: string) => {
  let hash = 0

  for (let i = 0; i < category.length; i += 1) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash)
  }

  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length]
}

const getSkillPath = (id: string) => generatePath(ROUTES.SKILL, { id })

interface SkillGroupProps {
  title: string
  skills: Skill[]
  /** Если true — при пустом списке группа не рендерится вовсе */
  hideEmpty: boolean
}

function SkillGroup({ title, skills, hideEmpty }: SkillGroupProps) {
  if (hideEmpty && skills.length === 0) {
    return null
  }

  const visibleSkills = skills.slice(0, MAX_VISIBLE_SKILLS)
  const hiddenCount = skills.length - visibleSkills.length

  return (
    <div className="user-card__group">
      <p className="user-card__group-title">{title}</p>
      {skills.length === 0 ? (
        <p className="user-card__empty">Пока нет навыков</p>
      ) : (
        <ul className="user-card__tags">
          {visibleSkills.map((skill) => (
            <li key={skill.id} className="user-card__tags-item">
              <Link
                className="user-card__tag"
                style={{ backgroundColor: getCategoryColor(skill.category) }}
                to={getSkillPath(skill.id)}
              >
                {skill.title}
              </Link>
            </li>
          ))}
          {hiddenCount > 0 && (
            <li className="user-card__tags-item">
              <span className="user-card__tag">+{hiddenCount}</span>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

interface UserCardProps {
  user: User
  /** Все навыки пользователя: teach и learn */
  skills: Skill[]
  /** Готовый элемент действия (например, кнопка избранного). Заменяет декоративное сердце */
  action?: ReactNode
  /** Если true — пустые группы «Может научить» / «Хочет научиться» скрываются */
  hideEmptyGroups?: boolean
}

export function UserCard({ user, skills, action, hideEmptyGroups = false }: UserCardProps) {
  const teachSkills = skills.filter((skill) => skill.type === 'teach')
  const learnSkills = skills.filter((skill) => skill.type === 'learn')
  const detailsSkill = teachSkills[0] ?? learnSkills[0]

  return (
    <article className="user-card">
      <div className="user-card__user">
        {user.avatarUrl ? (
          <img className="user-card__avatar" src={user.avatarUrl} alt={user.name} />
        ) : (
          <div className="user-card__avatar user-card__avatar--placeholder" aria-hidden="true">
            {user.name.charAt(0)}
          </div>
        )}
        <div className="user-card__info">
          <h3 className="user-card__name">{user.name}</h3>
          <p className="user-card__meta">
            {user.city}, {formatAge(user.age)}
          </p>
        </div>
        {action ? (
          <div className="user-card__action">{action}</div>
        ) : (
          <img className="user-card__like" src={likeIcon} alt="" width={24} height={24} />
        )}
      </div>

      <div className="user-card__skills">
        <SkillGroup title="Может научить:" skills={teachSkills} hideEmpty={hideEmptyGroups} />
        <SkillGroup title="Хочет научиться:" skills={learnSkills} hideEmpty={hideEmptyGroups} />
      </div>

      {detailsSkill && (
        <Link className="user-card__button" to={getSkillPath(detailsSkill.id)}>
          Подробнее
        </Link>
      )}
    </article>
  )
}
