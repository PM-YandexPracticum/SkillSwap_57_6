import { configureStore } from '@reduxjs/toolkit'
import catalogReducer from '../features/catalog/model/catalogSlice'
import localDataReducer from '@/features/localData/model/localDataSlice'
import favoritesReducer from '@/features/favorites/model/favoritesSlice'
import { switchFavoritesOwner } from '@/features/favorites/model/favoritesThunks'
import authReducer from '@/features/auth/model/authSlice'
import profileReducer from '@/features/profile/model/profileSlice'
import requestsReducer from '@/features/requests/model/requestsSlice'
// Импортируй свои slice'ы здесь по мере их создания:
// import skillsReducer from '@/entities/skill/model/skillsSlice'
// import authReducer from '@/features/auth/model/authSlice'

export const store = configureStore({
  reducer: {
    catalog: catalogReducer,
    localData: localDataReducer,
    favorites: favoritesReducer,
    requests: requestsReducer,
    // skills: skillsReducer,
    auth: authReducer,
    profile: profileReducer,
  },
})

let favoritesOwnerId = store.getState().auth.user?.id ?? null
store.dispatch(switchFavoritesOwner(favoritesOwnerId))
store.subscribe(() => {
  const ownerId = store.getState().auth.user?.id ?? null
  if (ownerId === favoritesOwnerId) return
  favoritesOwnerId = ownerId
  store.dispatch(switchFavoritesOwner(ownerId))
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
