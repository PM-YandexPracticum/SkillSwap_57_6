import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
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

  it('blocks typing and opening the calendar through the input or icon when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onValidationChange = vi.fn()
    const { container } = render(
      <DatePicker
        label="Дата"
        value={new Date(2026, 9, 20)}
        onChange={onChange}
        onValidationChange={onValidationChange}
        disabled
      />,
    )
    const input = screen.getByRole('textbox', { name: 'Дата' })

    expect(input).toBeDisabled()
    await user.type(input, '15.10.2026')
    await user.click(input)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(container.querySelector('.react-datepicker__calendar-icon')!)

    expect(input).toHaveValue('20.10.2026')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
    expect(onValidationChange).not.toHaveBeenCalled()
  })

  it('clears a valid displayed date when the parent sets value to null', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <DatePicker label="Дата" value={new Date(2026, 9, 20)} onChange={onChange} />,
    )
    const input = screen.getByRole('textbox', { name: 'Дата' })
    expect(input).toHaveValue('20.10.2026')

    rerender(<DatePicker label="Дата" value={null} onChange={onChange} />)

    expect(input).toHaveValue('')
    expect(onChange).not.toHaveBeenCalled()
  })

  it.each([
    ['minDate', 'Choose четверг, 15 октября 2026 г.', new Date(2026, 9, 15)],
    ['maxDate', 'Choose воскресенье, 25 октября 2026 г.', new Date(2026, 9, 25)],
  ] as const)(
    'selects and confirms the inclusive %s boundary',
    async (_boundary, name, expected) => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(
        <DatePicker
          label="Дата"
          value={new Date(2026, 9, 20)}
          onChange={onChange}
          minDate={new Date(2026, 9, 15)}
          maxDate={new Date(2026, 9, 25)}
        />,
      )
      await user.click(screen.getByRole('textbox', { name: 'Дата' }))
      const day = screen.getByRole('gridcell', { name })
      expect(day).toHaveAttribute('aria-disabled', 'false')

      await user.click(day)
      expect(onChange).not.toHaveBeenCalled()
      await user.click(screen.getByRole('button', { name: 'Выбрать' }))

      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith(expected)
    },
  )

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

describe('DatePicker manual validation', () => {
  const initialDate = new Date(2024, 0, 20)
  const setup = (extra = {}) => {
    const props = {
      label: 'Дата',
      value: initialDate,
      onChange: vi.fn(),
      onValidationChange: vi.fn(),
      ...extra,
    }
    return { ...render(<DatePicker {...props} />), props, input: screen.getByRole('textbox') }
  }

  it.each(['31.02.2024', '29.02.2023', '31.13.2024', '01.01.0000', '29.02.', '1.2.2024'])(
    'preserves invalid text %s and reports it on blur without replacing the date',
    (text) => {
      const { input, props } = setup({ error: 'Внешняя ошибка' })
      fireEvent.change(input, { target: { value: text } })
      expect(props.onValidationChange).not.toHaveBeenCalled()
      fireEvent.blur(input)
      expect(input).toHaveValue(text)
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByRole('alert')).not.toHaveTextContent('Внешняя ошибка')
      expect(props.onValidationChange).toHaveBeenLastCalledWith(expect.any(String))
      expect(props.onChange).not.toHaveBeenCalled()
    },
  )

  it.each(['14.01.2024', '26.01.2024'])('rejects out-of-range input %s', (text) => {
    const { input, props } = setup({
      minDate: new Date(2024, 0, 15),
      maxDate: new Date(2024, 0, 25),
    })
    fireEvent.change(input, { target: { value: text } })
    fireEvent.blur(input)
    expect(props.onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('диапазон')
  })

  it.each(['15.01.2024', '25.01.2024', '29.02.2024'])(
    'immediately accepts %s, including boundary days regardless of time',
    (text) => {
      const { input, props } = setup({
        minDate: new Date(2024, 0, 15, 18),
        maxDate: new Date(2024, 1, 29, 18),
      })
      fireEvent.change(input, { target: { value: text } })
      const [day, month, year] = text.split('.').map(Number)
      expect(props.onChange).toHaveBeenLastCalledWith(new Date(year, month - 1, day))
      expect(props.onValidationChange).toHaveBeenLastCalledWith(null)
    },
  )

  it('clears errors immediately on correction and empty input', () => {
    const { input, props } = setup()
    fireEvent.change(input, { target: { value: '31.02.2024' } })
    fireEvent.blur(input)
    fireEvent.change(input, { target: { value: '29.02.2024' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(props.onChange).toHaveBeenLastCalledWith(new Date(2024, 1, 29))
    fireEvent.change(input, { target: { value: '' } })
    expect(props.onChange).toHaveBeenLastCalledWith(null)
    expect(props.onValidationChange).toHaveBeenLastCalledWith(null)
  })

  it('preserves errors when callback identity changes and clears them on external reset', () => {
    const { input, props, rerender } = setup()
    fireEvent.change(input, { target: { value: '31.02.2024' } })
    fireEvent.blur(input)
    const callback = vi.fn()
    rerender(<DatePicker {...props} value={new Date(2024, 0, 20)} onValidationChange={callback} />)
    expect(input).toHaveValue('31.02.2024')
    expect(callback).not.toHaveBeenCalled()
    rerender(<DatePicker {...props} value={null} onValidationChange={callback} />)
    expect(input).toHaveValue('')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(callback).toHaveBeenLastCalledWith(null)
  })

  it('does not replace invalid text with the calendar preselection on Enter', async () => {
    const { input, props } = setup()
    await userEvent.click(input)
    fireEvent.change(input, { target: { value: '31.02.2024' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
    expect(props.onChange).not.toHaveBeenCalled()
    expect(input).toHaveValue('31.02.2024')
    expect(screen.getByText('Такой даты не существует')).toBeInTheDocument()
  })

  it('keeps invalid text after clicking outside and allows calendar correction', async () => {
    const { input, props } = setup()
    await userEvent.click(input)
    fireEvent.change(input, { target: { value: '31.02.2024' } })
    await userEvent.click(document.body)
    expect(input).toHaveValue('31.02.2024')
    expect(props.onChange).not.toHaveBeenCalled()
    await userEvent.click(input)
    await userEvent.click(
      screen.getByRole('gridcell', { name: 'Choose воскресенье, 21 января 2024 г.' }),
    )
    expect(input).toHaveValue('21.01.2024')
    expect(screen.queryByText('Такой даты не существует')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Выбрать' }))
    expect(props.onChange).toHaveBeenLastCalledWith(new Date(2024, 0, 21))
  })

  it('clears an invalid entry when the already selected calendar day is chosen', async () => {
    const { input, props } = setup()
    await userEvent.click(input)
    fireEvent.change(input, { target: { value: '31.02.2024' } })
    await userEvent.click(
      screen.getByRole('gridcell', { name: 'Choose суббота, 20 января 2024 г.' }),
    )
    expect(input).toHaveValue('20.01.2024')
    expect(props.onValidationChange).toHaveBeenLastCalledWith(null)
  })

  it('blocks continuation with an old valid value and an inline validation callback', () => {
    function Form() {
      const [error, setError] = useState<string | null>(null)
      return (
        <>
          <DatePicker
            label="Дата"
            value={new Date(2024, 0, 20)}
            onChange={vi.fn()}
            onValidationChange={(message) => setError(message)}
          />
          <button disabled={!!error}>Далее</button>
        </>
      )
    }
    render(<Form />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '31.02.2024' } })
    fireEvent.blur(screen.getByRole('textbox'))
    expect(screen.getByRole('button', { name: 'Далее' })).toBeDisabled()
  })
})
