## FiltersBar

### Props

Все четыре props обязательны:

- `selectedType: SkillTypeFilter` — текущий выбранный тип навыка: `'all'`, `'teach'` или `'learn'`.
- `selectedCategory: SkillCategoryFilter` — текущая выбранная категория: `'all'` либо одна из категорий `SKILL_CATEGORIES`.
- `onTypeChange: (type: SkillTypeFilter) => void` — вызывается при выборе другого типа и сообщает новое значение родителю.
- `onCategoryChange: (category: SkillCategoryFilter) => void` — вызывается при выборе другой категории и сообщает новое значение родителю.

`FiltersBar` — контролируемый компонент: выбранные значения хранит родитель, а не сам компонент. Начальные значения обычно `'all'` — «Все» и «Все категории». Компонент сам не загружает и не фильтрует данные.

### Как подключить

```tsx
import { useState } from 'react'
import FiltersBar from '@/widgets/FiltersBar'
import type {
  SkillTypeFilter,
  SkillCategoryFilter,
} from '@/widgets/FiltersBar'

export function FiltersExample() {
  const [selectedType, setSelectedType] =
    useState<SkillTypeFilter>('all')

  const [selectedCategory, setSelectedCategory] =
    useState<SkillCategoryFilter>('all')

  return (
    <FiltersBar
      selectedType={selectedType}
      selectedCategory={selectedCategory}
      onTypeChange={setSelectedType}
      onCategoryChange={setSelectedCategory}
    />
  )
}
```
