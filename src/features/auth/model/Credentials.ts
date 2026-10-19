export interface Credentials {
  email: string
  password: string
}

export type AuthMode = 'login' | 'register'

export const validateCredentials = (
  values: Partial<Credentials>,
  mode: AuthMode,
): Record<string, string> => {
  const errors: Record<string, string> = {}

  if (!values.email) {
    errors.email = 'Email обязателен'
  } else {
    const trimmed = values.email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      errors.email = 'Некорректный email'
    }
  }

  if (!values.password) {
    errors.password = 'Пароль обязателен'
  } else if (mode === 'register' && values.password.length < 8) {
    errors.password = 'Пароль должен содержать минимум 8 знаков'
  }

  return errors
}
