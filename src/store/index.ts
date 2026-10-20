import { configureStore } from '@reduxjs/toolkit'
import catalogReducer from '../features/catalog/model/catalogSlice'
import localDataReducer from '@/features/localData/model/localDataSlice'
import favoritesReducer from '@/features/favorites/model/favoritesSlice'
import { restoreFavoritesThunk } from '@/features/favorites/model/favoritesThunks'
import requestsReducer from '../features/requests/model/requestsSlice';
// Импортируй свои slice'ы здесь по мере их создания:
// import skillsReducer from '@/entities/skill/model/skillsSlice'
// import authReducer from '@/features/auth/model/authSlice'

export const store = configureStore({
  reducer: {
    catalog: catalogReducer,
    localData: localDataReducer,
    favorites: favoritesReducer,
    requests: requestsReducer
    // skills: skillsReducer,
    // auth: authReducer,
  },
})

store.dispatch(restoreFavoritesThunk())

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
