// spec: docs/testing/TEST_PLAN.md
import { expect, test } from "@playwright/test";

test.describe("What-If分析", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/");
    await page.getByTestId("welcome-skip-button").click();
  });

  test("08-01: ボトルネック検出", async ({ page }) => {
    // 1. `エネルギーマトリックス` を選択する
    await page.getByTestId("recipe-button-1802").click();

    // 2. 目標のテキストフィールドに `100` を入力する
    await page.getByTestId("target-quantity-input").fill("100");
    await expect(page.getByTestId("machine-count-1802")).toHaveText("マトリックスラボ × 600");

    // 3. すべて修正ボタンを操作
    await page.getByTestId("whatif-fix-all-bottlenecks-button").click();

    // 期待値
    await expect(page.getByTestId("machine-count-1802")).toHaveText("マトリックスラボ × 300");
    await expect(page.getByTestId("whatif-no-bottlenecks-message")).toBeVisible();
  });

  test("08-02: クイックアクション (増産剤最大)", async ({ page }) => {
    await page.getByTestId("recipe-button-1802").click();
    await page.getByTestId("target-quantity-input").fill("100");

    await expect(page.getByTestId("machine-count-1802")).toHaveText("マトリックスラボ × 600");

    // 3. 増産剤最大ボタンを操作する
    await page.getByTestId("whatif-quick-action-max-proliferator").click();

    // 期待値
    await expect(page.getByTestId("machine-count-1802")).toHaveText("マトリックスラボ × 300");
    await expect(page.getByTestId("whatif-no-bottlenecks-message")).toBeVisible();
  });

  test("08-03: 最適化エンジン (電力最小化)", async ({ page }) => {
    await page.getByTestId("recipe-button-1802").click();
    await page.getByTestId("target-quantity-input").fill("100");

    await expect(page.getByTestId("machine-count-1802")).toHaveText("マトリックスラボ × 600");

    // 電力最小化
    await page.getByTestId("whatif-optimization-goal-power").click();
    await page.getByTestId("whatif-apply-best-button").click();

    // 期待値
    await expect(page.getByTestId("machine-count-1802")).toHaveText("マトリックスラボ × 300");
    await expect(page.getByTestId("whatif-no-bottlenecks-message")).toBeVisible();
  });

  test("08-04: 最適化エンジン (施設最小化)", async ({ page }) => {
    await page.getByTestId("recipe-button-1802").click();
    await page.getByTestId("target-quantity-input").fill("100");

    await expect(page.getByTestId("machine-count-1802")).toHaveText("マトリックスラボ × 600");

    // 施設最小化
    await page.getByTestId("whatif-optimization-goal-machines").click();
    await page.getByTestId("whatif-apply-best-button").click();

    // 期待値
    await expect(page.getByTestId("machine-count-1802")).toHaveText("マトリックスラボ × 300");
    await expect(page.getByTestId("whatif-no-bottlenecks-message")).toBeVisible();
  });

  test("08-05: 最適化エンジン (効率最大化)", async ({ page }) => {
    await page.getByTestId("recipe-button-1802").click();
    await page.getByTestId("target-quantity-input").fill("100");

    await expect(page.getByTestId("machine-count-1802")).toHaveText("マトリックスラボ × 600");

    // 効率最大化
    await page.getByTestId("whatif-optimization-goal-efficiency").click();
    await page.getByTestId("whatif-apply-best-button").click();

    // 期待値
    await expect(page.getByTestId("machine-count-1802")).toHaveText("マトリックスラボ × 600");
  });

  test("08-06: 最適化エンジン (バランス)", async ({ page }) => {
    await page.getByTestId("recipe-button-1802").click();
    await page.getByTestId("target-quantity-input").fill("100");

    await expect(page.getByTestId("machine-count-1802")).toHaveText("マトリックスラボ × 600");

    // バランス
    await page.getByTestId("whatif-optimization-goal-balanced").click();
    await page.getByTestId("whatif-apply-best-button").click();

    // 期待値
    await expect(page.getByTestId("machine-count-1802")).toHaveText("マトリックスラボ × 600");
  });

  test("08-07: アップグレードの個別適用 (増産剤Mk.III)", async ({ page }) => {
    await page.getByTestId("recipe-search-input").fill("エネルギーマトリックス");
    await page.getByTestId("recipe-button-1802").click();
    await page.getByTestId("target-quantity-input").fill("100");

    await expect(page.getByTestId("machine-count-1802")).toHaveText("マトリックスラボ × 600");

    await page.getByTestId("whatif-scenario-apply-button-proliferator_mk3").click();

    await expect(page.getByTestId("machine-count-1802")).toHaveText("マトリックスラボ × 300");
    await expect(page.getByTestId("whatif-no-bottlenecks-message")).toBeVisible();
  });
});
