import ReactDatePicker, { registerLocale } from 'react-datepicker'
import { ru } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'
import styles from './DatePicker.module.css'

import { shift } from '@floating-ui/dom'

import { format, isValid, parse, startOfDay } from 'date-fns'
import calendarIcon from './assets/calendar.svg'
import chevronDown from './assets/chevron-down.svg'

import { useEffect, useId, useRef, useState } from 'react'

registerLocale('ru', ru)

const DATE_FORMAT = 'dd.MM.yyyy'

const formatDate = (date: Date | null): string => {
  return date && isValid(date) ? format(date, DATE_FORMAT) : ''
}

const parseInput = (text: string, minDate?: Date, maxDate?: Date) => {
  if (!text.trim()) return { date: null, error: null }
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(text.trim())) {
    return { date: null, error: 'Введите дату в формате дд.мм.гггг' }
  }
  const date = parse(text.trim(), DATE_FORMAT, new Date())
  if (!isValid(date) || formatDate(date) !== text.trim()) {
    return { date: null, error: 'Такой даты не существует' }
  }
  if ((minDate && date < startOfDay(minDate)) || (maxDate && date > startOfDay(maxDate))) {
    return { date: null, error: 'Дата выходит за допустимый диапазон' }
  }
  return { date, error: null }
}

// Названия месяцев для выпадающего списка календаря.
const months = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]

export type DatePickerProps = {
  value: Date | null
  onChange: (date: Date | null) => void
  onValidationChange?: (error: string | null) => void
  label: string
  error?: string
  disabled?: boolean
  required?: boolean
  minDate?: Date
  maxDate?: Date
}

export const DatePicker = ({
  value,
  onChange,
  onValidationChange,
  label,
  error,
  disabled = false,
  required = false,
  minDate,
  maxDate,
}: DatePickerProps) => {
  const currentYear = new Date().getFullYear()

  const startYear = minDate?.getFullYear() ?? Math.min(1900, value?.getFullYear() ?? 1900)
  const endYear =
    maxDate?.getFullYear() ?? Math.max(currentYear, value?.getFullYear() ?? currentYear)

  const years = Array.from(
    { length: Math.max(0, endYear - startYear + 1) },
    (_, index) => startYear + index,
  )

  const id = useId()
  const errorId = `${id}-error`
  const [draftDate, setDraftDate] = useState<Date | null>(value)
  // Текст даты, отображаемый в поле ввода.
  const [inputValue, setInputValue] = useState(formatDate(value))
  // Ошибка проверки даты, введённой вручную.
  const [inputError, setInputError] = useState('')
  const previousValue = useRef(value?.getTime() ?? null)

  // Показывает, что пользователь изменил дату вручную.
  const [isManualInput, setIsManualInput] = useState(false)
  // Управляем открытием и закрытием календаря.
  const [isOpen, setIsOpen] = useState(false)
  // Синхронизируем временную дату с изменениями от родителя.
  useEffect(() => {
    const timestamp = value?.getTime() ?? null
    if (Object.is(previousValue.current, timestamp)) return
    previousValue.current = timestamp
    setDraftDate(value)
    setInputValue(formatDate(value))
    setInputError('')
    setIsManualInput(false)
    onValidationChange?.(null)
  }, [value, onValidationChange])

  // Закрываем календарь, если компонент становится недоступным.
  useEffect(() => {
    if (disabled) {
      setIsOpen(false)
    }
  }, [disabled])

  const validateManualInput = (text: string) => {
    const result = parseInput(text, minDate, maxDate)
    setInputError(result.error ?? '')
    onValidationChange?.(result.error)
    if (!result.error) {
      setDraftDate(result.date)
      onChange(result.date)
    }
    return !result.error
  }

  const handleConfirm = () => {
    if (disabled) return
    if (isManualInput) {
      if (!validateManualInput(inputValue)) return
    } else {
      if (!validateManualInput(formatDate(draftDate))) return
      setInputValue(formatDate(draftDate))
    }
    closeCalendar()
  }

  const closeCalendar = () => {
    setIsManualInput(false)
    setIsOpen(false)
  }

  // Отменяем выбор даты и закрываем календарь.
  const handleCancel = () => {
    setDraftDate(value)
    setInputValue(formatDate(value))
    setInputError('')
    onValidationChange?.(null)
    closeCalendar()
  }

  return (
    <div
      className={styles.wrapper}
      onBlurCapture={(event) => {
        if (!disabled && event.target.id === id && isManualInput) validateManualInput(inputValue)
      }}
      onKeyDownCapture={(event) => {
        if (disabled || !(event.target instanceof HTMLInputElement) || event.target.id !== id)
          return
        if (event.key === 'Escape' || (event.key === 'Enter' && isManualInput)) {
          event.preventDefault()
          event.stopPropagation()
          if (event.key === 'Escape') handleCancel()
          else handleConfirm()
        }
      }}
    >
      <label className={styles.label} htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <ReactDatePicker
        id={id}
        className={styles.input}
        showPopperArrow={false}
        renderCustomHeader={({ date, changeMonth, changeYear }) => (
          <div className={styles.calendarHeader}>
            <div className={styles.headerSelect}>
              <select
                aria-label="Выберите месяц"
                value={date.getMonth()}
                onChange={(event) => changeMonth(Number(event.target.value))}
              >
                {months.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>

              <img src={chevronDown} alt="" aria-hidden="true" />
            </div>

            <div className={styles.headerSelect}>
              <select
                aria-label="Выберите год"
                value={date.getFullYear()}
                onChange={(event) => changeYear(Number(event.target.value))}
              >
                {Array.from(new Set([...years, date.getFullYear()]))
                  .sort((a, b) => a - b)
                  .map((year) => (
                    <option key={year} value={year} disabled={year < startYear || year > endYear}>
                      {year}
                    </option>
                  ))}
              </select>

              <img src={chevronDown} alt="" aria-hidden="true" />
            </div>
          </div>
        )}
        popperPlacement="bottom-end"
        popperModifiers={[shift({ padding: 8 })]}
        wrapperClassName={styles.datePickerWrapper}
        showIcon
        calendarIconClassName={styles.calendarIcon}
        calendarClassName={styles.calendar}
        icon={
          <img
            src={calendarIcon}
            alt=""
            onClick={() => {
              if (!disabled) {
                setIsOpen(true)
              }
            }}
          />
        }
        selected={value}
        dayClassName={(date) => {
          if (
            draftDate &&
            date.toDateString() === draftDate.toDateString() &&
            (!value || date.toDateString() !== value.toDateString())
          ) {
            return styles.draftDay
          }

          return ''
        }}
        value={inputValue}
        onChangeRaw={(event, selection) => {
          if (!disabled && !selection && event?.target instanceof HTMLInputElement) {
            const text = event.target.value
            setInputValue(text)
            setIsManualInput(true)
            event.preventDefault()
            if (!text.trim() || !parseInput(text, minDate, maxDate).error) validateManualInput(text)
          }
        }}
        onSelect={(date: Date | null) => {
          setDraftDate(date)
          setIsManualInput(false)
          setInputError('')
          setInputValue(formatDate(date))
          onValidationChange?.(null)
        }}
        open={isOpen}
        onInputClick={() => setIsOpen(true)}
        onClickOutside={() => {
          if (isManualInput) validateManualInput(inputValue)
          else {
            setDraftDate(value)
            setInputValue(formatDate(value))
          }
          setIsOpen(false)
        }}
        onKeyDown={(event) => {
          if (!disabled && !isOpen && (event.key === 'Enter' || event.key === 'ArrowDown')) {
            event.preventDefault()
            setIsOpen(true)
          }
        }}
        shouldCloseOnSelect={false}
        locale="ru"
        fixedHeight
        dateFormat={DATE_FORMAT}
        placeholderText="дд.мм.гггг"
        disabled={disabled}
        required={required}
        minDate={minDate}
        maxDate={maxDate}
        aria-invalid={inputError || error ? 'true' : 'false'}
        aria-describedby={inputError || error ? errorId : undefined}
      >
        <div className={styles.calendarActions}>
          <button type="button" onClick={handleCancel}>
            Отменить
          </button>
          <button type="button" onClick={handleConfirm}>
            Выбрать
          </button>
        </div>
      </ReactDatePicker>

      {(inputError || error) && (
        <p id={errorId} className={styles.error} role="alert">
          {inputError || error}
        </p>
      )}
    </div>
  )
}
