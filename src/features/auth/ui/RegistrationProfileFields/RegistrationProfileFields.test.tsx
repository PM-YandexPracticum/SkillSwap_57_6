import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RegistrationProfileDraft } from '../../model/registrationTypes'
import { RegistrationProfileFields } from '.'

vi.mock('@/shared/ui/DatePicker', () => ({
  DatePicker: ({
    error,
    onValidationChange,
  }: {
    error?: string
    onValidationChange?: (error: string | null) => void
  }) => (
    <div>
      <button type="button" onClick={() => onValidationChange?.('Некорректная дата')}>
        Установить ошибку даты
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  ),
}))

vi.mock('@/shared/ui/ImagePicker', () => ({
  ImagePicker: ({
    error,
    onValidationChange,
  }: {
    error?: string
    onValidationChange?: (error: string | null) => void
  }) => {
    const [localError, setLocalError] = useState<string | null>(null)
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setLocalError('Недопустимый тип файла')
            onValidationChange?.('Недопустимый тип файла')
          }}
        >
          Установить ошибку изображения
        </button>
        {(localError ?? error) && <p role="alert">{localError ?? error}</p>}
      </div>
    )
  },
}))

const validDraft: RegistrationProfileDraft = {
  name: 'Анна',
  birthDate: new Date(1995, 5, 15),
  gender: 'female',
  city: 'Москва',
  avatarFile: new File(['avatar'], 'avatar.png', { type: 'image/png' }),
  learnCategories: ['Творчество и искусство', 'Иностранные языки'],
  learnSubcategories: ['Рисование и иллюстрация', 'Английский'],
}

const commonProps = {
  cities: [{ name: 'Москва' }],
  avatarSettings: { acceptedTypes: ['image/png'] },
  onChange: vi.fn(),
  onBack: vi.fn(),
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('RegistrationProfileFields', () => {
  it('passes a valid controlled draft to the next step', () => {
    const onContinue = vi.fn()
    render(
      <RegistrationProfileFields {...commonProps} value={validDraft} onContinue={onContinue} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }))

    expect(onContinue).toHaveBeenCalledWith(validDraft)
  })

  it('shows validation errors and does not continue with an empty draft', () => {
    const onContinue = vi.fn()
    const emptyDraft: RegistrationProfileDraft = {
      name: '',
      birthDate: null,
      gender: '',
      city: '',
      avatarFile: null,
      learnCategories: [],
      learnSubcategories: [],
    }
    render(
      <RegistrationProfileFields {...commonProps} value={emptyDraft} onContinue={onContinue} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }))

    expect(onContinue).not.toHaveBeenCalled()
    expect(screen.getByText('Введите имя')).toBeInTheDocument()
    expect(screen.getAllByText('Выберите хотя бы одно значение')).toHaveLength(2)
    expect(screen.getByText('Выберите аватар')).toBeInTheDocument()
  })

  it('keeps DatePicker and ImagePicker local errors when validating the draft', () => {
    const onContinue = vi.fn()
    render(
      <RegistrationProfileFields {...commonProps} value={validDraft} onContinue={onContinue} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Установить ошибку даты' }))
    fireEvent.click(screen.getByRole('button', { name: 'Установить ошибку изображения' }))
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }))

    expect(onContinue).not.toHaveBeenCalled()
    expect(screen.getAllByText('Некорректная дата')).toHaveLength(1)
    expect(screen.getByText('Недопустимый тип файла')).toBeInTheDocument()
  })

  it('allows returning when invalid and disables fields and both actions', () => {
    const onBack = vi.fn()
    render(
      <RegistrationProfileFields
        {...commonProps}
        value={validDraft}
        disabled
        onBack={onBack}
        onContinue={vi.fn()}
      />,
    )

    const backButton = screen.getByRole('button', { name: 'Назад' })
    const continueButton = screen.getByRole('button', { name: 'Продолжить' })
    expect(backButton).toBeDisabled()
    expect(continueButton).toBeDisabled()

    render(
      <RegistrationProfileFields
        {...commonProps}
        value={validDraft}
        onBack={onBack}
        onContinue={vi.fn()}
      />,
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'Назад' })[1])
    expect(onBack).toHaveBeenCalledOnce()
  })
})
