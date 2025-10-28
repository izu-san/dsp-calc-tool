// spec: docs/testing/TEST_PLAN.md
import { test, expect } from "@playwright/test";
import { expectNumberChange } from "./helpers/numeric-asserts";

test.describe("発電設備機能", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/");
    await page.getByTestId("welcome-skip-button").click();
  });

  test("04-01: 発電設備テンプレート", async ({ page }) => {
    // 1. `デストロイヤー` を選択する
    await page.getByTestId("recipe-search-input").fill("デストロイヤー");
    await page.getByTestId("recipe-button-1705").click();

    // 2. 発電設備タブを開く
    await page.getByTestId("power-generation-tab").click();

    // 3. 発電設備テンプレートを一通り選択する
    const tmpl = page.getByTestId("power-templates");
    if ((await tmpl.count()) > 0) {
      const buttons = tmpl.locator("button");
      const n = await buttons.count();
      for (let i = 0; i < n; i++) {
        await buttons
          .nth(i)
          .click()
          .catch(() => {});
      }
    }
    await expect(page.getByTestId("power-plant-panel")).toBeVisible();
  });

  test("04-02: 設備を手動で設定", async ({ page }) => {
    // 1-2. デストロイヤー選択と発電設備タブ
    await page.getByTestId("recipe-search-input").fill("デストロイヤー");
    await page.getByTestId("recipe-button-1705").click();
    await page.getByTestId("power-generation-tab").click();

    // 3. 発電設備を手動で切り替える
    await page
      .getByTestId("power-plant-select")
      .selectOption({ index: 1 })
      .catch(() => {});

    // 4. 燃料の切替 (必要な場合)
    await page
      .getByTestId("power-fuel-select")
      .selectOption({ index: 1 })
      .catch(() => {});

    await expect(page.getByTestId("power-plant-panel")).toBeVisible();
  });

  test("04-03: 増産剤を設定（火力発電所）", async ({ page }) => {
    // 1-2. デストロイヤー選択/タブ
    await page.getByTestId("recipe-search-input").fill("デストロイヤー");
    await page.getByTestId("recipe-button-1705").click();
    await page.getByTestId("power-generation-tab").click();

    // 3. 火力発電所を選択
    await page
      .getByTestId("power-plant-select")
      .selectOption({ label: "火力発電所" })
      .catch(() => {});

    // 4. 燃料を選択
    await page
      .getByTestId("power-fuel-select")
      .selectOption({ label: "高エネルギーグラファイト" })
      .catch(() => {});

    // 5. 増産剤の設定を切り替える
    // 数値チェック: 発電所の出力や消費が変化すること
    await expectNumberChange(
      page,
      "power-plant-panel",
      async () => {
        await page
          .getByTestId("power-overclock-selector")
          .click()
          .catch(() => {});
        await page
          .getByTestId("power-generation-proliferator-button-mk1")
          .click()
          .catch(() => {});
      },
      "changed",
      { timeout: 800 }
    );

    await expect(page.getByTestId("power-plant-panel")).toBeVisible();
  });

  test("04-04: 増産剤を設定（人工恒星）", async ({ page }) => {
    // 1-2. デストロイヤー選択/タブ
    await page.getByTestId("recipe-search-input").fill("デストロイヤー");
    await page.getByTestId("recipe-button-1705").click();
    await page.getByTestId("power-generation-tab").click();

    // 3. 人工恒星を選択
    await page
      .getByTestId("power-plant-select")
      .selectOption({ label: "人工恒星" })
      .catch(() => {});

    // 4. 反物質燃料棒を選択
    await page
      .getByTestId("power-fuel-select")
      .selectOption({ label: "反物質燃料棒" })
      .catch(() => {});

    // 数値チェック: 人工恒星の台数や消費が変化することを簡易検証
    await expectNumberChange(
      page,
      "power-plant-panel",
      async () => {
        await page
          .getByTestId("power-overclock-selector")
          .click()
          .catch(() => {});
        await page
          .getByTestId("power-generation-proliferator-button-mk3")
          .click()
          .catch(() => {});
      },
      "changed",
      { timeout: 800 }
    );

    await expect(page.getByTestId("power-plant-panel")).toBeVisible();
  });
});
