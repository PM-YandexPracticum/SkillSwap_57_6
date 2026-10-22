import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { fetchUsers } from '@/api/users'
import { fetchSkills } from '@/api/skills'
import catalogReducer from '@/features/catalog/model/catalogSlice'
import localDataReducer from '@/features/localData/model/localDataSlice'
import profileReducer from '@/features/profile/model/profileSlice'
import favoritesReducer from '@/features/favorites/model/favoritesSlice'
import authReducer from '@/features/auth/model/authSlice'
import type { Skill, User } from '@/shared/types'
import CatalogPage from '.'

vi.mock('@/api/users', () => ({ fetchUsers: vi.fn() }))
vi.mock('@/api/skills', () => ({ fetchSkills: vi.fn() }))

const users: User[] = Array.from({ length: 20 }, (_, index) => ({
  id: `user-${index + 1}`,
  name: `Участник ${index + 1}`,
  email: `user${index}@example.com`,
  avatarUrl: null,
  createdAt: '2026-01-01',
  age: 25,
  gender: 'female',
  city: 'Москва',
  description: '',
  likesCount: index,
}))
const skills: Skill[] = users.flatMap((user, index) => {
  const common = {
    authorId: user.id,
    description: '',
    tags: [],
    imageUrl: null,
    createdAt: '2026-01-01',
  }
  return [
    {
      ...common,
      id: `${user.id}-teach`,
      title: `Гитара ${index + 1}`,
      type: 'teach',
      category: index < 10 ? 'Творчество и искусство' : 'Бизнес и карьера',
    },
    {
      ...common,
      id: `${user.id}-learn`,
      title: `Английский ${index + 1}`,
      type: 'learn',
      category: 'Иностранные языки',
    },
  ]
})

beforeEach(() => {
  vi.mocked(fetchUsers).mockResolvedValue(users)
  vi.mocked(fetchSkills).mockResolvedValue(skills)
})
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

async function renderCatalog() {
  const store = configureStore({
    reducer: {
      catalog: catalogReducer,
      localData: localDataReducer,
      profile: profileReducer,
      favorites: favoritesReducer,
      auth: authReducer,
    },
  })
  render(
    <Provider store={store}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CatalogPage />
      </MemoryRouter>
    </Provider>,
  )
  await screen.findByRole('heading', { name: 'Популярное' })
}

function expectSections(visible: boolean) {
  for (const name of ['Популярное', 'Новое', 'Рекомендуем']) {
    const heading = screen.queryByRole('heading', { name })
    if (visible) expect(heading).toBeInTheDocument()
    else expect(heading).not.toBeInTheDocument()
  }
}

function expectFirstPage() {
  expect(screen.getByRole('button', { name: 'Страница 1' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('button', { name: 'Страница 2' })).not.toHaveAttribute('aria-current')
  const results = screen.getByRole('region', { name: 'Результаты каталога' })
  expect(within(results).getAllByRole('article')).toHaveLength(9)
  expect(within(results).getByRole('heading', { name: 'Участник 1' })).toBeInTheDocument()
}

describe('CatalogPage filters', () => {
  it.each(['type', 'category'])(
    'opens results for %s alone with an empty search',
    async (filter) => {
      const user = userEvent.setup()
      await renderCatalog()
      expectSections(true)
      expect(screen.getByRole('searchbox')).toHaveValue('')
      if (filter === 'type') await user.click(screen.getByRole('radio', { name: 'Могу научить' }))
      else
        await user.selectOptions(
          screen.getByRole('combobox', { name: 'Категория' }),
          'Иностранные языки',
        )
      expectSections(false)
      expect(screen.getByText('Подходящие предложения: 20')).toBeInTheDocument()
      expectFirstPage()
    },
  )

  it('combines search, type and category while keeping both skill groups in cards', async () => {
    const user = userEvent.setup()
    await renderCatalog()
    await user.click(screen.getByRole('radio', { name: 'Могу научить' }))
    await user.type(screen.getByRole('searchbox'), '  АНГЛИЙСКИЙ  ')
    await screen.findByText('По вашему запросу ничего не найдено.')
    expectSections(false)
    await user.click(screen.getByRole('radio', { name: 'Хочу научиться' }))
    expect(screen.getByText('Подходящие предложения: 20')).toBeInTheDocument()
    const category = screen.getByRole('combobox', { name: 'Категория' })
    await user.selectOptions(category, 'Творчество и искусство')
    expect(screen.getByText('По вашему запросу ничего не найдено.')).toBeInTheDocument()
    await user.selectOptions(category, 'Иностранные языки')
    const results = screen.getByRole('region', { name: 'Результаты каталога' })
    const card = within(results).getAllByRole('article')[0]
    expect(within(card).getByText('Может научить:')).toBeInTheDocument()
    expect(within(card).getByText('Хочет научиться:')).toBeInTheDocument()
    expect(within(card).getByRole('link', { name: 'Гитара 1' })).toBeInTheDocument()
    expect(within(card).getByRole('link', { name: 'Английский 1' })).toBeInTheDocument()
  })

  it('resets page two to page one after a type change with multiple pages still available', async () => {
    const user = userEvent.setup()
    await renderCatalog()
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Категория' }),
      'Иностранные языки',
    )
    await user.click(screen.getByRole('button', { name: 'Страница 2' }))
    expect(screen.getByRole('button', { name: 'Страница 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await user.click(screen.getByRole('radio', { name: 'Хочу научиться' }))
    expect(screen.getByText('Подходящие предложения: 20')).toBeInTheDocument()
    expectFirstPage()
  })

  it('resets page two after a category change even when the new result has two pages', async () => {
    const user = userEvent.setup()
    await renderCatalog()
    await user.click(screen.getByRole('radio', { name: 'Могу научить' }))
    await user.click(screen.getByRole('button', { name: 'Страница 2' }))
    expect(screen.getByRole('button', { name: 'Страница 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Категория' }),
      'Творчество и искусство',
    )
    expect(screen.getByText('Подходящие предложения: 10')).toBeInTheDocument()
    expectFirstPage()
  })

  it('preserves search debounce and resets page two when the query is applied', async () => {
    const user = userEvent.setup()
    await renderCatalog()
    await user.click(screen.getByRole('radio', { name: 'Могу научить' }))
    await user.click(screen.getByRole('button', { name: 'Страница 2' }))
    vi.useFakeTimers()
    try {
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Гитара' } })
      await act(async () => {
        vi.advanceTimersByTime(299)
      })
      expect(screen.getByRole('button', { name: 'Страница 2' })).toHaveAttribute(
        'aria-current',
        'page',
      )
      await act(async () => {
        vi.advanceTimersByTime(1)
      })
      expectFirstPage()
      expect(screen.getByText('Подходящие предложения: 20')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('returns to three sections only after clearing the query and both filters', async () => {
    const user = userEvent.setup()
    await renderCatalog()
    const category = screen.getByRole('combobox', { name: 'Категория' })
    await user.click(screen.getByRole('radio', { name: 'Могу научить' }))
    await user.selectOptions(category, 'Творчество и искусство')
    await user.type(screen.getByRole('searchbox'), 'Гитара 1')
    await screen.findByText('Подходящие предложения: 2')
    await user.click(screen.getByRole('radio', { name: 'Все' }))
    await user.selectOptions(category, 'all')
    expectSections(false)
    expect(screen.getByText('Подходящие предложения: 11')).toBeInTheDocument()
    await user.selectOptions(category, 'Творчество и искусство')
    await user.click(screen.getByRole('button', { name: 'Очистить поиск' }))
    await screen.findByText('Подходящие предложения: 10')
    expectSections(false)
    await user.click(screen.getByRole('radio', { name: 'Могу научить' }))
    await user.selectOptions(category, 'all')
    expectSections(false)
    await user.click(screen.getByRole('radio', { name: 'Все' }))
    await waitFor(() => expectSections(true))
    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(vi.mocked(fetchUsers)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(fetchSkills)).toHaveBeenCalledTimes(1)
  })
})
