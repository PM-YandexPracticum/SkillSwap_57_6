## Select

Переиспользуемый нативный select для одиночного выбора с подписью и ошибкой.

### Props

`SelectProps` поддерживает стандартные атрибуты `SelectHTMLAttributes<HTMLSelectElement>`, включая `name`, `id`, `onBlur`, `required`, `disabled` и ARIA-атрибуты. `className` применяется к select. `multiple`, `size`, `children` и `defaultValue` исключены: компонент предназначен для контролируемого одиночного выбора.

- `options: readonly string[]` — значения вариантов. Используйте уникальные строки; пустая строка зарезервирована для placeholder.
- `value: string` — текущее значение из родителя.
- `onChange: (value: string) => void` — получает строку выбранного значения, при очистке — `''`.
- `label?: string` — подпись, связанная с полем. Без неё передайте `aria-label` или `aria-labelledby`.
- `placeholder?: string` — текст пустого варианта, по умолчанию «Выберите вариант». Он доступен для повторного выбора и очистки поля.
- `error?: string` — непустой текст включает оформление ошибки и `aria-invalid`.
- `getOptionLabel?: (value: string) => string` — меняет только отображаемую подпись варианта. Значение option и аргумент `onChange` остаются исходной строкой.

Без `id` компонент генерирует уникальный идентификатор через `useId`. Ошибка связана с полем через `aria-describedby`; переданные родителем идентификаторы сохраняются.

Пустое или отсутствующее в `options` значение показывает placeholder, без автоматического выбора первого варианта и вызова `onChange`. Значение родителя не изменяется. Это также действует при обновлении списка вариантов.

Компонент не хранит значение и не выполняет собственную валидацию. `required` использует стандартную HTML-валидацию: пустой вариант невалиден, непустой — валиден. `error` задаёт родитель. `disabled` сохраняет нативное поведение браузера.

### Как подключить

```tsx
import { useRef, useState } from 'react'
import { Select } from '@/shared/ui/Select'

const genders = ['female', 'male'] as const

export function FormExample() {
  const [gender, setGender] = useState('')
  const selectRef = useRef<HTMLSelectElement>(null)

  return (
    <Select
      ref={selectRef}
      name="gender"
      label="Пол"
      placeholder="Выберите пол"
      options={genders}
      value={gender}
      onChange={setGender}
      getOptionLabel={(value) => (value === 'female' ? 'Женский' : 'Мужской')}
      required
    />
  )
}
```

Ref указывает на настоящий `HTMLSelectElement`, например для вызова `.focus()`. `onBlur` получает стандартное событие select. Для показа ошибки передайте `error="Выберите вариант"`.
