import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiSelect } from '.'
import type { MultiSelectProps } from '.'

afterEach(cleanup)

const options = ['Рисование', 'Музыка', 'Танцы'] as const

function ControlledExample(props: Partial<MultiSelectProps> = {}) {
  const [value, setValue] = useState(props.value ?? [])
  return (
    <MultiSelect options={options} label="Навыки" {...props} value={value} onChange={setValue} />
  )
}

describe('MultiSelect', () => {
  it('selects and unselects options and displays the selection in the closed field', async () => {
    const user = userEvent.setup()
    render(<ControlledExample />)
    const trigger = screen.getByRole('button')
    expect(trigger).toHaveTextContent('Выберите варианты')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await user.click(screen.getByRole('checkbox', { name: 'Рисование' }))
    await user.click(screen.getByRole('checkbox', { name: 'Музыка' }))
    expect(trigger).toHaveTextContent('Рисование, Музыка')
    await user.click(screen.getByRole('checkbox', { name: 'Рисование' }))
    expect(screen.getByRole('checkbox', { name: 'Рисование' })).not.toBeChecked()
    await user.click(trigger)
    expect(trigger).toHaveTextContent('Музыка')
    await user.click(trigger)
    await user.click(screen.getByRole('checkbox', { name: 'Музыка' }))
    expect(trigger).toHaveTextContent('Выберите варианты')
  })

  it('returns new valid unique arrays without mutating frozen inputs', async () => {
    const user = userEvent.setup()
    const inputOptions = Object.freeze(['Рисование', 'Музыка', 'Музыка'])
    const inputValue = ['Рисование', 'Рисование', 'Неизвестный навык']
    Object.freeze(inputValue)
    const onChange = vi.fn()
    render(<MultiSelect options={inputOptions} value={inputValue} onChange={onChange} />)
    const trigger = screen.getByRole('button')
    expect(trigger).toHaveTextContent('Рисование')
    expect(trigger).not.toHaveTextContent('Неизвестный навык')
    expect(trigger.textContent?.match(/Рисование/g)).toHaveLength(1)
    await user.click(trigger)
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
    await user.click(screen.getByRole('checkbox', { name: 'Музыка' }))
    expect(onChange).toHaveBeenLastCalledWith(['Рисование', 'Музыка'])
    expect(onChange.mock.calls[0][0]).not.toBe(inputValue)
    await user.click(screen.getByRole('checkbox', { name: 'Рисование' }))
    expect(onChange).toHaveBeenLastCalledWith([])
    expect(inputValue).toEqual(['Рисование', 'Рисование', 'Неизвестный навык'])
    expect(inputOptions).toEqual(['Рисование', 'Музыка', 'Музыка'])
  })

  it('keeps selection controlled and reflects parent replacements and resets', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(<MultiSelect options={options} value={[]} onChange={onChange} />)
    const trigger = screen.getByRole('button')
    await user.click(trigger)
    await user.click(screen.getByRole('checkbox', { name: 'Музыка' }))
    expect(onChange).toHaveBeenCalledWith(['Музыка'])
    expect(screen.getByRole('checkbox', { name: 'Музыка' })).not.toBeChecked()
    expect(trigger).toHaveTextContent('Выберите варианты')
    onChange.mockClear()
    rerender(<MultiSelect options={options} value={['Танцы']} onChange={onChange} />)
    expect(screen.getByRole('checkbox', { name: 'Танцы' })).toBeChecked()
    expect(trigger).toHaveTextContent('Танцы')
    rerender(<MultiSelect options={options} value={[]} onChange={onChange} />)
    expect(screen.getByRole('checkbox', { name: 'Танцы' })).not.toBeChecked()
    expect(trigger).toHaveTextContent('Выберите варианты')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('filters values when options change without notifying the parent', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const value = ['Музыка']
    const { rerender } = render(<MultiSelect options={options} value={value} onChange={onChange} />)
    await user.click(screen.getByRole('button'))
    rerender(<MultiSelect options={['Танцы']} value={value} onChange={onChange} />)
    expect(screen.getByRole('button')).toHaveTextContent('Выберите варианты')
    expect(screen.queryByRole('checkbox', { name: 'Музыка' })).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
    expect(value).toEqual(['Музыка'])
  })

  it('limits additions but allows removal and then another selection', async () => {
    const user = userEvent.setup()
    render(<ControlledExample maxSelected={1} />)
    await user.click(screen.getByRole('button'))
    const drawing = screen.getByRole('checkbox', { name: 'Рисование' })
    const music = screen.getByRole('checkbox', { name: 'Музыка' })
    await user.click(drawing)
    expect(drawing).toBeEnabled()
    expect(music).toBeDisabled()
    await user.click(music)
    expect(music).not.toBeChecked()
    await user.click(drawing)
    expect(music).toBeEnabled()
    await user.click(music)
    expect(music).toBeChecked()
  })

  it('does not impose a limit when maxSelected is absent', async () => {
    const user = userEvent.setup()
    render(<ControlledExample />)
    await user.click(screen.getByRole('button'))
    for (const checkbox of screen.getAllByRole('checkbox')) {
      await user.click(checkbox)
      expect(checkbox).toBeChecked()
    }
    expect(screen.getByRole('button')).toHaveTextContent(options.join(', '))
  })

  it('blocks additions at zero and preserves parent values above a changed limit', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(
      <MultiSelect options={options} value={[]} onChange={onChange} maxSelected={0} />,
    )
    await user.click(screen.getByRole('button'))
    expect(
      screen.getAllByRole('checkbox').every((item) => (item as HTMLInputElement).disabled),
    ).toBe(true)
    rerender(
      <MultiSelect
        options={options}
        value={['Музыка', 'Танцы']}
        onChange={onChange}
        maxSelected={1}
      />,
    )
    expect(screen.getByRole('button')).toHaveTextContent('Музыка, Танцы')
    expect(onChange).not.toHaveBeenCalled()
    await user.click(screen.getByRole('checkbox', { name: 'Музыка' }))
    expect(onChange).toHaveBeenCalledWith(['Танцы'])
  })

  it('supports Enter and Space, tab navigation and Escape with focus restoration', async () => {
    const user = userEvent.setup()
    render(<ControlledExample />)
    const trigger = screen.getByRole('button')
    await user.tab()
    expect(trigger).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await user.tab()
    const drawing = screen.getByRole('checkbox', { name: 'Рисование' })
    expect(drawing).toHaveFocus()
    await user.keyboard(' ')
    expect(drawing).toBeChecked()
    await user.tab()
    expect(screen.getByRole('checkbox', { name: 'Музыка' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(drawing).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    await user.keyboard(' ')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{Escape}')
    expect(trigger).toHaveFocus()
  })

  it('disables opening and choice and closes an already open panel', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(
      <MultiSelect options={options} value={[]} onChange={onChange} disabled />,
    )
    const trigger = screen.getByRole('button')
    await user.click(trigger)
    expect(trigger).toBeDisabled()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    rerender(<MultiSelect options={options} value={[]} onChange={onChange} />)
    await user.click(trigger)
    const checkbox = screen.getByRole('checkbox', { name: 'Музыка' })
    rerender(<MultiSelect options={options} value={[]} onChange={onChange} disabled />)
    expect(checkbox).toBeDisabled()
    await user.click(checkbox)
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    rerender(<MultiSelect options={options} value={[]} onChange={onChange} />)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('creates unique ids and associates group names, labels and the controlled panels', async () => {
    const user = userEvent.setup()
    render(
      <>
        <ControlledExample />
        <ControlledExample label="Интересы" />
      </>,
    )
    const groups = screen.getAllByRole('group')
    expect(groups[0]).toHaveAccessibleName('Навыки')
    expect(groups[1]).toHaveAccessibleName('Интересы')
    const first = within(groups[0]).getByRole('button')
    const second = within(groups[1]).getByRole('button')
    expect(first.id).toBeTruthy()
    expect(first.id).not.toBe(second.id)
    await user.click(within(groups[1]).getByText('Интересы'))
    expect(second).toHaveFocus()
    expect(second).toHaveAttribute('aria-expanded', 'true')
    await user.click(first)
    const ids = groups.flatMap((group) =>
      within(group)
        .getAllByRole('checkbox')
        .map((item) => item.id),
    )
    expect(new Set(ids).size).toBe(ids.length)
    expect(document.getElementById(first.getAttribute('aria-controls')!)).toContainElement(
      within(groups[0]).getByLabelText('Музыка'),
    )
  })

  it('connects the required description and external error to the group and its controls', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(
      <MultiSelect
        label="Навыки"
        options={options}
        value={[]}
        onChange={onChange}
        required
        error="Выберите навык"
      />,
    )
    const trigger = screen.getByRole('button')
    await user.click(trigger)
    for (const control of [
      screen.getByRole('group'),
      trigger,
      ...screen.getAllByRole('checkbox'),
    ]) {
      expect(control).toHaveAttribute('aria-invalid', 'true')
      expect(control).toHaveAccessibleDescription(
        'Обязательное поле: выберите хотя бы один вариант Выберите навык',
      )
    }
    await user.click(screen.getByRole('checkbox', { name: 'Музыка' }))
    expect(screen.getByText('Выберите навык')).toBeInTheDocument()
    rerender(
      <MultiSelect label="Навыки" options={options} value={[]} onChange={onChange} error=" " />,
    )
    expect(screen.queryByText('Выберите навык')).not.toBeInTheDocument()
    expect(trigger).not.toHaveAttribute('aria-invalid')
    expect(trigger).not.toHaveAttribute('aria-describedby')
  })

  it('leaves required validation to the parent and never submits through the trigger', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    function FormExample() {
      const [value, setValue] = useState<string[]>([])
      const [error, setError] = useState('')
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!value.length) setError('Выберите навык')
            else onSubmit(value)
          }}
        >
          <MultiSelect options={options} value={value} onChange={setValue} required error={error} />
          <button type="submit">Отправить</button>
        </form>
      )
    }
    render(<FormExample />)
    const trigger = screen.getByRole('button', { name: /Выбор вариантов/ })
    expect(trigger).toHaveAttribute('type', 'button')
    await user.click(trigger)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.queryByText('Выберите навык')).not.toBeInTheDocument()
    for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox).not.toBeRequired()
    await user.click(screen.getByRole('button', { name: 'Отправить' }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Выберите навык')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Музыка' }))
    await user.click(screen.getByRole('button', { name: 'Отправить' }))
    expect(onSubmit).toHaveBeenCalledWith(['Музыка'])
  })

  it('shows an understandable empty message and handles Escape without checkboxes', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={[]} value={['Неизвестный навык']} onChange={vi.fn()} />)
    const trigger = screen.getByRole('button')
    expect(trigger).toHaveTextContent('Выберите варианты')
    await user.click(trigger)
    expect(screen.getByText('Нет доступных вариантов')).toBeVisible()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})
