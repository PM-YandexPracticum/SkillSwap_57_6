import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SkillGallery } from '.'

afterEach(cleanup)

describe('SkillGallery', () => {
  it('renders a placeholder instead of null when images are empty', () => {
    const { container } = render(<SkillGallery images={[]} />)

    expect(container.querySelector('div[class*="placeholder"]')).not.toBeNull()
    expect(container.querySelector('img')).toBeNull()
  })

  it('replaces a broken image with a placeholder and removes the broken <img>', () => {
    render(<SkillGallery images={[{ src: '/missing.jpg', alt: 'Фото' }]} />)

    const image = screen.getByRole('img', { name: 'Фото' })
    expect(image.tagName).toBe('IMG')

    fireEvent.error(image)

    const placeholder = screen.getByRole('img', { name: 'Фото' })
    expect(placeholder.tagName).toBe('DIV')
    expect(placeholder.className).toContain('placeholder')
    expect(document.querySelector('img[src="/missing.jpg"]')).toBeNull()
  })

  it('tries to load a new src after a previous one failed', () => {
    const { rerender } = render(<SkillGallery images={[{ src: '/bad.jpg', alt: 'Фото' }]} />)

    fireEvent.error(screen.getByRole('img', { name: 'Фото' }))

    rerender(<SkillGallery images={[{ src: '/good.jpg', alt: 'Фото' }]} />)

    expect(document.querySelector('img[src="/good.jpg"]')).not.toBeNull()
  })
})
