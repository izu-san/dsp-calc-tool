// spec: docs/testing/TEST_PLAN.md
import { expect } from "@playwright/test";
import { test } from "./fixtures";

test.describe("設定永続化とロケール設定", () => {
  test("06-01: 言語切替", async ({ appPage, reloadPage }) => {
    // 1. 初期状態は言語が ja であることを確認する
    const initialLang = await appPage.evaluate(() => document.documentElement.lang);
    expect(initialLang).toBe("ja");

    // 2. 言語を en に切り替える
    await appPage.getByTestId("language-menu-trigger").click();
    await appPage.getByTestId("language-menu-item-en").click();

    // 明示的な待機
    await appPage.waitForTimeout(500);

    // 3. ページをリロードする(F5リロード)
    await reloadPage();

    // 期待値: ページリロード後も言語が維持されていること
    const langAfter = await appPage.evaluate(() => document.documentElement.lang);
    expect(langAfter).toBe("en");
  });

  test("06-02: localStorageによる設定永続化", async ({ appPage, reloadPage }) => {
    // 1. 任意のレシピを選択する
    await appPage.getByTestId("recipe-button-1705").click();
    await appPage.getByTestId("target-quantity-input").fill("6");

    // 2. 増産剤、生産設備を任意に設定する
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

    // 3. ページをリロードする(F5リロード)
    await reloadPage();

    // 期待値: ページリロード後も設定やレシピが維持されていること
    const val = await appPage.getByTestId("target-quantity-input").inputValue();
    expect(parseFloat(val)).toBe(6);
    await expect(appPage.getByTestId("recipe-node-1705")).toBeVisible();
    await expect(appPage.getByTestId("machine-badge-1705")).toHaveText("🏭 組立機 Mk.III");
    await expect(appPage.getByTestId("proliferator-badge-1705")).toHaveText("🧪 MK2 · 速度");
  });
});
