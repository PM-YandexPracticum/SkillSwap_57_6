import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fetchUsers } from '@/api/users'
import { fetchSkills } from '@/api/skills'
import catalogReducer from '@/features/catalog/model/catalogSlice'
import localDataReducer from '@/features/localData/model/localDataSlice'
import profileReducer from '@/features/profile/model/profileSlice'
import favoritesReducer from '@/features/favorites/model/favoritesSlice'
import { switchFavoritesOwner } from '@/features/favorites/model/favoritesThunks'
import { getFavoritesKey } from '@/features/favorites/model/favoritesStorage'
import authReducer from '@/features/auth/model/authSlice'
import type { Skill, User } from '@/shared/types'
import { CatalogResults } from '@/widgets/CatalogResults'
import CatalogPage from '@/pages/CatalogPage'

vi.mock('@/api/users', () => ({ fetchUsers: vi.fn() }))
vi.mock('@/api/skills', () => ({ fetchSkills: vi.fn() }))

const users: User[] = [10, 5, 5, 0].map((likesCount, index) => ({
  id: `user-${index + 1}`,
  name: `Участник ${index + 1}`,
  email: `user${index + 1}@example.com`,
  avatarUrl: null,
  createdAt: '2026-01-01',
  age: 25,
  gender: 'female',
  city: 'Москва',
  description: '',
  likesCount,
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
      category: 'Творчество и искусство',
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
  localStorage.clear()
  vi.mocked(fetchUsers).mockResolvedValue(users)
  vi.mocked(fetchSkills).mockResolvedValue(skills)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
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
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/skill/:id" element={<p>Страница навыка</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
  await screen.findByRole('heading', { name: 'Популярное' })
  return store
}

const cardsOf = (name: string) =>
  screen.getAllByRole('heading', { name }).map((heading) => heading.closest('article')!)

const togglesOf = (name: string) =>
  cardsOf(name).map((card) => within(card).getByRole('button', { name: 'В избранное' }))

function expectCards(name: string, pressed: boolean, likes: number) {
  for (const card of cardsOf(name)) {
    expect(within(card).getByRole('button', { name: 'В избранное' })).toHaveAttribute(
      'aria-pressed',
      String(pressed),
    )
    expect(within(card).getByText(String(likes))).toBeInTheDocument()
  }
}

const popularNames = () =>
  within(screen.getByRole('heading', { name: 'Популярное' }).closest('section')!)
    .getAllByRole('article')
    .map((card) => within(card).getByRole('heading', { level: 3 }).textContent)

const savedIds = (owner: string | null = null) =>
  JSON.parse(localStorage.getItem(getFavoritesKey(owner)) ?? '[]')

describe('FavoriteToggle in the catalog', () => {
  it('syncs every button of one teach for a guest, unlikes and does not open details', async () => {
    const user = userEvent.setup()
    await renderCatalog()
    expect(togglesOf('Участник 1').length).toBeGreaterThan(1)
    expectCards('Участник 1', false, 10)

    await user.click(togglesOf('Участник 1')[0])
    expectCards('Участник 1', true, 11)
    expect(savedIds()).toEqual(['user-1-teach'])
    expect(screen.queryByText('Страница навыка')).not.toBeInTheDocument()

    await user.click(togglesOf('Участник 1')[1])
    expectCards('Участник 1', false, 10)
    expect(savedIds()).toEqual([])
  })

  it('keeps separate lists for A and B and updates popular order and likes', async () => {
    const user = userEvent.setup()
    const store = await renderCatalog()
    expect(popularNames()).toEqual(['Участник 1', 'Участник 2', 'Участник 3'])

    act(() => {
      store.dispatch(switchFavoritesOwner('A'))
    })
    await user.click(togglesOf('Участник 3')[0])
    expect(popularNames()).toEqual(['Участник 1', 'Участник 3', 'Участник 2'])
    expectCards('Участник 3', true, 6)

    act(() => {
      store.dispatch(switchFavoritesOwner('B'))
    })
    expectCards('Участник 3', false, 6)
    await user.click(togglesOf('Участник 3')[0])
    expectCards('Участник 3', true, 7)

    act(() => {
      store.dispatch(switchFavoritesOwner('A'))
    })
    expectCards('Участник 3', true, 7)
    expect(savedIds('A')).toEqual(['user-3-teach'])
    expect(savedIds('B')).toEqual(['user-3-teach'])
    expect(savedIds()).toEqual([])
  })

  it('targets the teach skill when the card is found by a learn title', async () => {
    const user = userEvent.setup()
    await renderCatalog()
    await user.type(screen.getByRole('searchbox'), 'Английский 2')
    await screen.findByText('Подходящие предложения: 1')

    await user.click(togglesOf('Участник 2')[0])
    expect(savedIds()).toEqual(['user-2-teach'])
    expectCards('Участник 2', true, 6)
  })

  it('shows an error and keeps the state when saving fails', async () => {
    const user = userEvent.setup()
    await renderCatalog()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })

    const [toggle] = togglesOf('Участник 1')
    await user.click(toggle)
    expect(toggle).toHaveAccessibleDescription('Не удалось обновить избранное')
    expectCards('Участник 1', false, 10)
    expect(localStorage.getItem(getFavoritesKey())).toBeNull()
  })
})

it('keeps the decorative heart in CatalogResults without renderAction', () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CatalogResults
        items={[{ user: users[0], skills: skills.slice(0, 2) }]}
        currentPage={1}
        onPageChange={vi.fn()}
      />
    </MemoryRouter>,
  )
  expect(screen.getByRole('article')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'В избранное' })).not.toBeInTheDocument()
})
