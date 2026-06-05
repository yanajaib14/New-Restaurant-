import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const root = document.getElementById('root')!;

root.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#F7F7F3;"><p>Loading restaurant app...</p></div>';

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary componentName="App">
      <AuthProvider>
        <ErrorBoundary componentName="Auth">
          <App />
        </ErrorBoundary>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);