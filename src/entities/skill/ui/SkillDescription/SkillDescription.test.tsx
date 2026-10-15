import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SkillDescription } from './index'

const defaultProps = {
  title: 'Игра на барабанах',
  category: 'Творчество и искусство',
  tags: ['Музыка', 'Барабаны'],
  description: 'Освоим базовые ритмы.',
  onExchange: vi.fn(),
}

describe('SkillDescription', () => {
  it('renders the skill details and categories in the provided order', () => {
    render(<SkillDescription {...defaultProps} />)

    expect(screen.getByRole('heading', { level: 1, name: defaultProps.title })).toBeInTheDocument()
    expect(screen.getByText(defaultProps.category)).toBeInTheDocument()
    expect(screen.getByText('Музыка')).toBeInTheDocument()
    expect(screen.getByText('Барабаны')).toBeInTheDocument()
    expect(screen.getByText(defaultProps.description)).toBeInTheDocument()

    const categories = screen.getByText(defaultProps.category).parentElement
    expect(categories?.textContent).toBe('Творчество и искусствоМузыкаБарабаны')
  })

  it('renders no tag separator when tags are empty', () => {
    const { container } = render(<SkillDescription {...defaultProps} tags={[]} description="" />)

    expect(screen.getByText(defaultProps.category).parentElement).toHaveTextContent(
      defaultProps.category,
    )
    expect(screen.getByText(defaultProps.category).parentElement).not.toHaveTextContent('/')
    expect(container.querySelectorAll('p')[1]).toBeEmptyDOMElement()
    expect(screen.getByRole('button', { name: 'Предложить обмен' })).toBeEnabled()
  })

  it('renders an empty gallery when the skill has no photos', () => {
    render(<SkillDescription {...defaultProps} />)

    expect(screen.getByText('Фотографий пока нет')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Следующее фото' })).not.toBeInTheDocument()
  })

  it('changes the active photo using the arrows and thumbnails', () => {
    const images = ['/photo-1.jpg', '/photo-2.jpg', '/photo-3.jpg', '/photo-4.jpg', '/photo-5.jpg']
    render(<SkillDescription {...defaultProps} images={images} />)

    expect(screen.getByRole('img', { name: 'Игра на барабанах: фото 1' })).toHaveAttribute(
      'src',
      images[0],
    )

    fireEvent.click(screen.getByRole('button', { name: 'Следующее фото' }))
    expect(screen.getByRole('img', { name: 'Игра на барабанах: фото 2' })).toHaveAttribute(
      'src',
      images[1],
    )

    fireEvent.click(screen.getByRole('button', { name: 'Показать фото 4' }))
    expect(screen.getByRole('img', { name: 'Игра на барабанах: фото 4' })).toHaveAttribute(
      'src',
      images[3],
    )
  })

  it('shows a faded overflow thumbnail and lets it reveal hidden photos', () => {
    const images = ['/photo-1.jpg', '/photo-2.jpg', '/photo-3.jpg', '/photo-4.jpg', '/photo-5.jpg']
    render(<SkillDescription {...defaultProps} images={images} />)

    fireEvent.click(screen.getByRole('button', { name: 'Показать еще 2 фото' }))

    expect(screen.getByRole('img', { name: 'Игра на барабанах: фото 4' })).toHaveAttribute(
      'src',
      images[3],
    )
  })

  it('renders long text as text and allows wrapping through its content classes', () => {
    const longWord = '<script>alert(1)</script>' + 'a'.repeat(200)
    const { container } = render(
      <SkillDescription
        {...defaultProps}
        title={longWord}
        tags={[longWord]}
        description={`Первая строка\n${longWord}`}
      />,
    )

    const description = container.querySelectorAll('p')[1]
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(longWord)
    expect(description?.textContent).toBe(`Первая строка\n${longWord}`)
  })

  it.each([
    ['disabled', { disabled: true }],
    ['pending', { isPending: true }],
  ])('disables exchange while %s without calling the handler', (_, state) => {
    const onExchange = vi.fn()
    render(<SkillDescription {...defaultProps} {...state} onExchange={onExchange} />)

    const button = screen.getByRole('button', { name: 'Предложить обмен' })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onExchange).not.toHaveBeenCalled()
  })

  it('calls the exchange handler when clicked', () => {
    const onExchange = vi.fn()
    render(<SkillDescription {...defaultProps} onExchange={onExchange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Предложить обмен' }))

    expect(onExchange).toHaveBeenCalledOnce()
  })
})
