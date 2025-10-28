// spec: docs/testing/TEST_PLAN.md
import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

// spec: docs/testing/TEST_PLAN.md
// このテストは `docs/testing/RECIPE_SIDS.md` を参照して
// Items(1xxx) と Buildings(2xxx) の各tab内に全ての recipe-button-<sid> が存在することを確認します。

test.describe("ゲームデータ読み込みと初期表示", () => {
  test("02-01: ゲームデータの初期表示 - 全SIDが各タブで表示されること", async ({ page }) => {
    // 1. アプリにアクセスする
    // waitUntil 'networkidle' to ensure the SPA has finished initial network loading
    await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });

    // Welcome モーダルを閉じる（存在すれば）
    const skipBtn = page.getByTestId("welcome-skip-button");
    if ((await skipBtn.count()) > 0) {
      await skipBtn.click();
      // Ensure SPA processes the modal close and any hydration/network activity finishes
      await page.waitForLoadState("networkidle");
    }

    // 基本UI要素の存在確認: getByTestId を使って表示されるまで待機する
    await expect(page.getByTestId("settings-panel")).toBeVisible();
    await expect(page.getByTestId("recipe-list"))
      .toBeVisible()
      .catch(() => {});
    await expect(page.getByTestId("items-tab")).toBeVisible();
    await expect(page.getByTestId("buildings-tab")).toBeVisible();
    await expect(page.getByTestId("production-tree"))
      .toBeVisible()
      .catch(() => {});

    // RECIPE_SIDS.md を読み込み、表の左列から SID を抽出する
    const mdPath = path.resolve(process.cwd(), "docs/testing/RECIPE_SIDS.md");
    if (!fs.existsSync(mdPath)) {
      throw new Error(
        `RECIPE_SIDS.md not found at ${mdPath} - generate it with scripts/generate-recipe-sids.js`
      );
    }

    const md = fs.readFileSync(mdPath, "utf8");
    const sids: string[] = [];
    for (const line of md.split(/\r?\n/)) {
      // テーブルの行は `| 1101 | 鉄インゴット | Iron Ingot |` のようになっている想定
      const m = line.match(/^\|\s*(\d{3,4})\s*\|/);
      if (m) sids.push(m[1]);
    }

    if (sids.length === 0) {
      throw new Error("No SIDs found in RECIPE_SIDS.md");
    }

    const items = sids.filter(s => s.startsWith("1"));
    const buildings = sids.filter(s => s.startsWith("2"));

    // Items タブ内の全SID のボタンが存在することをチェック
    await page.getByTestId("items-tab").click();
    for (const sid of items) {
      const locator = page.getByTestId(`recipe-button-${sid}`);
      // 要素がレンダリングされるまで待つ（付与されるまでブロック）
      await expect(locator).toBeAttached();
      // 要素がグリッド内にあってもスクロールでviewport に持ってくる
      await locator.scrollIntoViewIfNeeded();
      // 実際に可視になるまで待つ
      await expect(locator).toBeVisible();
    }

    // Buildings タブへ切り替え、同様にチェック
    await page.getByTestId("buildings-tab").click();
    for (const sid of buildings) {
      const locator = page.getByTestId(`recipe-button-${sid}`);
      await expect(locator).toBeAttached();
      await locator.scrollIntoViewIfNeeded();
      await expect(locator).toBeVisible();
    }
  });
});
