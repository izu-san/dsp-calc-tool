// spec: docs/testing/TEST_PLAN.md
import { expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { test } from "./fixtures";
import { ensureRecipeSidsGenerated, extractSidsFromMarkdown } from "./helpers/game-data-helpers";

// ESM環境で__dirnameを解決
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// spec: docs/testing/TEST_PLAN.md
// このテストは `tests/e2e/fixtures/RECIPE_SIDS.md` を参照して
// Items(1xxx) と Buildings(2xxx) の各tab内に全ての recipe-button-<sid> が存在することを確認します。

test.describe("ゲームデータ読み込みと初期表示", () => {
  test("02-01: ゲームデータの初期表示 - 全SIDが各タブで表示されること", async ({ appPage }) => {
    // 大量のレシピボタンをチェックするため、タイムアウトを60秒に設定
    test.setTimeout(60000);

    // 基本UI要素の存在確認: getByTestId を使って表示されるまで待機する
    await expect(appPage.getByTestId("settings-panel")).toBeVisible();
    await expect(appPage.getByTestId("recipe-list")).toBeVisible();
    await expect(appPage.getByTestId("items-tab")).toBeVisible();
    await expect(appPage.getByTestId("buildings-tab")).toBeVisible();

    // RECIPE_SIDS.md を読み込み、表の左列から SID を抽出する
    const mdPath = path.resolve(__dirname, "fixtures/RECIPE_SIDS.md");
    await ensureRecipeSidsGenerated(mdPath);

    const md = fs.readFileSync(mdPath, "utf8");
    const { items, buildings } = extractSidsFromMarkdown(md);

    // Items タブ内の全SID のボタンが存在することをチェック
    await appPage.getByTestId("items-tab").click();
    for (const sid of items) {
      const locator = appPage.getByTestId(`recipe-button-${sid}`);
      // 要素がレンダリングされるまで待つ（付与されるまでブロック）
      await expect(locator).toBeAttached();
      // 要素がグリッド内にあってもスクロールでviewport に持ってくる
      await locator.scrollIntoViewIfNeeded();
      // 実際に可視になるまで待つ
      await expect(locator).toBeVisible();
    }

    // Buildings タブへ切り替え、同様にチェック
    await appPage.getByTestId("buildings-tab").click();
    for (const sid of buildings) {
      const locator = appPage.getByTestId(`recipe-button-${sid}`);
      await expect(locator).toBeAttached();
      await locator.scrollIntoViewIfNeeded();
      await expect(locator).toBeVisible();
    }
  });
});
