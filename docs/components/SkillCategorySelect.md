## SkillCategorySelect

Связанный выбор категорий и подкатегорий навыка из справочника `src/shared/lib/constants.ts`. Состоит из двух полей на базе готовых `Select` и `MultiSelect`: «Категория» и «Подкатегория».

### Props

```ts
interface SkillCategorySelectValue {
  categories: string[]
  subcategories: string[]
}

interface SkillCategorySelectProps {
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
```

- `categoryMode` - `single`: категория выбирается через `Select`, в `categories` не больше одного значения; `multiple`: через `MultiSelect`.
- `value` / `onChange` - значение хранит родитель. Каждое действие передаёт в `onChange` новое согласованное значение одним вызовом; исходный объект не изменяется.
- `categoryLabel`, `subcategoryLabel` - подписи полей. По умолчанию «Категория» и «Подкатегория».
- `categoryError`, `subcategoryError` - ошибки полей, показываются под своим полем.
- `categoryRequired`, `subcategoryRequired` - обязательность каждого поля. Проверку выполняет форма.
- `disabled` - блокирует оба поля.
- `maxSubcategories` - лимит подкатегорий. При `1` подкатегория выбирается через `Select`, иначе через `MultiSelect` с `maxSelected`. Без него лимита нет.

### Как работает связь полей

- Без выбранных категорий доступны все подкатегории. При выбранных - подкатегории этих категорий в порядке справочника, без повторов.
- Выбор подкатегории автоматически выбирает её категорию: в `multiple` прежние категории сохраняются, в `single` остаётся одна категория.
- Снятие категории в `multiple` удаляет только её подкатегории. Замена или очистка категории в `single` удаляет несовместимые подкатегории.
- Снятие подкатегории категорию не удаляет.
- Неизвестные значения не заменяются первым вариантом. Компонент не вызывает `onChange` сам при монтировании; несовместимое внешнее значение проверяет родитель.

### Как подключить

```tsx
import { useState } from 'react'
import { SkillCategorySelect } from '@/shared/ui/SkillCategorySelect'
import type { SkillCategorySelectValue } from '@/shared/ui/SkillCategorySelect'

// Обычный навык: одна категория, до пяти подкатегорий
export function SkillCategoryField() {
  const [value, setValue] = useState<SkillCategorySelectValue>({
    categories: [],
    subcategories: [],
  })

  return (
    <SkillCategorySelect
      categoryMode="single"
      maxSubcategories={5}
      value={value}
      onChange={setValue}
      categoryRequired
      subcategoryRequired
    />
  )
}
```

Для teach при регистрации - `categoryMode="single"` и `maxSubcategories={1}`; для интересов - `categoryMode="multiple"` без `maxSubcategories`.
