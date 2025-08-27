import './assets/index.css';
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AppProvider } from './context/AppContext'
import ErrorBoundary from './components/ErrorBoundary'; // Import ErrorBoundary

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary> {/* Wrap with ErrorBoundary */}
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary> {/* Close ErrorBoundary */}
  </React.StrictMode>
)