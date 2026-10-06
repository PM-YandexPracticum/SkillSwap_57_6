import { StoreProvider } from './providers/StoreProvider'
import { AppRouter } from './providers/RouterProvider'
import './styles/global.css'
import { APP_TITLE } from '../shared/lib/appTitle'
import { useEffect } from 'react'

export function App() {
  useEffect(() => {
    document.title = APP_TITLE
  }, [])

  return (
    <StoreProvider>
      <AppRouter />
    </StoreProvider>
  )
}
