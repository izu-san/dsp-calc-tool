// spec: docs/TEST_PLAN_RECIPES_ADDITION.md - シナリオ: 同一レシピを再選択しても生産チェーンが維持されること
// seed: tests/fixtures/seed.spec.ts

import { test, expect } from '@playwright/test';
import {
  initializeApp,
  selectRecipe,
  setupConsoleErrorListener,
} from './helpers/common-actions';
import { RECIPES, BUTTON_LABELS, TIMEOUTS } from './helpers/constants';

test.describe('レシピ再選択時の生産チェーン維持', () => {
  test('任意のレシピを選択→再選択してもProduction Treeが維持される', async ({ page }) => {
    // コンソールエラーを収集
    const errors = setupConsoleErrorListener(page);

    // 1. アプリを開き、ホーム／計算画面へ移動する
    await initializeApp(page);

    // 2-3. 任意のレシピを1つ選択する（例: 鉄インゴット）
    await selectRecipe(page, RECIPES.IRON_INGOT);

    // 4. Production Tree が表示されることを確認
    await expect(page.getByRole('button', { name: BUTTON_LABELS.COLLAPSE }).first()).toBeVisible();

    // Production Tree 内のノード要素を取得
    const treeItems = await page.locator('[data-testid="production-node"]').all();
    let nodeCountBefore = treeItems.length;
    if (nodeCountBefore === 0) {
      // フォールバック: role=treeitem
      nodeCountBefore = await page.getByRole('treeitem').count();
    }

    // ノードのユニークID集合（data-node-id 属性を期待）を収集
    const nodeIdsBefore = await page
      .locator('[data-testid="production-node"]')
      .evaluateAll((nodes) => nodes.map((n: any) => n.getAttribute('data-node-id')));

    // 5. 再び同じレシピを選択する
    await selectRecipe(page, RECIPES.IRON_INGOT);

    // 6. 再選択後のノード集合を取得
    const treeItemsAfter = await page.locator('[data-testid="production-node"]').all();
    let nodeCountAfter = treeItemsAfter.length;
    if (nodeCountAfter === 0) {
      nodeCountAfter = await page.getByRole('treeitem').count();
    }

    const nodeIdsAfter = await page
      .locator('[data-testid="production-node"]')
      .evaluateAll((nodes) => nodes.map((n: any) => n.getAttribute('data-node-id')));

    // アサーション: ノード数が変わらないこと
    expect(nodeCountAfter).toBe(nodeCountBefore);

    // アサーション: ユニークID集合が一致すること（順序は問わない）
    const sortAndCompare = (a: Array<string | null>, b: Array<string | null>) =>
      a.sort().join(',') === b.sort().join(',');

    expect(sortAndCompare(nodeIdsBefore, nodeIdsAfter)).toBeTruthy();

    // 追加検証: コンソールエラーが発生していないこと
    await page.waitForTimeout(TIMEOUTS.UI_UPDATE);
    expect(errors.length).toBe(0);
  });
});
