// spec: docs/testing/TEST_PLAN.md
import { expect } from "@playwright/test";
import * as nodePath from "path";
import { test } from "./fixtures";
import { acceptDialogDuring } from "./helpers/dialogs";

test.describe("ModSettings とカスタム XML アップロード", () => {
  test("07-01: MOD設定画面の表示 (Ctrl+Shift+M)", async ({ appPage }) => {
    // 1. Ctrl+Shift+Mを押下する（単一コマンドで安定化）
    await appPage.getByTestId("mod-settings-trigger").waitFor({ state: "attached" });
    await appPage.keyboard.press("Control+Shift+M");

    // 期待値: Mod設定画面が開くこと
    await expect(appPage.getByTestId("mod-settings-dialog")).toBeVisible();
  });

  test("07-02: カスタムレシピのアップロード（正常データ）", async ({ appPage }) => {
    // 鉄インゴットを設定
    await appPage.getByTestId("recipe-button-1101").click();
    await appPage.getByTestId("target-quantity-input").fill("99");

    // デフォルトは 24.8/s であることを確認
    await expect(appPage.getByTestId("recipe-input-rate-1101-1001")).toHaveText("24.8/s");

    // 1. Ctrl+Shift+Mを押下する（単一コマンドで安定化）
    await appPage.getByTestId("mod-settings-trigger").waitFor({ state: "attached" });
    await appPage.keyboard.press("Control+Shift+M");

    // 2. 使用可能なカスタムレシピのxmlデータをアップロードする
    const fixtureDir = nodePath.join(process.cwd(), "tests", "fixtures", "07-modsettings");
    const filePath = nodePath.join(fixtureDir, "Recipes_normal.xml");

    await appPage.setInputFiles('[data-testid="mod-settings-xml-upload-button"]', filePath);
    await expect(appPage.getByTestId("modsettings-load-success")).toBeVisible();

    await appPage.getByTestId("mod-settings-close-button").click();

    // 期待値: 鉄インゴットの生産速度がカスタムレシピの値に変更されていること
    await expect(appPage.getByTestId("recipe-input-rate-1101-1001")).toHaveText("1.0/s");
  });

  test("07-03: カスタムレシピのアップロード（異常データ）", async ({ appPage }) => {
    // 1-2. モッド画面を開いて異常XMLをアップロード
    await appPage.getByTestId("mod-settings-trigger").waitFor({ state: "attached" });
    await appPage.keyboard.press("Control+Shift+M");

    // 2. 使用可能なカスタムレシピのxmlデータをアップロードする
    const fixtureDir = nodePath.join(process.cwd(), "tests", "fixtures", "07-modsettings");
    const filePath = nodePath.join(fixtureDir, "Recipes_invalid.xml");

    await appPage.setInputFiles('[data-testid="mod-settings-xml-upload-button"]', filePath);
    await expect(appPage.getByTestId("modsettings-load-error")).toBeVisible();
  });

  test("07-04: デフォルトのレシピに戻す", async ({ appPage }) => {
    // 鉄インゴットを設定
    await appPage.getByTestId("recipe-button-1101").click();
    await appPage.getByTestId("target-quantity-input").fill("99");

    await expect(appPage.getByTestId("recipe-input-rate-1101-1001")).toHaveText("24.8/s");

    // 1-2. モッド画面を開く
    await appPage.getByTestId("mod-settings-trigger").waitFor({ state: "attached" });
    await appPage.keyboard.press("Control+Shift+M");

    // 2. 使用可能なカスタムレシピのxmlデータをアップロードする
    const fixtureDir = nodePath.join(process.cwd(), "tests", "fixtures", "07-modsettings");
    const filePath = nodePath.join(fixtureDir, "Recipes_normal.xml");

    await appPage.setInputFiles('[data-testid="mod-settings-xml-upload-button"]', filePath);
    await expect(appPage.getByTestId("modsettings-load-success")).toBeVisible();

    await appPage.getByTestId("mod-settings-close-button").click();

    // 期待値: 鉄インゴットの生産速度がカスタムレシピの値に変更されていること
    await expect(appPage.getByTestId("recipe-input-rate-1101-1001")).toHaveText("1.0/s");

    // 1-2. モッド画面を開く
    await appPage.getByTestId("mod-settings-trigger").waitFor({ state: "attached" });
    await appPage.keyboard.press("Control+Shift+M");

    // リセットするにブラウザの確認ダイアログが表示されるため、ヘルパーでダイアログを受け入れてからクリックする
    await acceptDialogDuring(appPage, async () => {
      await appPage.getByTestId("mod-settings-reset-to-default-button").click();
    });
    await appPage.getByTestId("mod-settings-close-button").click();

    // デフォルトの 24.8/s であることを確認
    await appPage.reload();
    await expect(appPage.getByTestId("recipe-input-rate-1101-1001")).toHaveText("24.8/s");
  });

  test("07-05: カスタム増産剤倍率を適用", async ({ appPage }) => {
    // 鉄インゴットを設定
    await appPage.getByTestId("recipe-button-1101").click();
    await appPage.getByTestId("target-quantity-input").fill("99");

    // Mk.IIIの生産速度上昇
    await appPage.getByTestId("proliferator-type-button-mk3").click();
    await appPage.getByTestId("proliferator-mode-button-speed").click();
    await expect(appPage.getByTestId("machine-count-1101")).toHaveText("アーク溶鉱炉 × 13");

    // Mk.IIIの追加生産
    await appPage.getByTestId("proliferator-mode-button-production").click();
    await expect(appPage.getByTestId("recipe-input-rate-1101-1001")).toHaveText("19.8/s");

    // 1. Ctrl+Shift+Mを押下する（単一コマンドで安定化）
    await appPage.getByTestId("mod-settings-trigger").waitFor({ state: "attached" });
    await appPage.keyboard.press("Control+Shift+M");

    // 2. 生産倍率と速度倍率を変更する
    await appPage.getByTestId("mod-settings-production-multiplier-input").fill("4");
    await appPage.getByTestId("mod-settings-speed-multiplier-input").fill("3");

    // 期待値: 保存して値が反映される
    await appPage.getByTestId("mod-settings-apply-multipliers-button").click();
    await expect(appPage.getByTestId("modsettings-proliferator-success")).toBeVisible();
    await appPage.getByTestId("mod-settings-close-button").click();

    // Mk.IIIの生産速度上昇
    await appPage.getByTestId("proliferator-type-button-mk3").click();
    await appPage.getByTestId("proliferator-mode-button-speed").click();
    await expect(appPage.getByTestId("machine-count-1101")).toHaveText("アーク溶鉱炉 × 7");

    // Mk.IIIの追加生産
    await appPage.getByTestId("proliferator-mode-button-production").click();
    await expect(appPage.getByTestId("recipe-input-rate-1101-1001")).toHaveText("12.4/s");
  });

  test("07-06: カスタム増産剤倍率をリセット", async ({ appPage }) => {
    // 鉄インゴットを設定
    await appPage.getByTestId("recipe-button-1101").click();
    await appPage.getByTestId("target-quantity-input").fill("99");

    // Mk.IIIの生産速度上昇
    await appPage.getByTestId("proliferator-type-button-mk3").click();
    await appPage.getByTestId("proliferator-mode-button-speed").click();
    await expect(appPage.getByTestId("machine-count-1101")).toHaveText("アーク溶鉱炉 × 13");

    // Mk.IIIの追加生産
    await appPage.getByTestId("proliferator-mode-button-production").click();
    await expect(appPage.getByTestId("recipe-input-rate-1101-1001")).toHaveText("19.8/s");

    // 1. Ctrl+Shift+Mを押下する
    await appPage.getByTestId("mod-settings-trigger").waitFor({ state: "attached" });
    await appPage.keyboard.press("Control+Shift+M");

    // 2. 生産倍率と速度倍率を変更する
    await appPage.getByTestId("mod-settings-production-multiplier-input").fill("4");
    await appPage.getByTestId("mod-settings-speed-multiplier-input").fill("3");

    // 期待値: 保存して値が反映される
    await appPage.getByTestId("mod-settings-apply-multipliers-button").click();
    await expect(appPage.getByTestId("modsettings-proliferator-success")).toBeVisible();
    await appPage.getByTestId("mod-settings-close-button").click();

    // Mk.IIIの生産速度上昇
    await appPage.getByTestId("proliferator-type-button-mk3").click();
    await appPage.getByTestId("proliferator-mode-button-speed").click();
    await expect(appPage.getByTestId("machine-count-1101")).toHaveText("アーク溶鉱炉 × 7");

    // Mk.IIIの追加生産
    await appPage.getByTestId("proliferator-mode-button-production").click();
    await expect(appPage.getByTestId("recipe-input-rate-1101-1001")).toHaveText("12.4/s");

    // 1. Ctrl+Shift+Mを押下する
    await appPage.getByTestId("mod-settings-trigger").waitFor({ state: "attached" });
    await appPage.keyboard.press("Control+Shift+M");

    // リセット — ヘルパーでダイアログを受け入れてからクリックする
    await acceptDialogDuring(appPage, async () => {
      await appPage.getByTestId("mod-settings-reset-proliferator-button").click();
    });
    await appPage.getByTestId("mod-settings-apply-multipliers-button").click();
    await appPage.getByTestId("mod-settings-close-button").click();

    // Mk.IIIの生産速度上昇
    await appPage.reload();

    // 再読込後はレシピリストが初期化されるため、Itemsタブと検索で確実にレシピを取得する
    await appPage.getByTestId("items-tab").click();
    await appPage.getByTestId("recipe-search-input").fill("鉄");
    await expect(appPage.getByTestId("recipe-button-1101")).toBeVisible();
    await appPage.getByTestId("recipe-button-1101").click();
    await appPage.getByTestId("recipe-search-input").fill("");
    await appPage.getByTestId("target-quantity-input").fill("99");
    await appPage.getByTestId("proliferator-type-button-mk3").click();
    await appPage.getByTestId("proliferator-mode-button-speed").click();
    await expect(appPage.getByTestId("machine-count-1101")).toHaveText("アーク溶鉱炉 × 13");

    // Mk.IIIの追加生産
    await appPage.getByTestId("proliferator-mode-button-production").click();
    await expect(appPage.getByTestId("recipe-input-rate-1101-1001")).toHaveText("19.8/s");
  });
});
