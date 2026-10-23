import { forwardRef, useState } from 'react'
import { FormInput } from '../FormInput'
import type { FormInputProps } from '../FormInput'

import eyeIcon from '@/shared/assets/icons/eye.svg'

export type PasswordInputProps = Omit<FormInputProps, 'type' | 'endAdornment'>

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ disabled, ...props }, ref) {
    const [visible, setVisible] = useState(false)

    return (
      <FormInput
        {...props}
        ref={ref}
        disabled={disabled}
        type={visible ? 'text' : 'password'}
        endAdornment={
          <button
            type="button"
            disabled={disabled}
            aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
            aria-pressed={visible}
            onClick={() => setVisible((current) => !current)}
          >
            <img src={eyeIcon} alt="" width={24} height={24} aria-hidden="true" />
          </button>
        }
      />
    )
  },
)
