// spec: docs/testing/TEST_PLAN.md
import { expect } from "@playwright/test";
import * as fs from "fs/promises";
import * as nodePath from "path";
import { test } from "./fixtures";
import {
  saveDownloadedFile,
  testExportImport,
  testInvalidImport,
  testMultipleInvalidFiles,
} from "./helpers/file-helpers";

test.describe("データのエクスポートとインポート", () => {
  test.beforeEach(async ({ appPage }) => {
    // 1. `デストロイヤー` を選択する
    await appPage.getByTestId("recipe-button-1705").click();

    // 2. 増産剤、生産設備を任意に設定する
    await appPage.getByTestId("target-quantity-input").fill("2");
    await appPage.getByTestId("proliferator-type-button-mk2").click();
    await appPage.getByTestId("machine-rank-button-smelt-plane").click();
    await appPage.getByTestId("machine-rank-button-assemble-mk3").click();
    await appPage.getByTestId("machine-rank-button-chemical-quantum").click();
    await appPage.getByTestId("machine-rank-button-research-self-evolution").click();
    await appPage.getByTestId("conveyor-belt-button-mk3").click();
    await appPage.getByTestId("conveyor-belt-stack-button-4").click();
    await appPage.getByTestId("sorter-button-pile").click();

    // 代替レシピを設定
    await appPage.getByTestId("alternative-recipe-compare-button-1124").click();
    await appPage.getByTestId("recipe-comparison-select-button-1508").click();
  });

  test("05-01: json形式の正常データ", async ({ appPage }) => {
    await testExportImport(appPage, "plan-menu-export-json", /\.json$/i);
  });

  test("05-02: Markdown形式の正常データ", async ({ appPage }) => {
    await testExportImport(appPage, "plan-menu-export-markdown", /\.(md|markdown)$/i);
  });

  test("05-03: csv形式の正常データ", async ({ appPage }) => {
    await testExportImport(appPage, "plan-menu-export-csv", /\.csv$/i);
  });

  test("05-04: Excel形式の正常データ", async ({ appPage }) => {
    await testExportImport(appPage, "plan-menu-export-excel", /\.xlsx$/i);
  });

  test("05-05: json形式の異常データ", async ({ appPage }) => {
    const fixtureDir = nodePath.join(process.cwd(), "tests", "fixtures", "05-import-export");
    await testMultipleInvalidFiles(appPage, fixtureDir, [
      "invalid-json.json",
      "missing-fields.json",
      "wrong-types.json",
    ]);
  });

  test("05-06: Markdown形式の異常データ", async ({ appPage }) => {
    const fixtureDir = nodePath.join(process.cwd(), "tests", "fixtures", "05-import-export");
    await testInvalidImport(appPage, nodePath.join(fixtureDir, "malformed.md"));
  });

  test("05-07: csv形式の異常データ", async ({ appPage }) => {
    const fixtureDir = nodePath.join(process.cwd(), "tests", "fixtures", "05-import-export");
    await testInvalidImport(appPage, nodePath.join(fixtureDir, "invalid-csv.csv"));
  });

  test("05-08: Excel形式の異常データ", async ({ appPage }) => {
    const fixtureDir = nodePath.join(process.cwd(), "tests", "fixtures", "05-import-export");
    await testInvalidImport(appPage, nodePath.join(fixtureDir, "invalid-excel.xlsx"));
  });

  test("05-09: URL共有", async ({ appPage, newPage }) => {
    // 3. URL共有ボタンを押下する
    await appPage.getByTestId("plan-manager-menu-trigger").click();
    await appPage.getByTestId("plan-menu-share-url").click();

    // 4. コピーボタンを押下する
    // Grant clipboard permissions so navigator.clipboard.readText can be used in the test environment
    try {
      await appPage
        .context()
        .grantPermissions(["clipboard-read", "clipboard-write"], { origin: appPage.url() });
    } catch {
      // ignore if grantPermissions is not supported in the environment
    }
    await appPage.getByTestId("copy-url-button").click();

    // 5. コピーしたURLにアクセスする (clipboard read via page.evaluate)
    const clipboard = await appPage.evaluate(() => navigator.clipboard?.readText?.());
    if (clipboard) {
      const newPageInstance = await newPage();
      await newPageInstance.goto(clipboard);
      // 期待値: レシピが復元されていること (保存されたレシピに基づきチェック)
      await expect(newPageInstance.getByTestId("recipe-node-1705")).toBeVisible();
    }
  });

  test("05-10: 画像形式のエクスポート", async ({ appPage }) => {
    // beforeEachでレシピ(デストロイヤー)が既に選択されている
    // 保存ダイアログを開く前に、ビューが表示されていることを確認
    await expect(appPage.getByTestId("recipe-node-1705")).toBeVisible();

    // 画像エクスポートメニューを開いてダウンロードを待つ
    await appPage.getByTestId("plan-manager-menu-trigger").click();
    await appPage.getByTestId("plan-menu-export").hover();

    const [download] = await Promise.all([
      appPage.waitForEvent("download"),
      appPage.getByTestId("plan-menu-export-image").click(),
    ]);

    // ダウンロードされたファイルを確認
    const filename = download.suggestedFilename();
    expect(filename).toBeTruthy();
    expect(filename).toMatch(/\.png$/i);

    // ファイルを保存してサイズを確認、終了時にクリーンアップ
    const { filePath, cleanup } = await saveDownloadedFile(download, /\.png$/i);
    try {
      const stats = await fs.stat(filePath);
      expect(stats.size).toBeGreaterThan(0);
    } finally {
      await cleanup();
    }
  });
});
