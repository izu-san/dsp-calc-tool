// spec: docs/testing/TEST_PLAN.md
import { expect, test } from "@playwright/test";
import * as nodePath from "path";
import { acceptDialogDuring } from "./helpers/dialogs";

test.describe("ModSettings とカスタム XML アップロード", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/");
    await page.getByTestId("welcome-skip-button").click();
  });

  test("07-01: MOD設定画面の表示 (Ctrl+Shift+M)", async ({ page }) => {
    // 1. Ctrl+Shift+Mを押下する（単一コマンドで安定化）
    await page.keyboard.press("Control+Shift+M");

    // 期待値: Mod設定画面が開くこと
    await expect(page.getByTestId("mod-settings-dialog")).toBeVisible();
  });

  test("07-02: カスタムレシピのアップロード（正常データ）", async ({ page }) => {
    // 鉄インゴットを設定
    await page.getByTestId("recipe-button-1101").click();
    await page.getByTestId("target-quantity-input").fill("99");

    // デフォルトは 99.0/s であることを確認
    await expect(page.getByTestId("recipe-input-rate-1101-1001")).toHaveText("99.0/s");

    // 1. Ctrl+Shift+Mを押下する（単一コマンドで安定化）
    await page.keyboard.press("Control+Shift+M");

    // 2. 使用可能なカスタムレシピのxmlデータをアップロードする
    const fixtureDir = nodePath.join(process.cwd(), "tests", "fixtures", "07-modsettings");
    const filePath = nodePath.join(fixtureDir, "Recipes_normal.xml");

    await page.setInputFiles('[data-testid="mod-settings-xml-upload-button"]', filePath);
    await expect(page.getByTestId("modsettings-load-success")).toBeVisible();

    await page.getByTestId("mod-settings-close-button").click();

    // 期待値: 鉄インゴットの生産速度がカスタムレシピの値に変更されていること
    await expect(page.getByTestId("recipe-input-rate-1101-1001")).toHaveText("1.0/s");
  });

  test("07-03: カスタムレシピのアップロード（異常データ）", async ({ page }) => {
    // 1-2. モッド画面を開いて異常XMLをアップロード
    await page.keyboard.press("Control+Shift+M");

    // 2. 使用可能なカスタムレシピのxmlデータをアップロードする
    const fixtureDir = nodePath.join(process.cwd(), "tests", "fixtures", "07-modsettings");
    const filePath = nodePath.join(fixtureDir, "Recipes_invalid.xml");

    await page.setInputFiles('[data-testid="mod-settings-xml-upload-button"]', filePath);
    await expect(page.getByTestId("modsettings-load-error")).toBeVisible();
  });

  test("07-04: デフォルトのレシピに戻す", async ({ page }) => {
    // 鉄インゴットを設定
    await page.getByTestId("recipe-button-1101").click();
    await page.getByTestId("target-quantity-input").fill("99");

    await expect(page.getByTestId("recipe-input-rate-1101-1001")).toHaveText("99.0/s");

    // 1-2. モッド画面を開く
    await page.keyboard.press("Control+Shift+M");

    // 2. 使用可能なカスタムレシピのxmlデータをアップロードする
    const fixtureDir = nodePath.join(process.cwd(), "tests", "fixtures", "07-modsettings");
    const filePath = nodePath.join(fixtureDir, "Recipes_normal.xml");

    await page.setInputFiles('[data-testid="mod-settings-xml-upload-button"]', filePath);
    await expect(page.getByTestId("modsettings-load-success")).toBeVisible();

    await page.getByTestId("mod-settings-close-button").click();

    // 期待値: 鉄インゴットの生産速度がカスタムレシピの値に変更されていること
    await expect(page.getByTestId("recipe-input-rate-1101-1001")).toHaveText("1.0/s");

    // 1-2. モッド画面を開く
    await page.keyboard.press("Control+Shift+M");

    // リセットするにブラウザの確認ダイアログが表示されるため、ヘルパーでダイアログを受け入れてからクリックする
    await acceptDialogDuring(page, async () => {
      await page.getByTestId("mod-settings-reset-to-default-button").click();
    });
    await page.getByTestId("mod-settings-close-button").click();

    // デフォルトの 99.0/s であることを確認
    await page.reload();
    await expect(page.getByTestId("recipe-input-rate-1101-1001")).toHaveText("99.0/s");
  });

  test("07-05: カスタム増産剤倍率を適用", async ({ page }) => {
    // 鉄インゴットを設定
    await page.getByTestId("recipe-button-1101").click();
    await page.getByTestId("target-quantity-input").fill("99");

    // Mk.IIIの生産速度上昇
    await page.getByTestId("proliferator-type-button-mk3").click();
    await page.getByTestId("proliferator-mode-button-speed").click();
    await expect(page.getByTestId("machine-count-1101")).toHaveText("アーク製錬所 × 50");

    // Mk.IIIの追加生産
    await page.getByTestId("proliferator-mode-button-production").click();
    await expect(page.getByTestId("recipe-input-rate-1101-1001")).toHaveText("79.2/s");

    // 1. Ctrl+Shift+Mを押下する（単一コマンドで安定化）
    await page.keyboard.press("Control+Shift+M");

    // 2. 生産倍率と速度倍率を変更する
    await page.getByTestId("mod-settings-production-multiplier-input").fill("4");
    await page.getByTestId("mod-settings-speed-multiplier-input").fill("3");

    // 期待値: 保存して値が反映される
    await page.getByTestId("mod-settings-apply-multipliers-button").click();
    await expect(page.getByTestId("modsettings-proliferator-success")).toBeVisible();
    await page.getByTestId("mod-settings-close-button").click();

    // Mk.IIIの生産速度上昇
    await page.getByTestId("proliferator-type-button-mk3").click();
    await page.getByTestId("proliferator-mode-button-speed").click();
    await expect(page.getByTestId("machine-count-1101")).toHaveText("アーク製錬所 × 25");

    // Mk.IIIの追加生産
    await page.getByTestId("proliferator-mode-button-production").click();
    await expect(page.getByTestId("recipe-input-rate-1101-1001")).toHaveText("49.5/s");
  });

  test("07-06: カスタム増産剤倍率をリセット", async ({ page }) => {
    // 鉄インゴットを設定
    await page.getByTestId("recipe-button-1101").click();
    await page.getByTestId("target-quantity-input").fill("99");

    // Mk.IIIの生産速度上昇
    await page.getByTestId("proliferator-type-button-mk3").click();
    await page.getByTestId("proliferator-mode-button-speed").click();
    await expect(page.getByTestId("machine-count-1101")).toHaveText("アーク製錬所 × 50");

    // Mk.IIIの追加生産
    await page.getByTestId("proliferator-mode-button-production").click();
    await expect(page.getByTestId("recipe-input-rate-1101-1001")).toHaveText("79.2/s");

    // 1. Ctrl+Shift+Mを押下する
    await page.keyboard.down("Control");
    await page.keyboard.down("Shift");
    await page.keyboard.press("KeyM");
    await page.keyboard.up("Shift");
    await page.keyboard.up("Control");

    // 2. 生産倍率と速度倍率を変更する
    await page.getByTestId("mod-settings-production-multiplier-input").fill("4");
    await page.getByTestId("mod-settings-speed-multiplier-input").fill("3");

    // 期待値: 保存して値が反映される
    await page.getByTestId("mod-settings-apply-multipliers-button").click();
    await expect(page.getByTestId("modsettings-proliferator-success")).toBeVisible();
    await page.getByTestId("mod-settings-close-button").click();

    // Mk.IIIの生産速度上昇
    await page.getByTestId("proliferator-type-button-mk3").click();
    await page.getByTestId("proliferator-mode-button-speed").click();
    await expect(page.getByTestId("machine-count-1101")).toHaveText("アーク製錬所 × 25");

    // Mk.IIIの追加生産
    await page.getByTestId("proliferator-mode-button-production").click();
    await expect(page.getByTestId("recipe-input-rate-1101-1001")).toHaveText("49.5/s");

    // 1. Ctrl+Shift+Mを押下する
    await page.keyboard.down("Control");
    await page.keyboard.down("Shift");
    await page.keyboard.press("KeyM");
    await page.keyboard.up("Shift");
    await page.keyboard.up("Control");

    // リセット — ヘルパーでダイアログを受け入れてからクリックする
    await acceptDialogDuring(page, async () => {
      await page.getByTestId("mod-settings-reset-proliferator-button").click();
    });
    await page.getByTestId("mod-settings-apply-multipliers-button").click();
    await page.getByTestId("mod-settings-close-button").click();

    // Mk.IIIの生産速度上昇
    await page.reload();
    await page.getByTestId("proliferator-type-button-mk3").click();
    await page.getByTestId("proliferator-mode-button-speed").click();
    await expect(page.getByTestId("machine-count-1101")).toHaveText("アーク製錬所 × 50");

    // Mk.IIIの追加生産
    await page.getByTestId("proliferator-mode-button-production").click();
    await expect(page.getByTestId("recipe-input-rate-1101-1001")).toHaveText("79.2/s");
  });
});
