import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getAllSubcategories, getSubcategories } from '@/shared/lib/skillCategories'
import { SkillCategorySelect } from '.'
import type { SkillCategorySelectProps, SkillCategorySelectValue } from '.'

afterEach(cleanup)

const EMPTY: SkillCategorySelectValue = { categories: [], subcategories: [] }

function ControlledExample({
  initialValue = EMPTY,
  onValue,
  ...props
}: Omit<SkillCategorySelectProps, 'value' | 'onChange'> & {
  initialValue?: SkillCategorySelectValue
  onValue?: (value: SkillCategorySelectValue) => void
}) {
  const [value, setValue] = useState(initialValue)
  return (
    <SkillCategorySelect
      {...props}
      value={value}
      onChange={(nextValue) => {
        onValue?.(nextValue)
        setValue(nextValue)
      }}
    />
  )
}

const getGroup = (name: string) => screen.getByRole('group', { name })

async function openGroup(name: string) {
  const user = userEvent.setup()
  await user.click(within(getGroup(name)).getByRole('button'))
  return user
}

const checkboxNames = (name: string) =>
  within(getGroup(name))
    .getAllByRole('checkbox')
    .map((item) => item.getAttribute('value'))

describe('SkillCategorySelect', () => {
  it('uses Select for one category and MultiSelect for subcategories with the limit', async () => {
    const onValue = vi.fn()
    render(<ControlledExample categoryMode="single" maxSubcategories={5} onValue={onValue} />)
    const user = userEvent.setup()
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Категория' }),
      'Иностранные языки',
    )
    expect(onValue).toHaveBeenLastCalledWith({
      categories: ['Иностранные языки'],
      subcategories: [],
    })
    await openGroup('Подкатегория')
    expect(checkboxNames('Подкатегория')).toEqual(getSubcategories('Иностранные языки'))
    for (const name of ['Английский', 'Французский', 'Испанский', 'Немецкий', 'Китайский']) {
      await user.click(screen.getByRole('checkbox', { name }))
    }
    expect(screen.getByRole('checkbox', { name: 'Японский' })).toBeDisabled()
    expect(onValue).toHaveBeenLastCalledWith({
      categories: ['Иностранные языки'],
      subcategories: ['Английский', 'Французский', 'Испанский', 'Немецкий', 'Китайский'],
    })
  })

  it('offers all subcategories without categories and the union of selected ones in order', async () => {
    render(
      <ControlledExample
        categoryMode="multiple"
        initialValue={{ categories: ['Дом и уют', 'Иностранные языки'], subcategories: [] }}
      />,
    )
    await openGroup('Подкатегория')
    expect(checkboxNames('Подкатегория')).toEqual([
      ...getSubcategories('Иностранные языки'),
      ...getSubcategories('Дом и уют'),
    ])
    cleanup()
    render(<ControlledExample categoryMode="multiple" />)
    await openGroup('Подкатегория')
    expect(checkboxNames('Подкатегория')).toEqual(getAllSubcategories())
  })

  it('adds the parent of a chosen subcategory and keeps previous categories in multiple mode', async () => {
    const onValue = vi.fn()
    render(
      <ControlledExample
        categoryMode="multiple"
        initialValue={{ categories: ['Иностранные языки'], subcategories: ['Английский'] }}
        onValue={onValue}
      />,
    )
    const user = await openGroup('Категория')
    await user.click(screen.getByRole('checkbox', { name: 'Дом и уют' }))
    await openGroup('Подкатегория')
    await user.click(screen.getByRole('checkbox', { name: 'Ремонт' }))
    expect(onValue).toHaveBeenLastCalledWith({
      categories: ['Иностранные языки', 'Дом и уют'],
      subcategories: ['Английский', 'Ремонт'],
    })
    cleanup()
    onValue.mockClear()
    render(<ControlledExample categoryMode="multiple" onValue={onValue} />)
    await openGroup('Подкатегория')
    await user.click(screen.getByRole('checkbox', { name: 'Фотография' }))
    expect(onValue).toHaveBeenCalledTimes(1)
    expect(onValue).toHaveBeenLastCalledWith({
      categories: ['Творчество и искусство'],
      subcategories: ['Фотография'],
    })
  })

  it('sets the single category from a subcategory chosen without a category', async () => {
    const onValue = vi.fn()
    render(<ControlledExample categoryMode="single" onValue={onValue} />)
    const user = await openGroup('Подкатегория')
    await user.click(screen.getByRole('checkbox', { name: 'Скорочтение' }))
    expect(onValue).toHaveBeenLastCalledWith({
      categories: ['Образование и развитие'],
      subcategories: ['Скорочтение'],
    })
    expect(screen.getByRole('combobox', { name: 'Категория' })).toHaveValue(
      'Образование и развитие',
    )
  })

  it('removes only the subcategories of an unchecked category in multiple mode', async () => {
    const onValue = vi.fn()
    const initialValue = {
      categories: ['Иностранные языки', 'Дом и уют'],
      subcategories: ['Английский', 'Ремонт', 'Немецкий'],
    }
    render(
      <ControlledExample categoryMode="multiple" initialValue={initialValue} onValue={onValue} />,
    )
    const user = await openGroup('Категория')
    await user.click(screen.getByRole('checkbox', { name: 'Иностранные языки' }))
    expect(onValue).toHaveBeenCalledTimes(1)
    expect(onValue).toHaveBeenLastCalledWith({
      categories: ['Дом и уют'],
      subcategories: ['Ремонт'],
    })
    expect(initialValue).toEqual({
      categories: ['Иностранные языки', 'Дом и уют'],
      subcategories: ['Английский', 'Ремонт', 'Немецкий'],
    })
  })

  it('removes incompatible subcategories when the single category is replaced or cleared', async () => {
    const onValue = vi.fn()
    render(
      <ControlledExample
        categoryMode="single"
        initialValue={{ categories: ['Иностранные языки'], subcategories: ['Английский'] }}
        onValue={onValue}
      />,
    )
    const user = userEvent.setup()
    const category = screen.getByRole('combobox', { name: 'Категория' })
    await user.selectOptions(category, 'Дом и уют')
    expect(onValue).toHaveBeenLastCalledWith({ categories: ['Дом и уют'], subcategories: [] })
    await openGroup('Подкатегория')
    await user.click(screen.getByRole('checkbox', { name: 'Ремонт' }))
    await user.selectOptions(category, '')
    expect(onValue).toHaveBeenLastCalledWith({ categories: [], subcategories: [] })
  })

  it('keeps the category when a subcategory is unchecked', async () => {
    const onValue = vi.fn()
    render(
      <ControlledExample
        categoryMode="multiple"
        initialValue={{ categories: ['Дом и уют'], subcategories: ['Ремонт'] }}
        onValue={onValue}
      />,
    )
    const user = await openGroup('Подкатегория')
    await user.click(screen.getByRole('checkbox', { name: 'Ремонт' }))
    expect(onValue).toHaveBeenLastCalledWith({ categories: ['Дом и уют'], subcategories: [] })
  })

  it('uses Select for one subcategory and replaces the previous choice', async () => {
    const onValue = vi.fn()
    render(<ControlledExample categoryMode="single" maxSubcategories={1} onValue={onValue} />)
    const user = userEvent.setup()
    const subcategory = screen.getByRole('combobox', { name: 'Подкатегория' })
    await user.selectOptions(subcategory, 'Английский')
    expect(onValue).toHaveBeenLastCalledWith({
      categories: ['Иностранные языки'],
      subcategories: ['Английский'],
    })
    await user.selectOptions(subcategory, 'Немецкий')
    expect(onValue).toHaveBeenLastCalledWith({
      categories: ['Иностранные языки'],
      subcategories: ['Немецкий'],
    })
    await user.selectOptions(subcategory, '')
    expect(onValue).toHaveBeenLastCalledWith({
      categories: ['Иностранные языки'],
      subcategories: [],
    })
  })

  it('does not call onChange on mount, keeps unknown values and reflects an external reset', () => {
    const onChange = vi.fn()
    const value = Object.freeze({
      categories: Object.freeze(['Неизвестная категория']) as string[],
      subcategories: Object.freeze(['Неизвестная подкатегория']) as string[],
    })
    const { rerender } = render(
      <SkillCategorySelect
        categoryMode="single"
        maxSubcategories={1}
        value={value}
        onChange={onChange}
      />,
    )
    expect(screen.getByRole('combobox', { name: 'Категория' })).toHaveValue('')
    expect(screen.getByRole('combobox', { name: 'Подкатегория' })).toHaveValue('')
    rerender(
      <SkillCategorySelect
        categoryMode="single"
        maxSubcategories={1}
        value={{ categories: ['Дом и уют'], subcategories: ['Ремонт'] }}
        onChange={onChange}
      />,
    )
    expect(screen.getByRole('combobox', { name: 'Подкатегория' })).toHaveValue('Ремонт')
    rerender(
      <SkillCategorySelect
        categoryMode="single"
        maxSubcategories={1}
        value={EMPTY}
        onChange={onChange}
      />,
    )
    expect(screen.getByRole('combobox', { name: 'Категория' })).toHaveValue('')
    expect(screen.getByRole('combobox', { name: 'Подкатегория' })).toHaveValue('')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('passes separate labels and errors, required and disabled to both fields', () => {
    render(
      <SkillCategorySelect
        categoryMode="single"
        maxSubcategories={1}
        value={EMPTY}
        onChange={vi.fn()}
        categoryLabel="Категория навыка"
        subcategoryLabel="Подкатегория навыка"
        categoryError="Выберите категорию"
        subcategoryError="Выберите подкатегорию"
        categoryRequired
        subcategoryRequired
        disabled
      />,
    )
    const category = screen.getByRole('combobox', { name: 'Категория навыка' })
    const subcategory = screen.getByRole('combobox', { name: 'Подкатегория навыка' })
    expect(category).toHaveAccessibleDescription('Выберите категорию')
    expect(subcategory).toHaveAccessibleDescription('Выберите подкатегорию')
    expect(category).toBeRequired()
    expect(subcategory).toBeRequired()
    expect(category).toBeDisabled()
    expect(subcategory).toBeDisabled()
  })
})
