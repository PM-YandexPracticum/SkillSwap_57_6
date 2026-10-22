import { describe, expect, it } from 'vitest'
import type { CatalogItem, Skill, User } from '@/shared/types'
import { filterCatalog } from './filterCatalog'

const user: User = {
  id: 'anna',
  name: 'Анна',
  email: 'anna@example.com',
  avatarUrl: null,
  createdAt: '2026-01-01',
  age: 25,
  gender: 'female',
  city: 'Москва',
  description: '',
  likesCount: 0,
}
const guitar: Skill = {
  id: 'guitar',
  title: 'Игра на гитаре',
  type: 'teach',
  category: 'Творчество и искусство',
  description: '',
  tags: [],
  imageUrl: null,
  authorId: user.id,
  createdAt: '2026-01-01',
}
const english: Skill = {
  ...guitar,
  id: 'english',
  title: 'Английский',
  type: 'learn',
  category: 'Иностранные языки',
}
const anna: CatalogItem = { user, skills: [guitar, english] }
const boris: CatalogItem = {
  user: { ...user, id: 'boris', name: 'Борис' },
  skills: [
    {
      ...guitar,
      id: 'marketing',
      authorId: 'boris',
      title: 'Маркетинг',
      category: 'Бизнес и карьера',
    },
  ],
}
const items = [anna, boris]

describe('filterCatalog', () => {
  it('normalizes query case and surrounding whitespace and searches a substring', () => {
    expect(filterCatalog(items, '  ГиТаР  ')).toEqual([anna])
  })

  it('filters by type without requiring a query or category', () => {
    expect(filterCatalog(items, '', 'teach')).toEqual(items)
    expect(filterCatalog(items, '', 'learn')).toEqual([anna])
  })

  it('filters by category without requiring a query or type', () => {
    expect(filterCatalog(items, '', 'all', 'Бизнес и карьера')).toEqual([boris])
    expect(filterCatalog(items, '', 'all', 'Иностранные языки')).toEqual([anna])
  })

  it('combines all three conditions on the same skill', () => {
    expect(filterCatalog(items, 'гитар', 'teach', 'Творчество и искусство')).toEqual([anna])
  })

  it.each([
    ['гитар', 'learn', 'all'],
    ['гитар', 'all', 'Иностранные языки'],
    ['', 'teach', 'Иностранные языки'],
    ['гитар', 'learn', 'Иностранные языки'],
  ] as const)('rejects conditions split across skills: %s / %s / %s', (query, type, category) => {
    expect(filterCatalog([anna], query, type, category)).toEqual([])
  })

  it.each([
    ['гитар', 'all', 'all'],
    ['', 'teach', 'all'],
    ['', 'all', 'Творчество и искусство'],
  ] as const)(
    'deduplicates users during active filtering: %s / %s / %s',
    (query, type, category) => {
      const duplicate = { ...anna, skills: [...anna.skills, { ...guitar, id: 'guitar-2' }] }
      expect(filterCatalog([anna, duplicate], query, type, category)).toEqual([anna])
    },
  )

  it('does not let a nonmatching duplicate hide a later matching item', () => {
    expect(filterCatalog([{ ...anna, skills: [] }, anna], 'гитар')).toEqual([anna])
  })

  it('preserves original objects and all skills without mutating frozen data', () => {
    const snapshot = JSON.stringify(items)
    for (const item of items) {
      Object.freeze(item.user)
      for (const skill of item.skills) {
        Object.freeze(skill.tags)
        Object.freeze(skill)
      }
      Object.freeze(item.skills)
      Object.freeze(item)
    }
    Object.freeze(items)
    const result = filterCatalog(items, 'гитар', 'teach')
    expect(result).not.toBe(items)
    expect(result[0]).toBe(anna)
    expect(result[0].skills).toBe(anna.skills)
    expect(result[0].skills).toEqual([guitar, english])
    expect(JSON.stringify(items)).toBe(snapshot)
  })

  it('returns the original list when no conditions are active, including users without skills', () => {
    const unfiltered = [anna, { ...boris, skills: [] }]
    expect(filterCatalog(unfiltered, '   ', 'all', 'all')).toBe(unfiltered)
  })

  it('matches the subcategory on the same skill as the other conditions', () => {
    const tagged: CatalogItem = {
      user,
      skills: [
        { ...guitar, tags: ['Музыка и звук'] },
        { ...english, tags: ['Английский'] },
      ],
    }
    const list = [tagged, boris]
    expect(filterCatalog(list, '', 'all', 'all', 'Музыка и звук')).toEqual([tagged])
    expect(
      filterCatalog(list, 'гитар', 'teach', 'Творчество и искусство', 'Музыка и звук'),
    ).toEqual([tagged])
    expect(filterCatalog(list, 'гитар', 'all', 'all', 'Английский')).toEqual([])
    expect(filterCatalog(list, '', 'teach', 'Иностранные языки', 'Английский')).toEqual([])
    expect(filterCatalog(list, '', 'all', 'all', '')).toBe(list)
  })

  it('returns an empty result for no matches, no skills or no users', () => {
    expect(filterCatalog(items, 'несуществующий навык')).toEqual([])
    expect(filterCatalog(items, '', 'all', 'Здоровье и лайфстайл')).toEqual([])
    expect(filterCatalog([{ ...anna, skills: [] }], '', 'teach')).toEqual([])
    expect(filterCatalog([], '', 'teach')).toEqual([])
  })
})
