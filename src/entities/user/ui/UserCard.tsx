import { Link, generatePath } from 'react-router-dom'
import type { Skill, User } from '@/shared/types'
import { ROUTES } from '@/shared/lib/constants'
import { formatAge } from '@/shared/lib/helpers'
import likeIcon from './assets/like.svg'
import './UserCard.css'

const MAX_VISIBLE_SKILLS = 2

// Цвет тега зависит от категории навыка
const CATEGORY_MODIFIERS: Record<string, string> = {
  'Бизнес и карьера': 'user-card__tag--business',
  'Творчество и искусство': 'user-card__tag--art',
  'Иностранные языки': 'user-card__tag--languages',
  'Образование и развитие': 'user-card__tag--education',
  'Здоровье и лайфстайл': 'user-card__tag--health',
  'Дом и уют': 'user-card__tag--home',
}

const getSkillPath = (id: string) => generatePath(ROUTES.SKILL, { id })

interface SkillGroupProps {
  title: string
  skills: Skill[]
}

function SkillGroup({ title, skills }: SkillGroupProps) {
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
                className={`user-card__tag ${CATEGORY_MODIFIERS[skill.category] ?? ''}`}
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
}

export function UserCard({ user, skills }: UserCardProps) {
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
        <img className="user-card__like" src={likeIcon} alt="" width={24} height={24} />
      </div>

      <div className="user-card__skills">
        <SkillGroup title="Может научить:" skills={teachSkills} />
        <SkillGroup title="Хочет научиться:" skills={learnSkills} />
      </div>

      {detailsSkill && (
        <Link className="user-card__button" to={getSkillPath(detailsSkill.id)}>
          Подробнее
        </Link>
      )}
    </article>
  )
}
