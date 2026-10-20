import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DatePicker } from '.'
import userEvent from '@testing-library/user-event'

describe('DatePicker', () => {
  it('displays the date passed via value', () => {
    const date = new Date(2026, 9, 20)

    render(<DatePicker label="Дата рождения" value={date} onChange={vi.fn()} />)

    const input = screen.getByRole('textbox', {
      name: 'Дата рождения',
    })

    expect(input).toHaveValue('20.10.2026')
  })

  it('updates the displayed date when the value prop changes', () => {
    const onChange = vi.fn()

    const { rerender } = render(
      <DatePicker label="Дата рождения" value={new Date(2026, 9, 20)} onChange={onChange} />,
    )

    const input = screen.getByRole('textbox', {
      name: 'Дата рождения',
    })

    expect(input).toHaveValue('20.10.2026')

    rerender(
      <DatePicker label="Дата рождения" value={new Date(2026, 10, 15)} onChange={onChange} />,
    )

    expect(input).toHaveValue('15.11.2026')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('clears the selected date when the input is cleared and confirmed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<DatePicker label="Дата рождения" value={new Date(2026, 9, 20)} onChange={onChange} />)

    const input = screen.getByRole('textbox', {
      name: 'Дата рождения',
    })

    await user.clear(input)
    await user.click(input)

    await user.click(
      screen.getByRole('button', {
        name: 'Выбрать',
      }),
    )

    expect(onChange).toHaveBeenCalledWith(null)
    expect(input).toHaveValue('')
  })

  it('confirms the selected date only after clicking the confirm button', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<DatePicker label="Дата рождения" value={new Date(2026, 9, 20)} onChange={onChange} />)

    await user.click(screen.getByRole('textbox', { name: 'Дата рождения' }))

    const day = screen.getByRole('gridcell', {
      name: 'Choose среда, 21 октября 2026 г.',
    })

    await user.click(day)

    expect(onChange).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Выбрать' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 9, 21))
  })

  it('disables dates outside the minDate and maxDate range', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <DatePicker
        label="Дата рождения"
        value={new Date(2026, 9, 20)}
        onChange={onChange}
        minDate={new Date(2026, 9, 15)}
        maxDate={new Date(2026, 9, 25)}
      />,
    )

    await user.click(screen.getByRole('textbox', { name: 'Дата рождения' }))

    const beforeMinDate = screen.getByRole('gridcell', {
      name: 'Not available среда, 14 октября 2026 г.',
    })

    const withinRange = screen.getByRole('gridcell', {
      name: 'Choose среда, 21 октября 2026 г.',
    })

    const afterMaxDate = screen.getByRole('gridcell', {
      name: 'Not available понедельник, 26 октября 2026 г.',
    })

    expect(beforeMinDate).toHaveAttribute('aria-disabled', 'true')
    expect(withinRange).toHaveAttribute('aria-disabled', 'false')
    expect(afterMaxDate).toHaveAttribute('aria-disabled', 'true')

    await user.click(beforeMinDate)

    expect(onChange).not.toHaveBeenCalled()
  })

  it('cancels the selected date without calling onChange', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<DatePicker label="Дата рождения" value={new Date(2026, 9, 20)} onChange={onChange} />)

    const input = screen.getByRole('textbox', {
      name: 'Дата рождения',
    })

    await user.click(input)

    await user.click(
      screen.getByRole('gridcell', {
        name: 'Choose среда, 21 октября 2026 г.',
      }),
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Отменить',
      }),
    )

    expect(onChange).not.toHaveBeenCalled()
    expect(input).toHaveValue('20.10.2026')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
