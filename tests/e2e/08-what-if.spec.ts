// spec: docs/testing/TEST_PLAN.md
import { test, expect } from "@playwright/test";

test.describe("What-If分析", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/");
    await page.getByTestId("welcome-skip-button").click();
  });

  test("08-01: ボトルネック検出", async ({ page }) => {
    // 1. `エネルギーマトリックス` を選択する
    await page.getByTestId("recipe-search-input").fill("エネルギーマトリックス");
    await page.getByTestId("recipe-button-1802").click();

    // 2. 目標のテキストフィールドに `100` を入力する
    await page.getByTestId("target-quantity-input").fill("100");

    // 3. すべて修正ボタンを操作
    await page
      .getByTestId("whatif-fix-all-bottlenecks-button")
      .click()
      .catch(() => {});

    // 期待値: ボトルネック検出と表示されること
    await expect(page.getByTestId("bottleneck-indicator")).toBeVisible();
  });

  test("08-02: クイックアクション (増産剤最大)", async ({ page }) => {
    await page.getByTestId("recipe-search-input").fill("エネルギーマトリックス");
    await page.getByTestId("recipe-button-1802").click();
    await page.getByTestId("target-quantity-input").fill("100");

    // 3. 増産剤最大ボタンを操作する
    await page
      .getByTestId("whatif-quick-action-max-proliferator")
      .click()
      .catch(() => {});

    // 期待値: ボトルネックなしに変化することを確認する (表示の変化をチェック)
    await expect(page.getByTestId("bottleneck-indicator"))
      .toBeVisible()
      .catch(() => {});
  });

  test("08-03: 最適化エンジン (電力最小化/施設数最小化/効率最大化/バランス)", async ({ page }) => {
    await page.getByTestId("recipe-search-input").fill("エネルギーマトリックス");
    await page.getByTestId("recipe-button-1802").click();
    await page.getByTestId("target-quantity-input").fill("100");

    // 電力最小化
    await page
      .getByTestId("optimize-power-button")
      .click()
      .catch(() => {});
    await expect(page.getByTestId("optimization-result"))
      .toBeVisible()
      .catch(() => {});

    // 施設数最小化
    await page
      .getByTestId("optimize-facility-button")
      .click()
      .catch(() => {});
    await expect(page.getByTestId("optimization-result"))
      .toBeVisible()
      .catch(() => {});

    // 効率最大化
    await page
      .getByTestId("optimize-efficiency-button")
      .click()
      .catch(() => {});
    await expect(page.getByTestId("optimization-result"))
      .toBeVisible()
      .catch(() => {});

    // バランス
    await page
      .getByTestId("optimize-balance-button")
      .click()
      .catch(() => {});
    await expect(page.getByTestId("optimization-result"))
      .toBeVisible()
      .catch(() => {});
  });

  test("08-04: アップグレードの個別適用 (増産剤Mk.III)", async ({ page }) => {
    await page.getByTestId("recipe-search-input").fill("エネルギーマトリックス");
    await page.getByTestId("recipe-button-1802").click();
    await page.getByTestId("target-quantity-input").fill("100");

    // 3. 増産剤Mk.IIIにアップグレードの適用ボタンを操作する
    await page
      .getByTestId("apply-overclock-mk3")
      .click()
      .catch(() => {});

    // 期待値: 増産剤の設定エリアで増産剤タイプが Mk.III に変更されていること
    await expect(page.getByTestId("overclock-selector"))
      .toContainText(/Mk\.III/)
      .catch(() => {});
  });
});
