import { createRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormInput } from '.'

afterEach(cleanup)

describe('FormInput', () => {
  it('creates unique ids and associates each label with its input', async () => {
    const user = userEvent.setup()
    render(
      <>
        <FormInput label="Имя" />
        <FormInput label="Фамилия" />
      </>,
    )
    const first = screen.getByLabelText('Имя')
    const second = screen.getByLabelText('Фамилия')
    expect(first.id).toBeTruthy()
    expect(second.id).not.toBe(first.id)
    await user.click(screen.getByText('Фамилия'))
    expect(second).toHaveFocus()
  })

  it('uses a supplied id and forwards object and callback refs to the native input', () => {
    const ref = createRef<HTMLInputElement>()
    const callbackRef = vi.fn()
    render(
      <>
        <FormInput id="email" label="Почта" ref={ref} />
        <FormInput label="Телефон" ref={callbackRef} />
      </>,
    )
    const input = screen.getByLabelText('Почта')
    expect(input).toHaveAttribute('id', 'email')
    expect(ref.current).toBe(input)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    ref.current?.focus()
    expect(input).toHaveFocus()
    expect(callbackRef).toHaveBeenCalledWith(screen.getByLabelText('Телефон'))
  })

  it('supports controlled values and passes input events to onChange and onBlur', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onBlur = vi.fn()
    function ControlledExample() {
      const [value, setValue] = useState('')
      return (
        <FormInput
          label="Имя"
          value={value}
          onChange={(event) => {
            onChange(event)
            setValue(event.target.value)
          }}
          onBlur={onBlur}
        />
      )
    }
    render(<ControlledExample />)
    const input = screen.getByLabelText('Имя')
    await user.type(input, 'Анна')
    expect(input).toHaveValue('Анна')
    expect(onChange.mock.calls[0][0].target).toBe(input)
    await user.tab()
    expect(onBlur).toHaveBeenCalledTimes(1)
    expect(onBlur.mock.calls[0][0].target).toBe(input)
  })

  it('supports uncontrolled values and standard HTML attributes', async () => {
    const user = userEvent.setup()
    render(
      <FormInput
        label="Почта"
        name="email"
        type="email"
        defaultValue="mail"
        required
        autoComplete="email"
        placeholder="mail@example.com"
        className="custom-input"
      />,
    )
    const input = screen.getByLabelText('Почта')
    await user.type(input, '@example.com')
    expect(input).toHaveValue('mail@example.com')
    expect(input).toHaveAttribute('name', 'email')
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toBeRequired()
    expect(input).toHaveAttribute('autocomplete', 'email')
    expect(input).toHaveAttribute('placeholder', 'mail@example.com')
    expect(input).toHaveClass('custom-input')
  })

  it('combines external descriptions, hint and error and updates error only from props', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <FormInput
        label="Почта"
        hint="Подсказка"
        error="Ошибка формы"
        aria-describedby="external-description"
      />,
    )
    const input = screen.getByLabelText('Почта')
    const hint = screen.getByText('Подсказка')
    const error = screen.getByText('Ошибка формы')
    expect(input).toHaveAttribute('aria-describedby', `external-description ${hint.id} ${error.id}`)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    await user.type(input, 'valid@example.com')
    expect(screen.getByText('Ошибка формы')).toBeInTheDocument()
    rerender(<FormInput label="Почта" hint="Подсказка" error=" " />)
    expect(screen.queryByText('Ошибка формы')).not.toBeInTheDocument()
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).toHaveAttribute('aria-describedby', screen.getByText('Подсказка').id)
  })

  it('preserves parent aria-invalid and accessible names without a label', () => {
    render(<FormInput aria-label="Имя" aria-invalid="grammar" />)
    const input = screen.getByRole('textbox', { name: 'Имя' })
    expect(input).toHaveAttribute('aria-invalid', 'grammar')
    expect(input).not.toHaveAttribute('aria-describedby')
  })

  it('disables the native input and prevents typing', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FormInput label="Имя" disabled defaultValue="Анна" onChange={onChange} />)
    const input = screen.getByLabelText('Имя')
    expect(input).toBeDisabled()
    await user.type(input, 'Мария')
    expect(input).toHaveValue('Анна')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('keeps adornments interactive and does not leak service props into the input', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <FormInput
        label="Имя"
        hint="Подсказка"
        error="Ошибка"
        endAdornment={
          <button type="button" onClick={onClick}>
            Действие
          </button>
        }
      />,
    )
    const input = screen.getByLabelText('Имя')
    const button = screen.getByRole('button', { name: 'Действие' })
    expect(button.closest('[aria-hidden="true"]')).toBeNull()
    await user.tab()
    expect(input).toHaveFocus()
    await user.tab()
    expect(button).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledTimes(1)
    for (const prop of ['label', 'hint', 'error', 'endadornment']) {
      expect(input).not.toHaveAttribute(prop)
    }
  })

  it('lets the parent change type while retaining the input and ref', () => {
    const ref = createRef<HTMLInputElement>()
    const { rerender } = render(<FormInput label="Пароль" type="password" ref={ref} />)
    const input = screen.getByLabelText('Пароль')
    rerender(<FormInput label="Пароль" type="text" ref={ref} />)
    expect(input).toHaveAttribute('type', 'text')
    expect(ref.current).toBe(input)
  })

  it('does not generate errors or modify invalid input values', async () => {
    const user = userEvent.setup()
    render(<FormInput label="Почта" type="email" required hint="Введите почту" />)
    const input = screen.getByLabelText('Почта')
    await user.type(input, 'invalid-email')
    expect(input).toHaveValue('invalid-email')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).toHaveAccessibleDescription('Введите почту')
  })
})
