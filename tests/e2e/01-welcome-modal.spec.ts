// spec: docs/testing/TEST_PLAN.md
import { test, expect } from "@playwright/test";

test.describe("Welcome モーダル", () => {
  test("01-01: モーダルの基本操作", async ({ page }) => {
    // 1. アプリにアクセスする
    await page.goto("http://localhost:5173/");

    // 2. Dyson Sphere Program Production Calculator へようこそ！ モーダルが表示されていることを確認する
    await expect(page.getByTestId("welcome-modal")).toBeVisible();

    // 3. ステップ 1 / 3 が表示されていることを確認する
    await expect(page.getByTestId("welcome-step-indicator-1")).toBeVisible();

    // 4. 次へボタンを操作
    await page.getByTestId("welcome-next-button").click();

    // 5. ステップ 2 / 3 が表示されていることを確認する
    await expect(page.getByTestId("welcome-step-indicator-2")).toBeVisible();

    // 6. 戻るボタンを操作
    await page.getByTestId("welcome-back-button").click();

    // 7. ステップ 1 / 3 が表示されていることを確認する
    await expect(page.getByTestId("welcome-step-indicator-1")).toBeVisible();

    // 8-9. 次へボタンを操作 (2回)
    await page.getByTestId("welcome-next-button").click();
    await page.getByTestId("welcome-next-button").click();

    // 10. ステップ 3 / 3 が表示されていることを確認する
    await expect(page.getByTestId("welcome-step-indicator-3")).toBeVisible();

    // 11. 始めるボタンを操作
    await page.getByTestId("welcome-start-button").click();

    // 12. モーダルが閉じることを確認する
    await expect(page.getByTestId("welcome-modal")).toBeHidden();
  });

  test("01-02: モーダルをスキップ", async ({ page }) => {
    // 1. アプリにアクセスする
    await page.goto("http://localhost:5173/");

    // 2. モーダルが表示されていることを確認する
    await expect(page.getByTestId("welcome-modal")).toBeVisible();

    // 3. スキップボタンを操作
    await page.getByTestId("welcome-skip-button").click();

    // 4. モーダルが閉じることを確認する
    await expect(page.getByTestId("welcome-modal")).toBeHidden();
  });

  test("01-03: モーダルが再表示されない", async ({ page }) => {
    // 1-4. アクセスしてスキップを押す
    await page.goto("http://localhost:5173/");
    await page.getByTestId("welcome-skip-button").click();
    await expect(page.getByTestId("welcome-modal")).toBeHidden();

    // 5. ページをリロード
    await page.reload();

    // 6. モーダルが表示されないことを確認する
    await expect(page.getByTestId("welcome-modal")).toBeHidden();
  });
});
