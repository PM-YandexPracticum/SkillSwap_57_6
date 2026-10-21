import { SKILL_CATEGORIES } from '@/shared/lib/constants'
import {
  getAllSubcategories,
  getCategoryForSubcategory,
  getSubcategories,
  isSubcategoryOfCategory,
} from '@/shared/lib/skillCategories'
import type { SkillCategory } from '@/shared/types'
import { MultiSelect } from '@/shared/ui/MultiSelect'
import { Select } from '@/shared/ui/Select'
import styles from './SkillCategorySelect.module.css'

export interface SkillCategorySelectValue {
  categories: string[]
  subcategories: string[]
}

export interface SkillCategorySelectProps {
  categoryMode: 'single' | 'multiple'
  value: SkillCategorySelectValue
  onChange: (value: SkillCategorySelectValue) => void
  categoryLabel?: string
  subcategoryLabel?: string
  categoryError?: string
  subcategoryError?: string
  categoryRequired?: boolean
  subcategoryRequired?: boolean
  disabled?: boolean
  maxSubcategories?: number
}

export function SkillCategorySelect({
  categoryMode,
  value,
  onChange,
  categoryLabel = 'Категория',
  subcategoryLabel = 'Подкатегория',
  categoryError,
  subcategoryError,
  categoryRequired,
  subcategoryRequired,
  disabled,
  maxSubcategories,
}: SkillCategorySelectProps) {
  const selectedCategories = SKILL_CATEGORIES.filter((category) =>
    value.categories.includes(category),
  )
  const subcategoryOptions = selectedCategories.length
    ? [...new Set(selectedCategories.flatMap((category) => getSubcategories(category)))]
    : getAllSubcategories()

  const changeCategories = (nextCategories: string[]) => {
    if (categoryMode === 'single') {
      const [category = ''] = nextCategories
      onChange({
        categories: category ? [category] : [],
        subcategories: value.subcategories.filter((subcategory) =>
          isSubcategoryOfCategory(category, subcategory),
        ),
      })
      return
    }

    const removedCategories = value.categories.filter(
      (category) => !nextCategories.includes(category),
    )
    onChange({
      categories: nextCategories,
      subcategories: value.subcategories.filter(
        (subcategory) =>
          !removedCategories.some((category) => isSubcategoryOfCategory(category, subcategory)),
      ),
    })
  }

  const changeSubcategories = (nextSubcategories: string[]) => {
    // Родители добавленных подкатегорий; снятие подкатегории категорию не удаляет
    const parentCategories = nextSubcategories
      .filter((subcategory) => !value.subcategories.includes(subcategory))
      .map((subcategory) => getCategoryForSubcategory(subcategory))
      .filter((category): category is SkillCategory => category !== undefined)

    if (categoryMode === 'single') {
      const category = parentCategories[parentCategories.length - 1]
      onChange(
        category
          ? {
              categories: [category],
              subcategories: nextSubcategories.filter((subcategory) =>
                isSubcategoryOfCategory(category, subcategory),
              ),
            }
          : { categories: [...value.categories], subcategories: nextSubcategories },
      )
      return
    }

    onChange({
      categories: [...new Set([...value.categories, ...parentCategories])],
      subcategories: nextSubcategories,
    })
  }

  return (
    <div className={styles.wrapper}>
      {categoryMode === 'single' ? (
        <Select
          label={categoryLabel}
          placeholder="Выберите категорию"
          options={SKILL_CATEGORIES}
          value={value.categories[0] ?? ''}
          onChange={(category) => changeCategories(category ? [category] : [])}
          error={categoryError}
          required={categoryRequired}
          disabled={disabled}
        />
      ) : (
        <MultiSelect
          label={categoryLabel}
          options={SKILL_CATEGORIES}
          value={value.categories}
          onChange={changeCategories}
          error={categoryError}
          required={categoryRequired}
          disabled={disabled}
        />
      )}
      {maxSubcategories === 1 ? (
        <Select
          label={subcategoryLabel}
          placeholder="Выберите подкатегорию"
          options={subcategoryOptions}
          value={value.subcategories[0] ?? ''}
          onChange={(subcategory) => changeSubcategories(subcategory ? [subcategory] : [])}
          error={subcategoryError}
          required={subcategoryRequired}
          disabled={disabled}
        />
      ) : (
        <MultiSelect
          label={subcategoryLabel}
          options={subcategoryOptions}
          value={value.subcategories}
          onChange={changeSubcategories}
          error={subcategoryError}
          required={subcategoryRequired}
          disabled={disabled}
          maxSelected={maxSubcategories}
        />
      )}
    </div>
  )
}
