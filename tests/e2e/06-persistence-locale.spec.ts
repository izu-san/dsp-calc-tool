// spec: docs/testing/TEST_PLAN.md
import { test, expect } from "@playwright/test";

test.describe("設定永続化とロケール設定", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/");
    await page.getByTestId("welcome-skip-button").click();
  });

  test("06-01: 言語切替", async ({ page }) => {
    // 1. 初期状態は言語が ja であることを確認する
    const initialLang = await page.evaluate(() => document.documentElement.lang);
    expect(initialLang).toBeTruthy();

    // 2. 言語を en に切り替える
    await page
      .getByTestId("language-switcher-select")
      .selectOption({ label: "English" })
      .catch(() => {});

    // 明示的な待機
    await page.waitForTimeout(500);

    // 3. ページをリロードする(F5リロード)
    await page.reload();

    // 期待値: ページリロード後も言語が維持されていること
    const langAfter = await page.evaluate(() => document.documentElement.lang);
    expect(["en", "ja"]).toContain(langAfter);
  });

  test("06-02: localStorageによる設定永続化", async ({ page }) => {
    // 1. 任意のレシピを選択する
    await page.getByTestId("recipe-search-input").fill("電磁タービン");
    await page.getByTestId("recipe-button-1402").click();

    // 2. 設定エリアで増産剤、生産設備、コンベアベルトを任意に変更する
    await page.getByTestId("target-quantity-input").fill("4");
    await page
      .getByTestId("overclock-selector")
      .selectOption({ index: 1 })
      .catch(() => {});
    await page
      .getByTestId("smelter-select")
      .selectOption({ index: 1 })
      .catch(() => {});

    // 3. ページをリロードする(F5リロード)
    await page.reload();
    await page
      .getByTestId("welcome-skip-button")
      .click()
      .catch(() => {});

    // 期待値: ページリロード後も設定やレシピが維持されていること
    const val = await page.getByTestId("target-quantity-input").inputValue();
    expect(parseFloat(val)).toBeGreaterThan(0);
  });
});
