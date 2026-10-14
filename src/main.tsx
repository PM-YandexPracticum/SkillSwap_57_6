import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { store } from './store'
import { restoreLocalData } from './features/localData/model/localDataSlice'

store.dispatch(restoreLocalData())
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found. Make sure <div id="root"> exists in index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
