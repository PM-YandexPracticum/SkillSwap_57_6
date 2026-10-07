## Pagination

### Props

Все четыре props обязательны:

- `currentPage: number` — текущая страница; нумерация начинается с `1`.
- `totalItems: number` — общее количество элементов.
- `pageSize: number` — количество элементов на одной странице; положительное целое число.
- `onPageChange: (page: number) => void` — callback, которому компонент передаёт номер выбранной страницы.

`Pagination` — контролируемый компонент: состояние текущей страницы хранит родитель. Количество страниц компонент вычисляет самостоятельно: `Math.ceil(totalItems / pageSize)`. Данные не загружает. При одной странице или отсутствии элементов ничего не отображается.

### Как подключить

```tsx
import { useState } from 'react'
import Pagination from '@/shared/ui/Pagination'

export function PaginationExample() {
  const [currentPage, setCurrentPage] = useState(1)

  return (
    <Pagination
      currentPage={currentPage}
      totalItems={25}
      pageSize={9}
      onPageChange={setCurrentPage}
    />
  )
}
```
