## FormInput

Переиспользуемое поле формы с подписью, подсказкой, ошибкой и элементом справа.

### Props

`FormInputProps` расширяет `InputHTMLAttributes<HTMLInputElement>`: поддерживает стандартные атрибуты `name`, `type`, `value`, `defaultValue`, `onChange`, `onBlur`, `disabled`, `required`, `autoComplete`, `placeholder`, `id` и ARIA-атрибуты. `className` применяется к input.

- `label?: string` — подпись, связанная с полем. Без неё передайте `aria-label` или `aria-labelledby`.
- `hint?: string` — подсказка под полем.
- `error?: string` — сообщение об ошибке; непустой текст включает `aria-invalid` и оформление ошибки.
- `endAdornment?: ReactNode` — иконка или интерактивный элемент справа от input. Кнопке нужны `type="button"` и доступная подпись; её `disabled` задаёт родитель.

Без `id` компонент генерирует уникальный идентификатор. Подсказка и ошибка связаны с полем через `aria-describedby`; переданные родителем идентификаторы сохраняются.

Компонент не хранит значение и не выполняет собственную валидацию: форму, правила и `error` контролирует родитель. Для controlled-поля передайте `value` и `onChange`, для uncontrolled — `defaultValue`. `onChange` получает стандартное событие input. HTML-атрибуты вроде `required` сохраняют нативное поведение браузера.

### Как подключить

```tsx
import { useRef, useState } from 'react'
import { FormInput } from '@/shared/ui/FormInput'

export function FormExample() {
  const [email, setEmail] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <FormInput
      ref={inputRef}
      name="email"
      type="email"
      label="Электронная почта"
      placeholder="mail@example.com"
      autoComplete="email"
      value={email}
      onChange={(event) => setEmail(event.target.value)}
      hint="Укажите адрес для связи"
      endAdornment={
        <button type="button" onClick={() => inputRef.current?.focus()}>
          Фокус
        </button>
      }
    />
  )
}
```

Ref указывает на настоящий `HTMLInputElement`, например для вызова `.focus()`. Для показа результата валидации передайте `error="Проверьте адрес почты"`. Переключение видимости пароля относится к отдельному PasswordInput и здесь не реализовано.
