import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilePicker } from '.'
import type { FilePickerProps } from '.'

afterEach(cleanup)

const acceptedTypes = ['image/jpeg', 'image/png'] as const
const maxSizeBytes = 2 * 1024 * 1024
const jpeg = new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' })
const png = new File(['png'], 'photo.png', { type: 'image/png' })
const invalid = new File(['gif'], 'invalid.jpg', { type: 'image/gif' })
const getInput = () => screen.getByLabelText('Изображение') as HTMLInputElement

function setup(overrides: Partial<FilePickerProps> = {}) {
  const onChange = vi.fn()
  const onValidationChange = vi.fn()
  const props: FilePickerProps = {
    value: null,
    onChange,
    acceptedTypes,
    maxSizeBytes,
    onValidationChange,
    ...overrides,
  }
  return { ...render(<FilePicker {...props} />), props, onChange, onValidationChange }
}

describe('FilePicker', () => {
  it.each([jpeg, png])('accepts $type and reports validation before onChange', async (file) => {
    const user = userEvent.setup()
    const calls: unknown[] = []
    setup({
      onValidationChange: (error) => calls.push(error),
      onChange: (value) => calls.push(value),
    })
    expect(getInput()).toHaveAttribute('type', 'file')
    expect(getInput()).toHaveAttribute('accept', 'image/jpeg,image/png')
    expect(getInput()).not.toBeRequired()
    await user.upload(getInput(), file)
    expect(calls).toEqual([null, file])
    expect(getInput().value).toBe('')
  })

  it.each(['image/gif', ''])('preserves the previous value on invalid MIME %s', async (type) => {
    const user = userEvent.setup({ applyAccept: false })
    const { onChange, onValidationChange } = setup({ value: jpeg, error: 'Ошибка формы' })
    await user.upload(getInput(), new File(['invalid'], 'image.png', { type }))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText(jpeg.name)).toBeInTheDocument()
    const message = onValidationChange.mock.calls[0][0] as string
    expect(message).toContain('Недопустимый тип файла')
    expect(screen.getByText(message)).toBeInTheDocument()
    expect(screen.queryByText('Ошибка формы')).not.toBeInTheDocument()
    expect(getInput()).toHaveAttribute('aria-invalid', 'true')
    expect(getInput()).toHaveAccessibleDescription(`${jpeg.name} ${message}`)
    expect(getInput()).toHaveAttribute(
      'aria-describedby',
      `${screen.getByText(jpeg.name).id} ${screen.getByText(message).id}`,
    )
  })

  it('enforces the inclusive size limit supplied through props', async () => {
    const user = userEvent.setup()
    const { onChange, onValidationChange } = setup()
    const boundary = new File([new Uint8Array(maxSizeBytes)], 'limit.png', { type: 'image/png' })
    const oversized = new File([new Uint8Array(maxSizeBytes + 1)], 'large.png', {
      type: 'image/png',
    })
    await user.upload(getInput(), boundary)
    expect(onChange).toHaveBeenCalledWith(boundary)
    onChange.mockClear()
    await user.upload(getInput(), oversized)
    expect(onChange).not.toHaveBeenCalled()
    expect(onValidationChange).toHaveBeenLastCalledWith(expect.stringContaining('2097152'))
  })

  it('has no default size limit and supports a different acceptedTypes list', async () => {
    const user = userEvent.setup()
    const { onChange } = setup({ acceptedTypes: ['image/gif'], maxSizeBytes: undefined })
    const large = new File([new Uint8Array(maxSizeBytes + 1)], 'large.gif', { type: 'image/gif' })
    expect(getInput()).toHaveAttribute('accept', 'image/gif')
    await user.upload(getInput(), large)
    expect(onChange).toHaveBeenCalledWith(large)
  })

  it('clears errors on success and removal and allows selecting the same file again', async () => {
    const user = userEvent.setup({ applyAccept: false })
    const onChange = vi.fn()
    const onValidationChange = vi.fn()
    function ControlledPicker() {
      const [value, setValue] = useState<File | null>(jpeg)
      return (
        <FilePicker
          value={value}
          acceptedTypes={acceptedTypes}
          onValidationChange={(error) => onValidationChange(error)}
          onChange={(file) => {
            onChange(file)
            setValue(file)
          }}
        />
      )
    }
    render(<ControlledPicker />)
    await user.upload(getInput(), invalid)
    expect(getInput()).toHaveAttribute('aria-invalid', 'true')
    onValidationChange.mockClear()
    await user.upload(getInput(), png)
    expect(screen.getByText(png.name)).toBeInTheDocument()
    expect(getInput()).not.toHaveAttribute('aria-invalid')
    expect(onValidationChange).toHaveBeenLastCalledWith(null)
    expect(onValidationChange).toHaveBeenCalledTimes(1)
    await user.upload(getInput(), invalid)
    onValidationChange.mockClear()
    await user.click(screen.getByRole('button', { name: 'Удалить файл' }))
    expect(onChange).toHaveBeenLastCalledWith(null)
    expect(onValidationChange).toHaveBeenLastCalledWith(null)
    expect(onValidationChange).toHaveBeenCalledTimes(1)
    expect(getInput()).not.toHaveAttribute('aria-invalid')
    expect(screen.queryByText(png.name)).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    onValidationChange.mockClear()
    await user.upload(getInput(), png)
    expect(onValidationChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls.map(([file]) => file)).toEqual([png, null, png])
    expect(screen.getByText(png.name)).toBeInTheDocument()
  })

  it('preserves value and errors when the file dialog is cancelled', async () => {
    const user = userEvent.setup({ applyAccept: false })
    const { onChange, onValidationChange } = setup({ value: jpeg })
    await user.upload(getInput(), invalid)
    const message = onValidationChange.mock.calls[0][0] as string
    onValidationChange.mockClear()
    fireEvent.change(getInput(), { target: { files: [] } })
    fireEvent(getInput(), new Event('cancel', { bubbles: true }))
    expect(onChange).not.toHaveBeenCalled()
    expect(onValidationChange).not.toHaveBeenCalled()
    expect(screen.getByText(jpeg.name)).toBeInTheDocument()
    expect(screen.getByText(message)).toBeInTheDocument()
  })

  it('disables selection and removal, including synthetic change events', async () => {
    const user = userEvent.setup()
    const { onChange, onValidationChange } = setup({ value: jpeg, disabled: true })
    const remove = screen.getByRole('button', { name: 'Удалить файл' })
    expect(getInput()).toBeDisabled()
    expect(remove).toBeDisabled()
    await user.upload(getInput(), png)
    await user.click(remove)
    fireEvent.change(getInput(), { target: { files: [png] } })
    await user.tab()
    expect(getInput()).not.toHaveFocus()
    expect(remove).not.toHaveFocus()
    expect(onChange).not.toHaveBeenCalled()
    expect(onValidationChange).not.toHaveBeenCalled()
  })

  it.each([png, null])('clears local errors on external value change to $name', async (value) => {
    const user = userEvent.setup({ applyAccept: false })
    const { rerender, props, onChange, onValidationChange } = setup({ value: jpeg })
    await user.upload(getInput(), invalid)
    onValidationChange.mockClear()
    rerender(<FilePicker {...props} value={value} />)
    expect(onValidationChange).toHaveBeenCalledTimes(1)
    expect(onValidationChange).toHaveBeenCalledWith(null)
    expect(onChange).not.toHaveBeenCalled()
    expect(getInput()).not.toHaveAttribute('aria-invalid')
    expect(getInput().value).toBe('')
    expect(screen.queryByText(jpeg.name)).not.toBeInTheDocument()
    if (value) expect(screen.getByText(value.name)).toBeInTheDocument()
  })

  it('does not clear local errors or notify when only the callback identity changes', async () => {
    const user = userEvent.setup({ applyAccept: false })
    const { rerender, props } = setup({ value: jpeg })
    await user.upload(getInput(), invalid)
    const callback = vi.fn()
    rerender(<FilePicker {...props} onValidationChange={(error) => callback(error)} />)
    expect(callback).not.toHaveBeenCalled()
    expect(getInput()).toHaveAttribute('aria-invalid', 'true')
    rerender(<FilePicker {...props} value={null} onValidationChange={(error) => callback(error)} />)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(null)
    rerender(<FilePicker {...props} value={null} onValidationChange={(error) => callback(error)} />)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('supports keyboard focus and removal and shows the external error after local clearing', async () => {
    const user = userEvent.setup({ applyAccept: false })
    const { onChange, onValidationChange } = setup({ value: jpeg, error: 'Ошибка формы' })
    await user.upload(getInput(), invalid)
    await user.upload(getInput(), png)
    expect(getInput()).toHaveAccessibleDescription(`${jpeg.name} Ошибка формы`)
    const remove = screen.getByRole('button', { name: 'Удалить файл' })
    expect(remove).toHaveAttribute('type', 'button')
    getInput().blur()
    await user.tab()
    expect(getInput()).toHaveFocus()
    await user.tab()
    expect(remove).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(null)
    expect(onValidationChange).toHaveBeenLastCalledWith(null)
    expect(screen.getByText('Ошибка формы')).toBeInTheDocument()
  })

  it('works without an optional validation callback and creates unique label associations', async () => {
    const user = userEvent.setup()
    setup({ onValidationChange: undefined })
    render(<FilePicker value={null} onChange={vi.fn()} acceptedTypes={acceptedTypes} />)
    const inputs = screen.getAllByLabelText('Изображение')
    expect(inputs[0].id).not.toBe(inputs[1].id)
    await user.upload(inputs[0], jpeg)
    expect(inputs[0]).not.toHaveAttribute('aria-invalid')
  })
})
