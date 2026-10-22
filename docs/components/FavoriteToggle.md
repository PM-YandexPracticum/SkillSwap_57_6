## FavoriteToggle

Кнопка избранного для карточки навыка: сердце и актуальный счётчик лайков. Работает с моделью `favorites` текущего владельца списка (гость или аккаунт).

### Props

- `skillId: string` - ID навыка, который добавляется в избранное или убирается из него.

Состояние берётся из Redux: `selectIsFavorite(skillId)` закрашивает сердце, а число - это `likesCount` автора навыка из общих данных каталога (`selectCatalogData`). Все кнопки с одинаковым `skillId` показывают одно и то же состояние.

Клик вызывает `addFavoriteThunk` или `removeFavoriteThunk`. Если thunk вернул `false`, под кнопкой появляется сообщение «Не удалось обновить избранное», а прежнее состояние сохраняется.

Кнопка имеет `type="button"`, название «В избранное» и `aria-pressed`. Она располагается вне ссылок карточки, поэтому клик не открывает подробности.

### Как подключить

```tsx
import { FavoriteToggle } from '@/features/favorites/ui/FavoriteToggle'

;<UserCardsGrid
  items={items}
  renderAction={({ skills }) => {
    const teach = skills.find((skill) => skill.type === 'teach')
    return teach ? <FavoriteToggle skillId={teach.id} /> : null
  }}
/>
```

`CatalogSection` и `CatalogResults` принимают такой же необязательный `renderAction` и передают его в `UserCardsGrid`. Без него в карточках остаётся декоративное сердце.
