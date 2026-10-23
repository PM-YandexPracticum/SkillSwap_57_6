import { useId } from 'react'
import { SKILL_CATEGORIES } from '@/shared/lib/constants'
import {
  getAllSubcategories,
  getSubcategories,
  isSubcategoryOfCategory,
} from '@/shared/lib/skillCategories'
import { Select } from '@/shared/ui/Select'
import type { SkillType } from '@/shared/types'
import styles from './FiltersBar.module.css'

export type SkillTypeFilter = SkillType | 'all'
export type SkillCategoryFilter = (typeof SKILL_CATEGORIES)[number] | 'all'

export interface FiltersBarProps {
  selectedType: SkillTypeFilter
  selectedCategory: SkillCategoryFilter
  onTypeChange: (type: SkillTypeFilter) => void
  onCategoryChange: (category: SkillCategoryFilter) => void
  selectedSubcategory?: string
  onSubcategoryChange?: (subcategory: string) => void
}

const TYPE_OPTIONS: { value: SkillTypeFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'teach', label: 'Могу научить' },
  { value: 'learn', label: 'Хочу научиться' },
]

export default function FiltersBar({
  selectedType,
  selectedCategory,
  onTypeChange,
  onCategoryChange,
  selectedSubcategory,
  onSubcategoryChange,
}: FiltersBarProps) {
  const groupId = useId()
  const subcategoryOptions =
    selectedCategory === 'all' ? getAllSubcategories() : getSubcategories(selectedCategory)

  const handleCategoryChange = (category: SkillCategoryFilter) => {
    onCategoryChange(category)
    if (
      selectedSubcategory &&
      category !== 'all' &&
      !isSubcategoryOfCategory(category, selectedSubcategory)
    ) {
      onSubcategoryChange?.('')
    }
  }

  return (
    <section className={styles.panel} aria-label="Фильтры навыков">
      <fieldset className={styles.typeGroup}>
        <legend className={styles.typeLegend}>Тип навыка</legend>
        <div className={styles.options}>
          {TYPE_OPTIONS.map(({ value, label }) => (
            <label key={value} className={styles.option}>
              <input
                className={styles.radio}
                type="radio"
                name={`skill-type-${groupId}`}
                value={value}
                checked={selectedType === value}
                onChange={() => onTypeChange(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className={styles.category}>
        <span className={styles.heading}>Категория</span>
        <select
          className={styles.select}
          value={selectedCategory}
          onChange={(event) => handleCategoryChange(event.target.value as SkillCategoryFilter)}
        >
          <option value="all">Все категории</option>
          {SKILL_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      {selectedSubcategory !== undefined && onSubcategoryChange && (
        <Select
          label="Подкатегория"
          placeholder="Все подкатегории"
          options={subcategoryOptions}
          value={selectedSubcategory}
          onChange={onSubcategoryChange}
        />
      )}
    </section>
  )
}
