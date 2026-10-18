## SkillGallery

Галерея изображений навыка на базе `Swiper`: показывает одно основное изображение и переключает его стрелками вперёд/назад.

### Props

- `images: SkillGalleryImage[]` — список изображений. Каждый элемент имеет тип `{ src: string; alt: string }`, где `src` — адрес картинки, `alt` — альтернативный текст.
- `loop?: boolean` — зацикливает переключение (после последнего слайда идёт первый и наоборот). По умолчанию `false`.

`SkillGalleryImage` экспортируется из модуля компонента:

```ts
export type SkillGalleryImage = {
  src: string
  alt: string
}
```

Если `images` пустой или не передан, компонент возвращает `null` и не рендерит ничего.

Стрелки — нативные кнопки с `aria-label` («Предыдущее изображение» и «Следующее изображение»), навигация подключается через модуль `Navigation` из `Swiper`. Компонент не хранит состояние и не управляет выбором изображения — он только отображает переданный список.

### Как подключить

```tsx
import { SkillGallery } from '@/entities/skill/ui/SkillGallery'

const images = [
  { src: '/images/skill-1.jpg', alt: 'Работа ученика' },
  { src: '/images/skill-2.jpg', alt: 'Процесс обучения' },
  { src: '/images/skill-3.jpg', alt: 'Готовый результат' },
]

export function SkillImages() {
  return <SkillGallery images={images} loop />
}
```

Без `loop` после последнего слайда кнопка «вперёд» перестаёт переключать изображение. Стили слайдов, размеры изображений и вид стрелок настраиваются в `SkillGallery.module.css`.
