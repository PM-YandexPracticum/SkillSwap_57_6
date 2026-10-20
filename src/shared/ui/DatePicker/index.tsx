import ReactDatePicker, { CalendarContainer, registerLocale } from 'react-datepicker'
import { ru } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'
import styles from './DatePicker.module.css'

import { shift } from '@floating-ui/dom'

import { format, isValid, parse } from 'date-fns'
import calendarIcon from './assets/calendar.svg'
import chevronDown from './assets/chevron-down.svg'

import { useEffect, useId, useState, type ReactNode } from 'react'

registerLocale('ru', ru)

const DATE_FORMAT = 'dd.MM.yyyy'

const formatDate = (date: Date | null): string => {
  return date ? format(date, DATE_FORMAT) : ''
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

// Контейнер для календаря с дополнительными элементами.
const CustomCalendarContainer = ({
  className,
  children,
  onConfirm,
  onCancel,
}: {
  className?: string
  children: ReactNode
  onConfirm: () => void
  onCancel: () => void
}) => {
  return (
    <CalendarContainer className={className}>
      {children}

      <div className={styles.calendarActions}>
        <button type="button" onClick={onCancel}>
          Отменить
        </button>

        <button type="button" onClick={onConfirm}>
          Выбрать
        </button>
      </div>
    </CalendarContainer>
  )
}

export type DatePickerProps = {
  value: Date | null
  onChange: (date: Date | null) => void
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

  // Показывает, что пользователь изменил дату вручную.
  const [isManualInput, setIsManualInput] = useState(false)
  // Управляем открытием и закрытием календаря.
  const [isOpen, setIsOpen] = useState(false)
  // Синхронизируем временную дату с изменениями от родителя.
  useEffect(() => {
    setDraftDate(value)
    setInputValue(formatDate(value))
  }, [value])

  // Закрываем календарь, если компонент становится недоступным.
  useEffect(() => {
    if (disabled) {
      setIsOpen(false)
    }
  }, [disabled])

  const handleConfirm = () => {
    // Запрещаем подтверждение даты, если компонент отключён.
    if (disabled) return
    // При ручном вводе проверяем текст из поля.
    if (isManualInput) {
      const text = inputValue.trim()

      // Пустое поле означает сброс даты.
      if (!text) {
        onChange(null)
        setDraftDate(null)
        setInputValue('')
        closeCalendar()
        return
      }

      // Проверяем формат даты.
      if (!/^\d{2}\.\d{2}\.\d{4}$/.test(text)) {
        setInputError('Введите дату в формате дд.мм.гггг')
        return
      }

      const parsedDate = parse(text, DATE_FORMAT, new Date())

      // Проверяем существование даты.
      if (!isValid(parsedDate)) {
        setInputError('Такой даты не существует')
        return
      }

      // Проверяем ограничения диапазона.
      if ((minDate && parsedDate < minDate) || (maxDate && parsedDate > maxDate)) {
        setInputError('Дата выходит за допустимый диапазон')
        return
      }

      onChange(parsedDate)
      setDraftDate(parsedDate)
      setInputValue(formatDate(parsedDate))
    } else {
      // При выборе мышью используем предварительную дату.
      onChange(draftDate)
      setInputValue(formatDate(draftDate))
    }

    // Общие действия после успешного подтверждения.
    closeCalendar()
  }

  const closeCalendar = () => {
    setInputError('')
    setIsManualInput(false)
    setIsOpen(false)
  }

  // Отменяем выбор даты и закрываем календарь.
  const handleCancel = () => {
    setDraftDate(value)
    setInputValue(formatDate(value))
    closeCalendar()
  }

  const CalendarWithActions = ({
    className,
    children,
  }: {
    className?: string
    children: ReactNode
  }) => (
    <CustomCalendarContainer
      className={className}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    >
      {children}
    </CustomCalendarContainer>
  )

  return (
    <div className={styles.wrapper}>
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
        onChangeRaw={(event) => {
          if (event && 'target' in event) {
            setInputValue((event.target as HTMLInputElement).value)
            setIsManualInput(true)
            setInputError('')
            event.preventDefault()
          }
        }}
        onChange={(date: Date | null) => {
          setDraftDate(date)
          setIsManualInput(false)
          setInputError('')
        }}
        open={isOpen}
        onInputClick={() => setIsOpen(true)}
        onClickOutside={handleCancel}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            handleCancel()
            return
          }

          if (!disabled && !isOpen && (event.key === 'Enter' || event.key === 'ArrowDown')) {
            event.preventDefault()
            setIsOpen(true)
          }
        }}
        shouldCloseOnSelect={false}
        calendarContainer={CalendarWithActions}
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
      />

      {(inputError || error) && (
        <p id={errorId} className={styles.error} role="alert">
          {inputError || error}
        </p>
      )}
    </div>
  )
}
