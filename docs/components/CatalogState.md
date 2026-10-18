## CatalogState

### Props

`state:	'loading' | 'error' | 'empty'`	-	Какое состояние сейчас активно: loading — идёт загрузка, error — запрос упал, empty — данных нет. Решение принимает родитель

`onRetry:	() => void`	да	Обработчик нажатия кнопки «Повторить». Кнопка отрисовывается только в состоянии error

`messages:	Partial<Record<'loading' | 'error' | 'empty', string>>`	Кастомные тексты для состояний. Не заданные ключи берутся из дефолтных сообщений.

`retryLabel:	string`	-	Текст на кнопке «Повторить». По умолчанию — «Повторить»

`icon:	ReactNode`	-	Слот для спиннера или иллюстрации над сообщением. Помечен aria-hidden, скринридер его не озвучивает.

`className:	string` - Дополнительный класс на корневой элемент, чтобы растянуть или сузить блок снаружи.

### Как подключить

```tsx
import { CatalogState, type CatalogStateName } from '@/widgets/CatalogState';

function CatalogPage() {
  const { data, isLoading, error, refetch } = useCatalog();

  // Родитель сам решает, какое состояние активно
  const view: CatalogStateName | null =
    isLoading ? 'loading'
    : error ? 'error'
    : data.length === 0 ? 'empty'
    : null;

  if (view) {
    return <CatalogState state={view} onRetry={refetch} />;
  }

  return <ResultsList items={data} />;
}
```
