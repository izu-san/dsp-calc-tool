// spec: docs/testing/TEST_PLAN.md
import { expect, test } from "@playwright/test";
import { disableAnimations } from "./helpers/ui-stability";

test.describe("設定永続化とロケール設定", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/");
    await page.getByTestId("welcome-skip-button").click();
    await disableAnimations(page);
  });

  test("06-01: 言語切替", async ({ page }) => {
    // 1. 初期状態は言語が ja であることを確認する
    const initialLang = await page.evaluate(() => document.documentElement.lang);
    expect(initialLang).toBe("ja");

    // 2. 言語を en に切り替える
    await page.getByTestId("language-switcher-select").selectOption({ value: "en" });

    // 明示的な待機
    await page.waitForTimeout(500);

    // 3. ページをリロードする(F5リロード)
    await page.reload();

    // 期待値: ページリロード後も言語が維持されていること
    const langAfter = await page.evaluate(() => document.documentElement.lang);
    expect(langAfter).toBe("en");
  });

  test("06-02: localStorageによる設定永続化", async ({ page }) => {
    // 1. 任意のレシピを選択する
    await page.getByTestId("recipe-button-1705").click();
    await page.getByTestId("target-quantity-input").fill("6");

    // 2. 増産剤、生産設備を任意に設定する
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

    // 3. ページをリロードする(F5リロード)
    await page.reload();

    // 期待値: ページリロード後も設定やレシピが維持されていること
    const val = await page.getByTestId("target-quantity-input").inputValue();
    expect(parseFloat(val)).toBe(6);
    await expect(page.getByTestId("recipe-node-1705")).toBeVisible();
    await expect(page.getByTestId("machine-badge-1705")).toHaveText("🏭 組立機 Mk.III");
    await expect(page.getByTestId("proliferator-badge-1705")).toHaveText("🧪 MK2 · 速度");
  });
});
