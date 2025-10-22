import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n' // Initialize i18n
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { preloadSpriteData } from './hooks/useSpriteData'

// アプリをレンダリングする前にスプライトデータをプリロード
preloadSpriteData().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}).catch(error => {
  console.error('Failed to preload sprite data:', error);
  // エラーが発生してもアプリはレンダリング（フォールバックで個別PNGを使用）
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
});
