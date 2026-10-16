import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PasswordInput } from './index'

describe('PasswordInput', () => {
  it('hides the password by default and toggles its visibility', async () => {
    const user = userEvent.setup()

    render(<PasswordInput label="Пароль" />)

    const input = screen.getByLabelText('Пароль')
    const button = screen.getByRole('button', { name: 'Показать пароль' })

    expect(input).toHaveAttribute('type', 'password')
    expect(button).toHaveAttribute('aria-pressed', 'false')

    await user.click(button)

    expect(input).toHaveAttribute('type', 'text')
    expect(button).toHaveAttribute('aria-pressed', 'true')

    await user.click(button)

    expect(input).toHaveAttribute('type', 'password')
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('preserves the password value when toggling visibility', async () => {
    const user = userEvent.setup()

    render(<PasswordInput label="Пароль" />)

    const input = screen.getByLabelText('Пароль')
    const button = screen.getByRole('button', { name: 'Показать пароль' })

    await user.type(input, 'MyPassword123')

    expect(input).toHaveValue('MyPassword123')

    await user.click(button)

    expect(input).toHaveValue('MyPassword123')
    expect(input).toHaveAttribute('type', 'text')

    await user.click(button)

    expect(input).toHaveValue('MyPassword123')
    expect(input).toHaveAttribute('type', 'password')
  })

  it('does not submit the form when toggling password visibility', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())

    render(
      <form onSubmit={handleSubmit}>
        <PasswordInput label="Password" />
        <button type="submit">Submit</button>
      </form>,
    )

    const toggleButton = screen.getByRole('button', {
      name: 'Показать пароль',
    })

    expect(toggleButton).toHaveAttribute('type', 'button')

    await user.click(toggleButton)

    expect(handleSubmit).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(handleSubmit).toHaveBeenCalledTimes(1)
  })

  it('disables the input and visibility toggle when disabled', () => {
    render(<PasswordInput label="Password" disabled />)

    const input = screen.getByLabelText('Password')
    const toggleButton = screen.getByRole('button', {
      name: 'Показать пароль',
    })

    expect(input).toBeDisabled()
    expect(toggleButton).toBeDisabled()
    expect(input).toHaveAttribute('type', 'password')
  })

  it('forwards the ref to the input element', () => {
    const ref = createRef<HTMLInputElement>()

    render(<PasswordInput label="Password" ref={ref} />)

    const input = screen.getByLabelText('Password')

    expect(ref.current).toBe(input)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('preserves FormInput props and accessibility attributes', () => {
    render(
      <PasswordInput
        label="Password"
        hint="Use at least 8 characters"
        error="Password is required"
        required
        autoComplete="current-password"
      />,
    )

    const input = screen.getByLabelText('Password')
    const hint = screen.getByText('Use at least 8 characters')
    const error = screen.getByText('Password is required')

    expect(input).toBeRequired()
    expect(input).toHaveAttribute('autocomplete', 'current-password')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(`${hint.textContent} ${error.textContent}`)
  })

  it('updates the password value when reset externally', async () => {
    const user = userEvent.setup()

    const { rerender } = render(<PasswordInput label="Password" value="MyPassword123" readOnly />)

    const input = screen.getByLabelText('Password')

    expect(input).toHaveValue('MyPassword123')

    await user.click(screen.getByRole('button', { name: 'Показать пароль' }))

    expect(input).toHaveAttribute('type', 'text')

    rerender(<PasswordInput label="Password" value="" readOnly />)

    expect(input).toHaveValue('')
    expect(input).toHaveAttribute('type', 'text')
  })

  it('resets the password value when the form is reset', async () => {
    const user = userEvent.setup()

    render(
      <form>
        <PasswordInput label="Password" defaultValue="Initial123" />
        <button type="reset">Reset</button>
      </form>,
    )

    const input = screen.getByLabelText('Password')

    await user.clear(input)
    await user.type(input, 'Changed123')

    expect(input).toHaveValue('Changed123')

    await user.click(screen.getByRole('button', { name: 'Reset' }))

    expect(input).toHaveValue('Initial123')
  })
})
