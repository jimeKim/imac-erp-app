import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app/App'
import './styles/globals.css'
import './shared/services/i18n'
import { I18nextProvider } from 'react-i18next'
import i18n from './shared/services/i18n'
import { AuthProvider } from './app/providers/AuthProvider'
import { ErrorBoundary } from './shared/components/feedback'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </I18nextProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
