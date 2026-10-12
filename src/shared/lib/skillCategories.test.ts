import { describe, expect, it } from 'vitest'
import {
  SKILL_CATEGORIES,
  SKILL_CATEGORY_CATALOGUE,
  SKILL_SUBCATEGORIES,
} from '@/shared/lib/constants'
import {
  getAllSubcategories,
  getCategoryForSubcategory,
  getSubcategories,
  isSubcategoryOfCategory,
} from '@/shared/lib/skillCategories'

describe('справочник категорий', () => {
  it('содержит категории из макета в нужном порядке', () => {
    expect([...SKILL_CATEGORIES]).toEqual([
      'Бизнес и карьера',
      'Творчество и искусство',
      'Иностранные языки',
      'Образование и развитие',
      'Дом и уют',
      'Здоровье и лайфстайл',
    ])
  })

  it('для каждой категории есть ровно один объект с непустыми подкатегориями', () => {
    expect(SKILL_CATEGORY_CATALOGUE.map((item) => item.name)).toEqual([...SKILL_CATEGORIES])
    expect(SKILL_CATEGORY_CATALOGUE.map((item) => item.subcategories.length)).toEqual([
      8, 8, 7, 6, 6, 7,
    ])
  })

  it('общий список подкатегорий полный и в порядке справочника', () => {
    const expected = SKILL_CATEGORY_CATALOGUE.flatMap((item) => item.subcategories)

    expect(SKILL_SUBCATEGORIES).toEqual(expected)
    expect(SKILL_SUBCATEGORIES).toHaveLength(42)
  })

  it('названия категорий и подкатегорий не повторяются', () => {
    const allNames = [...SKILL_CATEGORIES, ...SKILL_SUBCATEGORIES]

    expect(new Set(allNames).size).toBe(allNames.length)
  })
})

describe('getSubcategories', () => {
  it('возвращает подкатегории категории в порядке макета', () => {
    expect(getSubcategories('Дом и уют')).toEqual([
      'Уборка и организация',
      'Домашние финансы',
      'Приготовление еды',
      'Домашние растения',
      'Ремонт',
      'Хранение вещей',
    ])
  })

  it('для пустой и неизвестной категории возвращает пустой массив', () => {
    expect(getSubcategories('')).toEqual([])
    expect(getSubcategories('Программирование')).toEqual([])
  })
})

describe('getAllSubcategories', () => {
  it('возвращает готовый список без создания нового массива', () => {
    expect(getAllSubcategories()).toBe(SKILL_SUBCATEGORIES)
  })
})

describe('getCategoryForSubcategory', () => {
  it('однозначно определяет категорию для каждой подкатегории', () => {
    SKILL_CATEGORY_CATALOGUE.forEach(({ name, subcategories }) => {
      subcategories.forEach((subcategory) => {
        expect(getCategoryForSubcategory(subcategory)).toBe(name)
      })
    })
  })

  it('для пустой и неизвестной подкатегории возвращает undefined', () => {
    expect(getCategoryForSubcategory('')).toBeUndefined()
    expect(getCategoryForSubcategory('Вязание')).toBeUndefined()
  })
})

describe('isSubcategoryOfCategory', () => {
  it('проверяет принадлежность подкатегории категории', () => {
    expect(isSubcategoryOfCategory('Иностранные языки', 'Японский')).toBe(true)
    expect(isSubcategoryOfCategory('Дом и уют', 'Японский')).toBe(false)
  })

  it('для пустых и неизвестных значений возвращает false', () => {
    expect(isSubcategoryOfCategory('', 'Японский')).toBe(false)
    expect(isSubcategoryOfCategory('Иностранные языки', '')).toBe(false)
    expect(isSubcategoryOfCategory('Программирование', 'Японский')).toBe(false)
    expect(isSubcategoryOfCategory('Иностранные языки', 'Вязание')).toBe(false)
  })
})

describe('неизменность данных', () => {
  it('функции не изменяют справочник', () => {
    const before = JSON.stringify(SKILL_CATEGORY_CATALOGUE)

    getSubcategories('Дом и уют')
    getAllSubcategories()
    getCategoryForSubcategory('Ремонт')
    isSubcategoryOfCategory('Дом и уют', 'Ремонт')

    expect(JSON.stringify(SKILL_CATEGORY_CATALOGUE)).toBe(before)
  })
})
