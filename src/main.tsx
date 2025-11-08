/**
 * アプリケーションのエントリーポイント
 *
 * - グローバルスタイルとi18nを初期化
 * - ブートストラップ処理を実行
 */

import "./index.css";
import "./i18n"; // Initialize i18n
import { bootstrap } from "./bootstrap/startup";

// アプリケーションを起動
bootstrap().catch(error => {
  console.error("Failed to bootstrap application:", error);
  // 致命的なエラーの場合はユーザーにメッセージを表示
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
      <div style="text-align: center; max-width: 500px; padding: 20px;">
        <h1 style="color: #e53e3e; margin-bottom: 16px;">Application Failed to Start</h1>
        <p style="color: #4a5568; margin-bottom: 8px;">An error occurred while initializing the application.</p>
        <p style="color: #718096; font-size: 14px;">Please try refreshing the page. If the problem persists, contact support.</p>
        <pre style="background: #f7fafc; padding: 12px; border-radius: 4px; margin-top: 16px; text-align: left; overflow: auto; font-size: 12px;">${error instanceof Error ? error.message : String(error)}</pre>
      </div>
    </div>
  `;
});
