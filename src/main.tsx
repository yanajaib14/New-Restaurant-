import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
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
          <Analytics />
        </ErrorBoundary>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);

// Register the PWA service worker in production only (avoids interfering with Vite HMR in dev).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("Service worker registration failed:", err);
    });
  });
}