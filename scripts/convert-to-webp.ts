/**
 * PNG画像をWebPに変換するスクリプト
 *
 * このスクリプトは以下のことを行います：
 * 1. public/data/配下のすべてのPNG画像を検出
 * 2. 各PNG画像をWebP形式に変換（品質90%）
 * 3. 元のPNGファイルは保持（フォールバック用）
 * 4. 変換結果を報告
 */

import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// プロジェクトルートからの相対パス
const PUBLIC_DATA_DIR = path.join(__dirname, "..", "public", "data");

interface ConversionResult {
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ file: string; error: string }>;
}

/**
 * ディレクトリを再帰的に走査してPNGファイルを検出
 */
async function findPngFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // ディレクトリの場合、再帰的に検索
      const subFiles = await findPngFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) {
      // PNGファイルの場合、リストに追加
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * PNG画像をWebPに変換
 */
async function convertPngToWebp(pngPath: string): Promise<void> {
  const webpPath = pngPath.replace(/\.png$/i, ".webp");

  // 既にWebPファイルが存在する場合はスキップ
  if (fs.existsSync(webpPath)) {
    const pngStat = await fs.promises.stat(pngPath);
    const webpStat = await fs.promises.stat(webpPath);

    // PNGファイルの方が新しい場合のみ再変換
    if (pngStat.mtimeMs <= webpStat.mtimeMs) {
      return; // スキップ
    }
  }

  // 変換実行
  await sharp(pngPath)
    .webp({ quality: 90, effort: 6 }) // 品質90%、圧縮レベル6
    .toFile(webpPath);
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
  console.log("🔍 PNG画像を検索中...");
  console.log(`📂 対象ディレクトリ: ${PUBLIC_DATA_DIR}\n`);

  // PNGファイルを検出
  const pngFiles = await findPngFiles(PUBLIC_DATA_DIR);
  console.log(`✅ ${pngFiles.length}個のPNG画像を検出しました\n`);

  if (pngFiles.length === 0) {
    console.log("⚠️ 変換対象のPNG画像が見つかりませんでした");
    return;
  }

  // 変換処理
  console.log("🔄 WebPへの変換を開始します...\n");
  const result: ConversionResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  for (let i = 0; i < pngFiles.length; i++) {
    const pngFile = pngFiles[i];
    const relativePath = path.relative(PUBLIC_DATA_DIR, pngFile);

    try {
      const webpPath = pngFile.replace(/\.png$/i, ".webp");

      // 既にWebPが存在し、PNGより新しい場合はスキップ
      if (fs.existsSync(webpPath)) {
        const pngStat = await fs.promises.stat(pngFile);
        const webpStat = await fs.promises.stat(webpPath);

        if (pngStat.mtimeMs <= webpStat.mtimeMs) {
          result.skipped++;
          process.stdout.write(`⏩ [${i + 1}/${pngFiles.length}] スキップ: ${relativePath}\r`);
          continue;
        }
      }

      await convertPngToWebp(pngFile);
      result.success++;
      process.stdout.write(`✅ [${i + 1}/${pngFiles.length}] 変換完了: ${relativePath}\r`);
    } catch (error) {
      result.failed++;
      result.errors.push({
        file: relativePath,
        error: error instanceof Error ? error.message : String(error),
      });
      process.stdout.write(`❌ [${i + 1}/${pngFiles.length}] 変換失敗: ${relativePath}\r`);
    }
  }

  // 結果レポート
  console.log("\n\n📊 変換結果:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ 成功: ${result.success}個`);
  console.log(`⏩ スキップ: ${result.skipped}個`);
  console.log(`❌ 失敗: ${result.failed}個`);
  console.log(`📁 合計: ${pngFiles.length}個`);

  if (result.errors.length > 0) {
    console.log("\n❌ エラー詳細:");
    result.errors.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
  }

  // 削減サイズの概算を計算
  if (result.success > 0) {
    console.log("\n💾 ストレージ効率:");
    console.log("   WebPは通常、PNGより25-35%小さくなります");
  }

  console.log("\n✨ 処理完了！");
}

// スクリプト実行
main().catch(error => {
  console.error("❌ エラーが発生しました:", error);
  process.exit(1);
});
