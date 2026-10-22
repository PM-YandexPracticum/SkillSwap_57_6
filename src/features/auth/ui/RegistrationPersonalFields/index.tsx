import type { City, Gender } from '@/shared/types'
import { FormInput } from '@/shared/ui/FormInput'
import { DatePicker } from '@/shared/ui/DatePicker'
import { Select } from '@/shared/ui/Select'
import { useCallback, useId, useMemo, useState } from 'react'
import type {
  RegistrationPersonalDraft,
  RegistrationPersonalErrors,
} from '../../model/registrationTypes'
import styles from './RegistrationPersonalFields.module.css'

interface RegistrationPersonalFieldsProps {
  value: RegistrationPersonalDraft
  errors: RegistrationPersonalErrors
  cities: readonly City[]
  disabled?: boolean
  resetKey?: number
  onChange: (value: RegistrationPersonalDraft) => void
  onDateErrorChange: (error: string | null) => void
}

const GENDER_OPTIONS: Gender[] = ['male', 'female', 'other']

const GENDER_LABELS: Record<Gender, string> = {
  male: 'Мужской',
  female: 'Женский',
  other: 'Другой',
}

export function RegistrationPersonalFields({
  value,
  errors,
  cities,
  disabled = false,
  resetKey,
  onChange,
  onDateErrorChange,
}: RegistrationPersonalFieldsProps) {
  const generatedId = useId()
  const [dateError, setDateError] = useState<string | null>(null)

  const today = useMemo(() => new Date(), [])
  const maxDate = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    [today],
  )

  const cityOptions = useMemo(() => cities.map((city) => city.name), [cities])

  const updateField = <K extends keyof RegistrationPersonalDraft>(
    field: K,
    fieldValue: RegistrationPersonalDraft[K],
  ) => {
    onChange({
      ...value,
      [field]: fieldValue,
    })
  }

  const handleDateErrorChange = useCallback(
    (error: string | null) => {
      setDateError(error)
      onDateErrorChange(error)
    },
    [onDateErrorChange],
  )

  return (
    <div className={styles.fields}>
      <FormInput
        id={`${generatedId}-name`}
        label="Имя"
        placeholder="Введите ваше имя"
        value={value.name}
        onChange={(event) => updateField('name', event.target.value)}
        error={errors.name}
        disabled={disabled}
        required
        autoComplete="given-name"
      />

      <DatePicker
        label="Дата рождения"
        value={value.birthDate}
        onChange={(date) => updateField('birthDate', date)}
        onValidationChange={handleDateErrorChange}
        error={dateError ?? errors.birthDate}
        maxDate={maxDate}
        resetKey={resetKey}
        disabled={disabled}
        required
      />

      <Select
        id={`${generatedId}-gender`}
        label="Пол"
        placeholder="Не указан"
        options={GENDER_OPTIONS}
        getOptionLabel={(gender) => GENDER_LABELS[gender as Gender]}
        value={value.gender}
        onChange={(gender) => updateField('gender', gender as Gender | '')}
        customDropdown
        error={errors.gender}
        disabled={disabled}
        required
      />

      <Select
        id={`${generatedId}-city`}
        label="Город"
        placeholder="Не указан"
        options={cityOptions}
        value={value.city}
        onChange={(city) => updateField('city', city)}
        customDropdown
        searchable
        error={errors.city}
        disabled={disabled}
        required
      />
    </div>
  )
}
