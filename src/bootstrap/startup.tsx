/**
 * アプリケーション起動時の初期化処理
 *
 * - 画像フォーマットサポートの初期化
 * - スプライトデータのプリロード
 * - React ルートのマウント
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "../App";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ToastProvider } from "../components/ToastProvider";
import { preloadSpriteData } from "../hooks/useSpriteData";
import { initializeImageFormatSupport } from "../utils/imageFormat";
import { logger } from "../utils/logger";

/**
 * アプリケーションのブートストラップ処理
 *
 * 1. 画像フォーマットサポートを初期化
 * 2. スプライトデータをプリロード
 * 3. React アプリケーションをマウント
 */
export async function bootstrap(): Promise<void> {
  // 1. 画像フォーマットサポートを初期化
  await initializeImageFormatSupport();

  // 2. DOM要素の存在確認
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found. Make sure index.html has a div with id='root'");
  }

  // 3. React ルートを作成
  const root = createRoot(rootElement);

  // 4. React コンポーネントツリーを定義
  const renderApp = () => {
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ErrorBoundary>
      </StrictMode>
    );
  };

  // 5. スプライトデータをプリロード
  try {
    await preloadSpriteData();
    logger.info("Sprite data preloaded successfully");
  } catch (error) {
    // エラーが発生してもアプリはレンダリング（フォールバックで個別PNGを使用）
    logger.warn("Failed to preload sprite data, falling back to individual PNG files:", error);
  }

  // 6. アプリケーションをレンダリング
  renderApp();
}
