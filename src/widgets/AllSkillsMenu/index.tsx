import { useEffect, useId, useRef, useState } from 'react'
import { SKILL_CATEGORY_CATALOGUE } from '@/shared/lib/constants'
import styles from './AllSkillsMenu.module.css'
import chevronDown from '@/shared/assets/chevron-down.svg'

type AllSkillsMenuProps = {
  placement?: 'top' | 'bottom'
}

export const AllSkillsMenu = ({ placement = 'bottom' }: AllSkillsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className={styles.container} data-placement={placement} ref={containerRef}>
      <button
        ref={buttonRef}
        className={styles.trigger}
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((previous) => !previous)}
      >
        <span>Все навыки</span>
        <span className={styles.arrow} aria-hidden="true">
          <img src={chevronDown} alt="" width={16} height={8} />
        </span>
      </button>

      {isOpen && (
        <div className={styles.menu} id={menuId} aria-label="Категории и подкатегории навыков">
          {SKILL_CATEGORY_CATALOGUE.map((category) => (
            <section className={styles.category} key={category.name}>
              <h2 className={styles.categoryTitle}>{category.name}</h2>

              <ul className={styles.subcategoryList}>
                {category.subcategories.map((subcategory) => (
                  <li className={styles.subcategory} key={subcategory}>
                    {subcategory}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
