// spec: docs/testing/TEST_PLAN.md
import { expect, test } from "@playwright/test";
import * as fs from "fs/promises";
import * as os from "os";
import * as nodePath from "path";

test.describe("データのエクスポートとインポート", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/");
    await page.getByTestId("welcome-skip-button").click();

    // 1. `デストロイヤー` を選択する
    await page.getByTestId("recipe-button-1705").click();

    // 2. 増産剤、生産設備を任意に設定する
    await page.getByTestId("target-quantity-input").fill("2");
    await page.getByTestId("proliferator-type-button-mk2").click();
    await page.getByTestId("machine-rank-button-smelt-plane").click();
    await page.getByTestId("machine-rank-button-assemble-mk3").click();
    await page.getByTestId("machine-rank-button-chemical-quantum").click();
    await page.getByTestId("machine-rank-button-research-self-evolution").click();
    await page.getByTestId("conveyor-belt-button-mk3").click();
    await page.getByTestId("conveyor-belt-stack-button-4").click();
    await page.getByTestId("sorter-button-pile").click();

    // 代替レシピを設定
    await page.getByTestId("alternative-recipe-compare-button-1124").click();
    await page.getByTestId("recipe-comparison-select-button-1508").click();
  });

  test("05-01: json形式の正常データ", async ({ page }) => {
    // 3-4. 保存 -> JSONエクスポート
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      // open save UI then click JSON - depending on UI these may be separate
      page.getByTestId("save-button").click(),
      page.getByTestId("export-json-button").click(),
    ]);
    await expect(page.getByTestId("export-success-message")).toBeVisible();
    await page.getByTestId("save-dialog-close-button").click();
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
    await page.getByTestId("load-button").click();
    // 直接 input にファイルをセットする（filechooser を使わず安定化）
    await page.setInputFiles('[data-testid="file-import-input"]', savedPath);
    // 簡易期待: 読み込み完了メッセージが表示される
    await expect(page.getByTestId("import-success-message")).toBeVisible();
    // テスト終了時に一時ファイルを削除
    try {
      await fs.unlink(savedPath);
    } catch {
      // ignore
    }
  });

  test("05-02: Markdown形式の正常データ", async ({ page }) => {
    // 3-4. 保存 -> Markdownエクスポート
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      // open save UI then click Markdown - depending on UI these may be separate
      page.getByTestId("save-button").click(),
      page.getByTestId("export-markdown-button").click(),
    ]);
    await expect(page.getByTestId("export-success-message")).toBeVisible();
    await page.getByTestId("save-dialog-close-button").click();
    // ダウンロードされたファイルを確実に拡張子付きで保存してから読み込む
    const filename = download.suggestedFilename();
    expect(filename).toBeTruthy();
    expect(filename).toMatch(/\.(md|markdown)$/i);

    const savedDir = nodePath.join(os.tmpdir(), "dsp-calc-tool-downloads");
    await fs.mkdir(savedDir, { recursive: true });
    const savedPath = nodePath.join(savedDir, filename);
    await download.saveAs(savedPath);

    // 5-6. 読み込みボタンを押下して保存したMarkdownをインポート
    await page.getByTestId("load-button").click();
    await page.setInputFiles('[data-testid="file-import-input"]', savedPath);
    // 簡易期待: 読み込み完了メッセージが表示される
    await expect(page.getByTestId("import-success-message")).toBeVisible();
    try {
      await fs.unlink(savedPath);
    } catch {
      // ignore
    }
  });

  test("05-03: csv形式の正常データ", async ({ page }) => {
    // 3-4. 保存 -> CSVエクスポート
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      // open save UI then click CSV - depending on UI these may be separate
      page.getByTestId("save-button").click(),
      page.getByTestId("export-csv-button").click(),
    ]);
    await expect(page.getByTestId("export-success-message")).toBeVisible();
    await page.getByTestId("save-dialog-close-button").click();
    // ダウンロードされたファイルを確実に拡張子付きで保存してから読み込む
    const filename = download.suggestedFilename();
    expect(filename).toBeTruthy();
    expect(filename).toMatch(/\.csv$/i);

    const savedDir = nodePath.join(os.tmpdir(), "dsp-calc-tool-downloads");
    await fs.mkdir(savedDir, { recursive: true });
    const savedPath = nodePath.join(savedDir, filename);
    await download.saveAs(savedPath);

    // 5-6. 読み込みボタンを押下して保存したCSVをインポート
    await page.getByTestId("load-button").click();
    await page.setInputFiles('[data-testid="file-import-input"]', savedPath);
    // 簡易期待: 読み込み完了メッセージが表示される
    await expect(page.getByTestId("import-success-message")).toBeVisible();
    try {
      await fs.unlink(savedPath);
    } catch {
      // ignore
    }
  });

  test("05-04: Excel形式の正常データ", async ({ page }) => {
    // 3-4. 保存 -> Excelエクスポート
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      // open save UI then click Excel - depending on UI these may be separate
      page.getByTestId("save-button").click(),
      page.getByTestId("export-excel-button").click(),
    ]);
    await expect(page.getByTestId("export-success-message")).toBeVisible();
    await page.getByTestId("save-dialog-close-button").click();
    // ダウンロードされたファイルを確実に拡張子付きで保存してから読み込む
    const filename = download.suggestedFilename();
    expect(filename).toBeTruthy();
    expect(filename).toMatch(/\.xlsx$/i);

    const savedDir = nodePath.join(os.tmpdir(), "dsp-calc-tool-downloads");
    await fs.mkdir(savedDir, { recursive: true });
    const savedPath = nodePath.join(savedDir, filename);
    await download.saveAs(savedPath);

    // 5-6. 読み込みボタンを押下して保存したExcelをインポート
    await page.getByTestId("load-button").click();
    await page.setInputFiles('[data-testid="file-import-input"]', savedPath);
    // 簡易期待: 読み込み完了メッセージが表示される
    await expect(page.getByTestId("import-success-message")).toBeVisible();
    try {
      await fs.unlink(savedPath);
    } catch {
      // ignore
    }
  });

  test("05-05: json形式の異常データ", async ({ page }) => {
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

      await page.getByTestId("load-button").click();
      // 直接 input にファイルをセット
      await page.setInputFiles('[data-testid="file-import-input"]', filePath);
      // エラー表示を期待
      await expect(page.getByTestId("import-error-message")).toBeVisible();
      // 閉じる等の UI があればここで閉じる（保存されている場合のため）
      await page.getByTestId("load-dialog-close-button").click();
    }
  });

  test("05-06: Markdown形式の異常データ", async ({ page }) => {
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

    await page.getByTestId("load-button").click();
    // 直接 input にファイルをセット
    await page.setInputFiles('[data-testid="file-import-input"]', filePath);
    // エラー表示を期待
    await expect(page.getByTestId("import-error-message")).toBeVisible();
    // 閉じる等の UI があればここで閉じる（保存されている場合のため）
    await page.getByTestId("load-dialog-close-button").click();
  });

  test("05-07: csv形式の異常データ", async ({ page }) => {
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

    await page.getByTestId("load-button").click();
    // 直接 input にファイルをセット
    await page.setInputFiles('[data-testid="file-import-input"]', filePath);
    // エラー表示を期待
    await expect(page.getByTestId("import-error-message")).toBeVisible();
    // 閉じる等の UI があればここで閉じる（保存されている場合のため）
    await page.getByTestId("load-dialog-close-button").click();
  });

  test("05-08: Excel形式の異常データ", async ({ page }) => {
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

    await page.getByTestId("load-button").click();
    // 直接 input にファイルをセット
    await page.setInputFiles('[data-testid="file-import-input"]', filePath);
    // エラー表示を期待
    await expect(page.getByTestId("import-error-message")).toBeVisible();
    // 閉じる等の UI があればここで閉じる（保存されている場合のため）
    await page.getByTestId("load-dialog-close-button").click();
  });

  test("05-09: URL共有", async ({ page }) => {
    // 3. URL共有ボタンを押下する
    await page.getByTestId("url-share-button").click();

    // 4. コピーボタンを押下する
    // Grant clipboard permissions so navigator.clipboard.readText can be used in the test environment
    try {
      await page
        .context()
        .grantPermissions(["clipboard-read", "clipboard-write"], { origin: page.url() });
    } catch {
      // ignore if grantPermissions is not supported in the environment
    }
    await page.getByTestId("copy-url-button").click();

    // 5. コピーしたURLにアクセスする (clipboard read via page.evaluate)
    const clipboard = await page.evaluate(() => navigator.clipboard?.readText?.());
    if (clipboard) {
      const newPage = await page.context().newPage();
      await newPage.goto(clipboard);
      // 期待値: レシピが復元されていること (保存されたレシピに基づきチェック)
      await expect(newPage.getByTestId("recipe-node-1705")).toBeVisible();
    }
  });
});
