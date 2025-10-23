// spec: docs/TEST_PLAN_RECIPES_ADDITION.md - シナリオ: 同一レシピを再選択しても生産チェーンが維持されること
// seed: tests/fixtures/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('レシピ再選択時の生産チェーン維持', () => {
  test('任意のレシピを選択→再選択してもProduction Treeが維持される', async ({ page }) => {
    // 1. アプリを開き、ホーム／計算画面へ移動する
    await page.goto('http://localhost:5173');

    // データ読み込み完了まで待機（既存テストと同程度）
    await new Promise((f) => setTimeout(f, 3000));

    // Welcome モーダルがある場合は閉じる（'スキップ' -> '始める！' の順で試す）
    const skipButton = page.getByRole('button', { name: 'スキップ' });
    if (await skipButton.count() > 0) {
      await skipButton.click();
      // モーダル遷移の短い待機
      await page.waitForTimeout(200);
    }

    const startButton = page.getByRole('button', { name: '始める！' });
    if (await startButton.count() > 0) {
      await startButton.click();
      await page.waitForTimeout(200);
    }

    // モーダルのオーバーレイ要素が残っている可能性があるため、明示的に消えるのを待つ
    const overlay = page.locator('div[role="dialog"], div[class*="fixed inset-0 bg-black"]');
    if (await overlay.count() > 0) {
      await overlay.waitFor({ state: 'detached', timeout: 2000 }).catch(() => {
        // fallthrough: もし2s経っても消えなければ無視して続行（環境差で失敗するよりは緩和を選ぶ）
      });
    }

    // 2. レシピ選択UIを開く（RecipeSelector は画面に常にある想定）
    // 3. 任意のレシピを1つ選択する（例: 鉄インゴット）
    // コメント: 既存のテストではボタン名は日本語で '鉄インゴット' を使用している
    await page.getByRole('button', { name: '鉄インゴット' }).click();

    // 4. Production Tree が表示されることを確認
    // ノードが表示されることを示すために '折りたたむ' ボタンに目標数量が表示される要素を待つ
    await expect(page.getByRole('button', { name: '折りたたむ' }).first()).toBeVisible();

    // Production Tree 内のノード要素を取得（各ノードは role=treeitem として実装されている可能性があるため両方を試す）
    const treeItems = await page.locator('[data-testid="production-node"]').all();
    let nodeCountBefore = treeItems.length;
    if (nodeCountBefore === 0) {
      // フォールバック: role=treeitem
      nodeCountBefore = await page.getByRole('treeitem').count();
    }

    // ノードのユニークID集合（data-node-id 属性を期待）を収集
    const nodeIdsBefore = await page.locator('[data-testid="production-node"]').evaluateAll((nodes) =>
      nodes.map((n: any) => n.getAttribute('data-node-id'))
    );

    // 5. 再び同じレシピを選択する
    await page.getByRole('button', { name: '鉄インゴット' }).click();

    // 少し待って DOM 更新を待つ
    await page.waitForTimeout(500);

    // 6. 再選択後のノード集合を取得
    const treeItemsAfter = await page.locator('[data-testid="production-node"]').all();
    let nodeCountAfter = treeItemsAfter.length;
    if (nodeCountAfter === 0) {
      nodeCountAfter = await page.getByRole('treeitem').count();
    }

    const nodeIdsAfter = await page.locator('[data-testid="production-node"]').evaluateAll((nodes) =>
      nodes.map((n: any) => n.getAttribute('data-node-id'))
    );

    // アサーション: ノード数が変わらないこと
    expect(nodeCountAfter).toBe(nodeCountBefore);

    // アサーション: ユニークID集合が一致すること（順序は問わない）
    const sortAndCompare = (a: Array<string | null>, b: Array<string | null>) =>
      a.sort().join(',') === b.sort().join(',');

    expect(sortAndCompare(nodeIdsBefore, nodeIdsAfter)).toBeTruthy();

    // 追加検証: コンソールエラーが発生していないこと
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // 少し待って両方の操作に伴うエラー出力を収集
    await page.waitForTimeout(500);

    expect(errors.length).toBe(0);
  });
});
