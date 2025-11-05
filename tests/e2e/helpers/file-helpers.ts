import { Download, Page } from "@playwright/test";
import { promises as fs } from "fs";
import os from "os";
import nodePath from "path";

/**
 * ダウンロードディレクトリを取得または作成
 */
async function getDownloadDir(): Promise<string> {
  const downloadDir = nodePath.join(os.tmpdir(), "dsp-calc-tool-downloads");
  await fs.mkdir(downloadDir, { recursive: true });
  return downloadDir;
}

/**
 * ダウンロードファイルを保存して、クリーンアップ関数を返す
 */
export async function saveDownloadedFile(
  download: Download,
  expectedExtension?: RegExp
): Promise<{ filePath: string; cleanup: () => Promise<void> }> {
  const filename = download.suggestedFilename();

  if (expectedExtension) {
    if (!filename.match(expectedExtension)) {
      throw new Error(`Downloaded file extension does not match expected pattern: ${filename}`);
    }
  }

  const downloadDir = await getDownloadDir();
  const filePath = nodePath.join(downloadDir, filename);
  await download.saveAs(filePath);

  const cleanup = async () => {
    try {
      await fs.unlink(filePath);
    } catch {
      // ファイルが既に削除されている場合は無視
    }
  };

  return { filePath, cleanup };
}

/**
 * ファイルをダウンロードしてエクスポート・インポートのテストを実行
 */
export async function testExportImport(
  page: Page,
  exportTestId: string,
  expectedExtension: RegExp
): Promise<void> {
  // エクスポート
  await page.getByTestId("plan-manager-menu-trigger").click();
  await page.getByTestId("plan-menu-export").hover();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId(exportTestId).click(),
  ]);

  const { filePath, cleanup } = await saveDownloadedFile(download, expectedExtension);

  try {
    // インポート
    await page.getByTestId("plan-manager-menu-trigger").click();
    await page.getByTestId("plan-menu-load").click();
    await page.setInputFiles('[data-testid="file-import-input"]', filePath);

    // 成功メッセージを待つ
    await page.getByTestId("import-success-message").waitFor({ state: "visible" });
  } finally {
    await cleanup();
  }
}

/**
 * フィクスチャファイルが存在するか確認
 */
export async function ensureFixtureExists(filePath: string): Promise<void> {
  try {
    await fs.stat(filePath);
  } catch {
    throw new Error(`Fixture file not found: ${filePath}\nPlease ensure the fixture file exists.`);
  }
}

/**
 * 異常データのインポートテストを実行
 */
export async function testInvalidImport(page: Page, fixturePath: string): Promise<void> {
  await ensureFixtureExists(fixturePath);

  await page.getByTestId("plan-manager-menu-trigger").click();
  await page.getByTestId("plan-menu-load").click();
  await page.setInputFiles('[data-testid="file-import-input"]', fixturePath);

  // エラーメッセージを待つ
  await page.getByTestId("import-error-message").waitFor({ state: "visible" });

  // ダイアログを閉じる
  await page.getByTestId("load-dialog-close-button").click();
}

/**
 * 複数の異常データファイルをテスト
 */
export async function testMultipleInvalidFiles(
  page: Page,
  fixtureDir: string,
  filenames: string[]
): Promise<void> {
  for (const filename of filenames) {
    const filePath = nodePath.join(fixtureDir, filename);
    await testInvalidImport(page, filePath);
  }
}
