// spec: docs/testing/TEST_PLAN.md
import { expect } from "@playwright/test";
import { test } from "./fixtures";
import * as fs from "fs/promises";
import * as os from "os";
import * as nodePath from "path";

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
    // 3-4. 保存 -> JSONエクスポート
    await appPage.getByTestId("plan-manager-menu-trigger").click();
    await appPage.getByTestId("plan-menu-export").hover();

    const [download] = await Promise.all([
      appPage.waitForEvent("download"),
      appPage.getByTestId("plan-menu-export-json").click(),
    ]);

    // ダウンロードされたファイルを確実に拡張子付きで保存してから読み込む
    // まず推奨ファイル名を取得して保存先を決める
    const filename = download.suggestedFilename();
    expect(filename).toBeTruthy();
    expect(filename).toMatch(/\.json$/i);

    const savedDir = nodePath.join(os.tmpdir(), "dsp-calc-tool-downloads");
    await fs.mkdir(savedDir, { recursive: true });
    const savedPath = nodePath.join(savedDir, filename);

    // 保存（これで拡張子付きの実体ファイルが得られる）
    await download.saveAs(savedPath);

    // 5-6. 読み込みボタンを押下して保存したJSONをインポート
    await appPage.getByTestId("plan-manager-menu-trigger").click();
    await appPage.getByTestId("plan-menu-load").click();

    // ダイアログ内の input にファイルをセットする
    await appPage.setInputFiles('[data-testid="file-import-input"]', savedPath);
    // 簡易期待: 読み込み完了メッセージが表示される
    await expect(appPage.getByTestId("import-success-message")).toBeVisible();
    // テスト終了時に一時ファイルを削除
    try {
      await fs.unlink(savedPath);
    } catch {
      // ignore
    }
  });

  test("05-02: Markdown形式の正常データ", async ({ appPage }) => {
    // 3-4. 保存 -> Markdownエクスポート
    await appPage.getByTestId("plan-manager-menu-trigger").click();
    await appPage.getByTestId("plan-menu-export").hover();

    const [download] = await Promise.all([
      appPage.waitForEvent("download"),
      appPage.getByTestId("plan-menu-export-markdown").click(),
    ]);

    // ダウンロードされたファイルを確実に拡張子付きで保存してから読み込む
    const filename = download.suggestedFilename();
    expect(filename).toBeTruthy();
    expect(filename).toMatch(/\.(md|markdown)$/i);

    const savedDir = nodePath.join(os.tmpdir(), "dsp-calc-tool-downloads");
    await fs.mkdir(savedDir, { recursive: true });
    const savedPath = nodePath.join(savedDir, filename);
    await download.saveAs(savedPath);

    // 5-6. 読み込みボタンを押下して保存したMarkdownをインポート
    await appPage.getByTestId("plan-manager-menu-trigger").click();
    await appPage.getByTestId("plan-menu-load").click();
    await appPage.setInputFiles('[data-testid="file-import-input"]', savedPath);
    // 簡易期待: 読み込み完了メッセージが表示される
    await expect(appPage.getByTestId("import-success-message")).toBeVisible();
    try {
      await fs.unlink(savedPath);
    } catch {
      // ignore
    }
  });

  test("05-03: csv形式の正常データ", async ({ appPage }) => {
    // 3-4. 保存 -> CSVエクスポート
    await appPage.getByTestId("plan-manager-menu-trigger").click();
    await appPage.getByTestId("plan-menu-export").hover();

    const [download] = await Promise.all([
      appPage.waitForEvent("download"),
      appPage.getByTestId("plan-menu-export-csv").click(),
    ]);

    // ダウンロードされたファイルを確実に拡張子付きで保存してから読み込む
    const filename = download.suggestedFilename();
    expect(filename).toBeTruthy();
    expect(filename).toMatch(/\.csv$/i);

    const savedDir = nodePath.join(os.tmpdir(), "dsp-calc-tool-downloads");
    await fs.mkdir(savedDir, { recursive: true });
    const savedPath = nodePath.join(savedDir, filename);
    await download.saveAs(savedPath);

    // 5-6. 読み込みボタンを押下して保存したCSVをインポート
    await appPage.getByTestId("plan-manager-menu-trigger").click();
    await appPage.getByTestId("plan-menu-load").click();
    await appPage.setInputFiles('[data-testid="file-import-input"]', savedPath);
    // 簡易期待: 読み込み完了メッセージが表示される
    await expect(appPage.getByTestId("import-success-message")).toBeVisible();
    try {
      await fs.unlink(savedPath);
    } catch {
      // ignore
    }
  });

  test("05-04: Excel形式の正常データ", async ({ appPage }) => {
    // 3-4. 保存 -> Excelエクスポート
    await appPage.getByTestId("plan-manager-menu-trigger").click();
    await appPage.getByTestId("plan-menu-export").hover();

    const [download] = await Promise.all([
      appPage.waitForEvent("download"),
      appPage.getByTestId("plan-menu-export-excel").click(),
    ]);

    // ダウンロードされたファイルを確実に拡張子付きで保存してから読み込む
    const filename = download.suggestedFilename();
    expect(filename).toBeTruthy();
    expect(filename).toMatch(/\.xlsx$/i);

    const savedDir = nodePath.join(os.tmpdir(), "dsp-calc-tool-downloads");
    await fs.mkdir(savedDir, { recursive: true });
    const savedPath = nodePath.join(savedDir, filename);
    await download.saveAs(savedPath);

    // 5-6. 読み込みボタンを押下して保存したExcelをインポート
    await appPage.getByTestId("plan-manager-menu-trigger").click();
    await appPage.getByTestId("plan-menu-load").click();
    await appPage.setInputFiles('[data-testid="file-import-input"]', savedPath);
    // 簡易期待: 読み込み完了メッセージが表示される
    await expect(appPage.getByTestId("import-success-message")).toBeVisible();
    try {
      await fs.unlink(savedPath);
    } catch {
      // ignore
    }
  });

  test("05-05: json形式の異常データ", async ({ appPage }) => {
    const fixtureDir = nodePath.join(process.cwd(), "tests", "fixtures", "05-import-export");
    const fixtures = ["invalid-json.json", "missing-fields.json", "wrong-types.json"];

    for (const name of fixtures) {
      const filePath = nodePath.join(fixtureDir, name);
      // 存在確認してわかりやすいエラーにする
      try {
        await fs.stat(filePath);
      } catch (err) {
        throw new Error(
          `Fixture not found: ${filePath}. Please add it to tests/fixtures/05-import-export/`
        );
      }

      await appPage.getByTestId("plan-manager-menu-trigger").click();
      await appPage.getByTestId("plan-menu-load").click();
      // 直接 input にファイルをセット
      await appPage.setInputFiles('[data-testid="file-import-input"]', filePath);
      // エラー表示を期待
      await expect(appPage.getByTestId("import-error-message")).toBeVisible();
      // 閉じる等の UI があればここで閉じる（保存されている場合のため）
      await appPage.getByTestId("load-dialog-close-button").click();
    }
  });

  test("05-06: Markdown形式の異常データ", async ({ appPage }) => {
    const fixtureDir = nodePath.join(process.cwd(), "tests", "fixtures", "05-import-export");
    const filePath = nodePath.join(fixtureDir, "malformed.md");
    // 存在確認してわかりやすいエラーにする
    try {
      await fs.stat(filePath);
    } catch (err) {
      throw new Error(
        `Fixture not found: ${filePath}. Please add it to tests/fixtures/05-import-export/`
      );
    }

    await appPage.getByTestId("plan-manager-menu-trigger").click();
    await appPage.getByTestId("plan-menu-load").click();
    // 直接 input にファイルをセット
    await appPage.setInputFiles('[data-testid="file-import-input"]', filePath);
    // エラー表示を期待
    await expect(appPage.getByTestId("import-error-message")).toBeVisible();
    // 閉じる等の UI があればここで閉じる（保存されている場合のため）
    await appPage.getByTestId("load-dialog-close-button").click();
  });

  test("05-07: csv形式の異常データ", async ({ appPage }) => {
    const fixtureDir = nodePath.join(process.cwd(), "tests", "fixtures", "05-import-export");
    const filePath = nodePath.join(fixtureDir, "invalid-csv.csv");
    // 存在確認してわかりやすいエラーにする
    try {
      await fs.stat(filePath);
    } catch (err) {
      throw new Error(
        `Fixture not found: ${filePath}. Please add it to tests/fixtures/05-import-export/`
      );
    }

    await appPage.getByTestId("plan-manager-menu-trigger").click();
    await appPage.getByTestId("plan-menu-load").click();
    // 直接 input にファイルをセット
    await appPage.setInputFiles('[data-testid="file-import-input"]', filePath);
    // エラー表示を期待
    await expect(appPage.getByTestId("import-error-message")).toBeVisible();
    // 閉じる等の UI があればここで閉じる（保存されている場合のため）
    await appPage.getByTestId("load-dialog-close-button").click();
  });

  test("05-08: Excel形式の異常データ", async ({ appPage }) => {
    const fixtureDir = nodePath.join(process.cwd(), "tests", "fixtures", "05-import-export");
    const filePath = nodePath.join(fixtureDir, "invalid-excel.xlsx");
    // 存在確認してわかりやすいエラーにする
    try {
      await fs.stat(filePath);
    } catch (err) {
      throw new Error(
        `Fixture not found: ${filePath}. Please add it to tests/fixtures/05-import-export/`
      );
    }

    await appPage.getByTestId("plan-manager-menu-trigger").click();
    await appPage.getByTestId("plan-menu-load").click();
    // 直接 input にファイルをセット
    await appPage.setInputFiles('[data-testid="file-import-input"]', filePath);
    // エラー表示を期待
    await expect(appPage.getByTestId("import-error-message")).toBeVisible();
    // 閉じる等の UI があればここで閉じる（保存されている場合のため）
    await appPage.getByTestId("load-dialog-close-button").click();
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

    const savedDir = nodePath.join(os.tmpdir(), "dsp-calc-tool-downloads");
    await fs.mkdir(savedDir, { recursive: true });
    const savedPath = nodePath.join(savedDir, filename);
    await download.saveAs(savedPath);

    // ファイルがダウンロードされたことを確認
    const stats = await fs.stat(savedPath);
    expect(stats.size).toBeGreaterThan(0);

    // テスト終了時に一時ファイルを削除
    try {
      await fs.unlink(savedPath);
    } catch {
      // ignore
    }
  });
});
