import { createRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from '.'

afterEach(cleanup)

const options = ['Москва', 'Санкт-Петербург'] as const

describe('Select', () => {
  it('creates unique ids and connects labels to native selects', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Select label="Город" options={options} value="" onChange={vi.fn()} />
        <Select label="Родной город" options={options} value="" onChange={vi.fn()} />
      </>,
    )
    const first = screen.getByRole('combobox', { name: 'Город' })
    const second = screen.getByRole('combobox', { name: 'Родной город' })
    expect(first.id).toBeTruthy()
    expect(second.id).not.toBe(first.id)
    await user.click(screen.getByText('Родной город'))
    expect(second).toHaveFocus()
  })

  it('uses the supplied id and forwards object and callback refs', () => {
    const ref = createRef<HTMLSelectElement>()
    const callbackRef = vi.fn()
    render(
      <>
        <Select id="city" label="Город" options={options} value="" onChange={vi.fn()} ref={ref} />
        <Select label="Пол" options={[]} value="" onChange={vi.fn()} ref={callbackRef} />
      </>,
    )
    const select = screen.getByLabelText('Город')
    expect(select).toHaveAttribute('id', 'city')
    expect(ref.current).toBe(select)
    expect(ref.current).toBeInstanceOf(HTMLSelectElement)
    ref.current?.focus()
    expect(select).toHaveFocus()
    expect(callbackRef).toHaveBeenCalledWith(screen.getByLabelText('Пол'))
  })

  it.each(['', 'Неизвестный город'])(
    'shows placeholder for value "%s" without choosing a city',
    (value) => {
      const onChange = vi.fn()
      render(
        <Select options={options} value={value} onChange={onChange} placeholder="Выберите город" />,
      )
      expect(screen.getByRole('combobox')).toHaveValue('')
      expect(
        screen.getByRole('option', { name: 'Выберите город', selected: true }),
      ).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Москва', selected: false })).toBeInTheDocument()
      expect(onChange).not.toHaveBeenCalled()
    },
  )

  it('handles empty options and changes to the available values', () => {
    const onChange = vi.fn()
    const { rerender } = render(<Select options={options} value="Москва" onChange={onChange} />)
    const select = screen.getByRole('combobox')
    expect(select).toHaveValue('Москва')
    rerender(<Select options={[]} value="Москва" onChange={onChange} />)
    expect(select).toHaveValue('')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(
      screen.getByRole('option', { name: 'Выберите вариант', selected: true }),
    ).toBeInTheDocument()
    rerender(<Select options={options} value="Москва" onChange={onChange} />)
    expect(select).toHaveValue('Москва')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('lets the parent control selection and clearing and forwards blur events', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onBlur = vi.fn()
    function ControlledExample() {
      const [value, setValue] = useState('')
      return (
        <Select
          label="Город"
          options={options}
          value={value}
          onChange={(nextValue) => {
            onChange(nextValue)
            setValue(nextValue)
          }}
          onBlur={onBlur}
        />
      )
    }
    render(<ControlledExample />)
    const select = screen.getByLabelText('Город')
    await user.selectOptions(select, 'Санкт-Петербург')
    expect(select).toHaveValue('Санкт-Петербург')
    expect(onChange).toHaveBeenLastCalledWith('Санкт-Петербург')
    await user.selectOptions(select, '')
    expect(select).toHaveValue('')
    expect(onChange).toHaveBeenLastCalledWith('')
    await user.tab()
    expect(onBlur).toHaveBeenCalledTimes(1)
    expect(onBlur.mock.calls[0][0].target).toBe(select)
  })

  it('keeps the supplied value until the parent updates it', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(<Select options={options} value="Москва" onChange={onChange} />)
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'Санкт-Петербург')
    expect(onChange).toHaveBeenCalledWith('Санкт-Петербург')
    expect(select).toHaveValue('Москва')
    rerender(<Select options={options} value="Санкт-Петербург" onChange={onChange} />)
    expect(select).toHaveValue('Санкт-Петербург')
  })

  it('changes option labels without changing values or the callback argument', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Select
        options={['female', 'male']}
        value="female"
        onChange={onChange}
        getOptionLabel={(value) => (value === 'female' ? 'Женский' : 'Мужской')}
      />,
    )
    const select = screen.getByRole('combobox')
    expect(select).toHaveValue('female')
    expect(screen.getByRole('option', { name: 'Женский' })).toHaveValue('female')
    await user.selectOptions(select, screen.getByRole('option', { name: 'Мужской' }))
    expect(onChange).toHaveBeenCalledWith('male')
  })

  it('renders a styled dropdown when requested and lets the parent control its value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(
      <Select label="Город" options={options} value="" onChange={onChange} customDropdown />,
    )
    const trigger = screen.getByRole('button', { name: 'Город' })
    await user.click(trigger)
    expect(screen.getByRole('listbox', { name: 'Город' })).toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: 'Санкт-Петербург' }))
    expect(onChange).toHaveBeenCalledWith('Санкт-Петербург')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    rerender(
      <Select
        label="Город"
        options={options}
        value="Санкт-Петербург"
        onChange={onChange}
        customDropdown
      />,
    )
    expect(screen.getByRole('button', { name: 'Город' })).toHaveTextContent('Санкт-Петербург')
  })

  it('supports keyboard opening, selection, and Escape in the styled dropdown', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Select
        label="Пол"
        options={['female', 'male']}
        value=""
        onChange={onChange}
        getOptionLabel={(value) => (value === 'female' ? 'Женский' : 'Мужской')}
        customDropdown
      />,
    )
    const trigger = screen.getByRole('button', { name: 'Пол' })
    trigger.focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('listbox', { name: 'Пол' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('filters searchable dropdown options as the query changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Select
        label="Город"
        placeholder="Не указан"
        options={['Санкт-Петербург', 'Самара', 'Саратов']}
        value=""
        onChange={onChange}
        customDropdown
        searchable
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Город' }))
    await user.type(screen.getByRole('textbox', { name: 'Город' }), 'сам')

    expect(screen.queryByRole('option', { name: 'Санкт-Петербург' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Самара' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Саратов' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: 'Самара' }))
    expect(onChange).toHaveBeenCalledWith('Самара')
  })

  it('associates errors with the field and preserves external ARIA attributes', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <Select
        aria-label="Город"
        aria-describedby="help"
        options={options}
        value=""
        onChange={onChange}
        error="Выберите город"
      />,
    )
    const select = screen.getByRole('combobox', { name: 'Город' })
    expect(select).toHaveAttribute('aria-invalid', 'true')
    expect(select).toHaveAttribute(
      'aria-describedby',
      `help ${screen.getByText('Выберите город').id}`,
    )
    expect(select).toHaveAccessibleDescription('Выберите город')
    rerender(
      <Select
        aria-label="Город"
        aria-describedby="help"
        aria-invalid="grammar"
        options={options}
        value=""
        onChange={onChange}
        error=" "
      />,
    )
    expect(screen.queryByText('Выберите город')).not.toBeInTheDocument()
    expect(select).toHaveAttribute('aria-describedby', 'help')
    expect(select).toHaveAttribute('aria-invalid', 'grammar')
    rerender(<Select options={options} value="" onChange={onChange} />)
    expect(select).not.toHaveAttribute('aria-invalid')
    expect(select).not.toHaveAttribute('aria-describedby')
  })

  it('uses native required validation and submits the named value', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    function FormExample() {
      const [value, setValue] = useState('')
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit(new FormData(event.currentTarget).get('city'))
          }}
        >
          <Select
            label="Город"
            name="city"
            options={options}
            value={value}
            onChange={setValue}
            required
          />
          <button type="submit">Отправить</button>
        </form>
      )
    }
    render(<FormExample />)
    const select = screen.getByLabelText('Город') as HTMLSelectElement
    const submit = screen.getByRole('button')
    expect(select).toBeRequired()
    expect(select.validity.valueMissing).toBe(true)
    expect(select.checkValidity()).toBe(false)
    await user.click(submit)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(select).not.toHaveAttribute('aria-invalid')
    await user.selectOptions(select, 'Москва')
    expect(select.checkValidity()).toBe(true)
    await user.click(submit)
    expect(onSubmit).toHaveBeenCalledWith('Москва')
    await user.selectOptions(select, '')
    expect(select.checkValidity()).toBe(false)
  })

  it('treats an unknown value as empty for required validation', () => {
    render(<Select options={options} value="Неизвестный город" onChange={vi.fn()} required />)
    expect(screen.getByRole('combobox')).toBeInvalid()
  })

  it('disables selection and native validation when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Select options={options} value="" onChange={onChange} required disabled />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select).toBeDisabled()
    expect(select.checkValidity()).toBe(true)
    await user.selectOptions(select, 'Москва')
    expect(select).toHaveValue('')
    expect(onChange).not.toHaveBeenCalled()
    await user.tab()
    expect(select).not.toHaveFocus()
  })
})
