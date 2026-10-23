import type { SkillCategory } from '@/shared/types'

export const ROUTES = {
  HOME: '/',
  SKILL: '/skill/:id',
  PROFILE: '/profile',
  REQUESTS: '/requests',
  FAVORITES: '/favorites',
  ABOUT: '/about',
  CREATE: '/create',
  LOGIN: '/login',
  REGISTER: '/register',
} as const

export const SKILL_CATEGORIES = [
  'Бизнес и карьера',
  'Творчество и искусство',
  'Иностранные языки',
  'Образование и развитие',
  'Дом и уют',
  'Здоровье и лайфстайл',
] as const

const SUBCATEGORIES_BY_CATEGORY: Readonly<Record<SkillCategory, readonly string[]>> = {
  'Бизнес и карьера': [
    'Управление командой',
    'Маркетинг и реклама',
    'Продажи и переговоры',
    'Личный бренд',
    'Резюме и собеседование',
    'Тайм-менеджмент',
    'Проектное управление',
    'Предпринимательство',
  ],
  'Творчество и искусство': [
    'Рисование и иллюстрация',
    'Фотография',
    'Видеомонтаж',
    'Музыка и звук',
    'Актёрское мастерство',
    'Креативное письмо',
    'Арт-терапия',
    'Декор и DIY',
  ],
  'Иностранные языки': [
    'Английский',
    'Французский',
    'Испанский',
    'Немецкий',
    'Китайский',
    'Японский',
    'Подготовка к экзаменам (IELTS, TOEFL)',
  ],
  'Образование и развитие': [
    'Личностное развитие',
    'Навыки обучения',
    'Когнитивные техники',
    'Скорочтение',
    'Навыки преподавания',
    'Коучинг',
  ],
  'Дом и уют': [
    'Уборка и организация',
    'Домашние финансы',
    'Приготовление еды',
    'Домашние растения',
    'Ремонт',
    'Хранение вещей',
  ],
  'Здоровье и лайфстайл': [
    'Йога и медитация',
    'Питание и ЗОЖ',
    'Ментальное здоровье',
    'Осознанность',
    'Физические тренировки',
    'Сон и восстановление',
    'Баланс жизни и работы',
  ],
}

export const SKILL_CATEGORY_CATALOGUE: ReadonlyArray<{
  readonly name: SkillCategory
  readonly subcategories: readonly string[]
}> = SKILL_CATEGORIES.map((name) => ({
  name,
  subcategories: SUBCATEGORIES_BY_CATEGORY[name],
}))

export const SKILL_SUBCATEGORIES: readonly string[] = SKILL_CATEGORY_CATALOGUE.flatMap(
  (category) => category.subcategories,
)

export const LOCAL_STORAGE_KEYS = {
  AUTH_USER: 'skillswap_auth_user',
  FAVORITES: 'skillswap_favorites',
  REQUESTS: 'skillswap_requests',
  THEME: 'skillswap_theme',
  PROJECT_DATA: 'skillswap_project_data',
  PROFILE_OVERRIDES: 'skillswap_profile_overrides',
} as const
