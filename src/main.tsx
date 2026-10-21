import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { store } from './store'
import { restoreLocalData } from './features/localData/model/localDataSlice'
import { restoreProfiles } from './features/profile/model/profileSlice'
import { restoreRequests, startStorageSync } from './features/requests/model/requestsSlice'

store.dispatch(restoreLocalData())
store.dispatch(restoreProfiles())
store.dispatch(restoreRequests())

// Запускаем синхронизацию между вкладками
startStorageSync(store.dispatch)

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found. Make sure <div id="root"></div> exists in index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Опционально: отписка при полном закрытии приложения (если есть такой хук/логика)
// window.addEventListener('beforeunload', () => {
//   unsubscribeFromSync()
// })
