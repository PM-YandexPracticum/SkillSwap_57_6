import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { selectIsAuthenticated } from '../model/authSlice'
import { ROUTES } from '@/shared/lib/constants'

export function ProtectedRoute() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        replace
        state={{
          returnTo: location.pathname + location.search + location.hash,
        }}
      />
    )
  }

  return <Outlet />
}
