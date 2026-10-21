import { ROUTES } from '@/shared/lib/constants'

export function getSafeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || !value) {
    return ROUTES.HOME
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return ROUTES.HOME
  }

  if (value.includes('\\')) {
    return ROUTES.HOME
  }

  try {
    const url = new URL(value, 'http://localhost')
    const pathname = url.pathname.toLowerCase()

    if (pathname === ROUTES.LOGIN || pathname === ROUTES.REGISTER) {
      return ROUTES.HOME
    }

    return url.pathname + url.search + url.hash
  } catch {
    return ROUTES.HOME
  }
}
