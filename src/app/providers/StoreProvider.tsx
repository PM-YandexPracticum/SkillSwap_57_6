import { Provider } from 'react-redux'
import { store } from '@/store'
import { subscribeFavoritesStorage } from '@/features/favorites/model/favoritesThunks'
import { useEffect, type ReactNode } from 'react'

interface StoreProviderProps {
  children: ReactNode
}

export function StoreProvider({ children }: StoreProviderProps) {
  useEffect(() => store.dispatch(subscribeFavoritesStorage()), [])

  return <Provider store={store}>{children}</Provider>
}
