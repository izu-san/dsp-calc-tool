/**
 * 画像形式のエクスポート機能
 *
 * html2canvas を使用してDOM要素を画像に変換する
 * 動的インポートで bundle size を最適化
 */

import type { ImageExportOptions } from "../../types/export";

/**
 * 画像形式でエクスポートする
 *
 * @param selector - キャプチャするDOM要素のセレクタ
 * @param options - 画像エクスポートオプション
 * @returns Promise<Blob> - 画像データ
 */
export async function exportToImage(selector: string, options: ImageExportOptions): Promise<Blob> {
  // 動的インポートで html2canvas をロード
  const html2canvas = (await import("html2canvas")).default;

  // DOM要素を取得
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  // 解像度スケールを計算
  const scale = getScale(options.resolution);

  // html2canvas でキャプチャ
  const canvas = await html2canvas(element as HTMLElement, {
    scale: scale,
    backgroundColor: options.backgroundColor,
    useCORS: true,
    allowTaint: true,
    logging: false,
    width: element.clientWidth,
    height: element.clientHeight,
  });

  // Blob として返す
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      },
      `image/${options.format}`,
      options.quality / 100
    );
  });
}

/**
 * 解像度からスケールを計算
 */
function getScale(resolution: "1x" | "2x" | "4x"): number {
  switch (resolution) {
    case "1x":
      return 1;
    case "2x":
      return 2;
    case "4x":
      return 4;
    default:
      return 1;
  }
}

/**
 * 複数のビューを結合してエクスポート
 *
 * @param selectors - キャプチャするDOM要素のセレクタ配列
 * @param options - 画像エクスポートオプション
 * @returns Promise<Blob> - 画像データ
 */
export async function exportMultipleViews(
  selectors: string[],
  options: ImageExportOptions
): Promise<Blob> {
  // 動的インポートで html2canvas をロード
  const html2canvas = (await import("html2canvas")).default;

  // 各要素をキャプチャ
  const canvases: HTMLCanvasElement[] = [];
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const scale = getScale(options.resolution);
      const canvas = await html2canvas(element as HTMLElement, {
        scale: scale,
        backgroundColor: options.backgroundColor,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: element.clientWidth,
        height: element.clientHeight,
      });
      canvases.push(canvas);
    }
  }

  if (canvases.length === 0) {
    throw new Error("No elements found to capture");
  }

  // 結合用のキャンバスを作成
  const totalWidth = Math.max(...canvases.map(c => c.width));
  const totalHeight =
    canvases.reduce((sum, c) => sum + c.height, 0) + options.padding * (canvases.length - 1);

  const combinedCanvas = document.createElement("canvas");
  combinedCanvas.width = totalWidth;
  combinedCanvas.height = totalHeight;

  const ctx = combinedCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // 背景色を塗る
  ctx.fillStyle = options.backgroundColor;
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // 各キャンバスを縦に結合
  let currentY = 0;
  for (const canvas of canvases) {
    ctx.drawImage(canvas, 0, currentY);
    currentY += canvas.height + options.padding;
  }

  // Blob として返す
  return new Promise((resolve, reject) => {
    combinedCanvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      },
      `image/${options.format}`,
      options.quality / 100
    );
  });
}
