/**
 * 画像フォーマット対応ユーティリティ
 *
 * WebPをサポートするブラウザではWebPを使用し、
 * 未対応ブラウザではPNGフォールバックを提供します。
 */

// WebPサポートのキャッシュ
let webpSupported: boolean | null = null;

/**
 * ブラウザがWebPをサポートしているかチェック
 */
export async function checkWebPSupport(): Promise<boolean> {
  // キャッシュがあればそれを返す
  if (webpSupported !== null) {
    return webpSupported;
  }

  // テスト用の小さなWebP画像（1x1px透明画像）
  const webpTestImage =
    "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=";

  return new Promise<boolean>(resolve => {
    const img = new Image();

    img.onload = () => {
      // 画像が正常にロードされたかチェック
      const result = img.width === 1 && img.height === 1;
      webpSupported = result;
      resolve(result);
    };

    img.onerror = () => {
      webpSupported = false;
      resolve(false);
    };

    img.src = webpTestImage;
  });
}

/**
 * WebPサポートの同期チェック（事前にcheckWebPSupport()が呼ばれている前提）
 */
export function isWebPSupported(): boolean {
  // まだチェックされていない場合はデフォルトでtrueを返す（モダンブラウザを想定）
  // ただし、実際のチェックは非同期で行われる
  return webpSupported ?? true;
}

/**
 * 画像パスをWebP対応パスに変換
 * WebPサポートブラウザではWebP、未対応ブラウザではPNGを返す
 *
 * @param pngPath 元のPNGパス
 * @param forceFormat 強制的に指定フォーマットを使用（テスト用）
 */
export function getOptimalImagePath(pngPath: string, forceFormat?: "webp" | "png"): string {
  // forceFormatが指定されている場合はそれを優先
  if (forceFormat === "png") {
    return pngPath;
  }
  if (forceFormat === "webp") {
    return pngPath.replace(/\.png$/i, ".webp");
  }

  // WebPサポートチェック
  const useWebP = isWebPSupported();

  if (useWebP && pngPath.toLowerCase().endsWith(".png")) {
    return pngPath.replace(/\.png$/i, ".webp");
  }

  return pngPath;
}

/**
 * 複数の画像パスを最適化（srcset用）
 *
 * @param pngPath 元のPNGパス
 */
export function getImageSourceSet(pngPath: string): { webp: string; png: string } {
  return {
    webp: pngPath.replace(/\.png$/i, ".webp"),
    png: pngPath,
  };
}

/**
 * アプリケーション起動時にWebPサポートをチェック
 * この関数は main.tsx などのエントリーポイントで呼び出すことを推奨
 */
export async function initializeImageFormatSupport(): Promise<void> {
  await checkWebPSupport();

  if (webpSupported) {
    console.log("✅ WebP画像フォーマットがサポートされています");
  } else {
    console.warn("⚠️ WebPがサポートされていません。PNGフォールバックを使用します");
  }
}
