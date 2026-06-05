import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global error handler for dynamic import chunk errors
if (typeof window !== 'undefined') {
  const handleChunkError = (message?: string) => {
    if (message && message.includes('Failed to fetch dynamically imported module')) {
      console.warn('Chunk loading failed, force reloading page...');
      window.location.reload();
    }
  };

  window.addEventListener('error', (e) => {
    handleChunkError(e.message);
  });

  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason && e.reason.message) {
      handleChunkError(e.reason.message);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);

