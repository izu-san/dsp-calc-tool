// spec: docs/TEST_PLAN.md (Scenario 5: Production Tree の展開/折り畳みと全展開/全折り畳み)
// seed: tests/fixtures/seed.spec.ts

import { test, expect } from '@playwright/test';
import { initializeApp, selectRecipe, assertProductionTreeVisible } from './helpers/common-actions';
import { RECIPES, BUTTON_LABELS, HEADINGS } from './helpers/constants';

test.describe('Production Tree の展開/折り畳みと全展開/全折り畳み', () => {
  test('Production Tree ノードの展開と折りたたみが正しく機能する', async ({ page }) => {
    // 1-3. アプリを起動し、初期状態まで準備
    await initializeApp(page);

    // 4. レシピ（電磁マトリックス）を選択する
    await selectRecipe(page, RECIPES.ELECTROMAGNETIC_MATRIX);

    // 5. Production Treeが表示されることを確認
    await assertProductionTreeVisible(page);
    await expect(page.getByRole('heading', { name: '電磁マトリックス', level: 4 })).toBeVisible();

    // 6. ルートノードの「折りたたむ」トグルを押して折り畳みを確認
    const collapseButton = page.getByRole('button', { name: BUTTON_LABELS.COLLAPSE });
    await expect(collapseButton).toBeVisible();
    await collapseButton.click();
    
    // 折りたたまれた後、「展開」ボタンが表示されることを確認
    const expandButton = page.getByRole('button', { name: BUTTON_LABELS.EXPAND, exact: true });
    await expect(expandButton).toBeVisible();

    // 7. ルートノードの「展開」トグルを押して展開を確認
    await expandButton.click();
    
    // 展開後、「折りたたむ」ボタンが再び表示されることを確認
    await expect(collapseButton).toBeVisible();

    // 8. 「▼ すべて展開」ボタンを押して全ノード展開を確認
    const expandAllButton = page.getByRole('button', { name: '▼ すべて展開' });
    await expect(expandAllButton).toBeVisible();
    await expandAllButton.click();
    
    // すべて展開後、ボタンが「▼ すべて折りたたむ」に変わることを確認
    const collapseAllButton = page.getByRole('button', { name: '▼ すべて折りたたむ' });
    await expect(collapseAllButton).toBeVisible();
    
    // 子ノードが展開されていることを確認（複数の「折りたたむ」ボタンが表示される）
    const allCollapseButtons = page.getByRole('button', { name: BUTTON_LABELS.COLLAPSE });
    const collapseCount = await allCollapseButtons.count();
    await expect(collapseCount).toBeGreaterThan(1); // ルート + 複数の子ノード

    // 9. 「▼ すべて折りたたむ」ボタンを押して全ノード折りたたみを確認
    await collapseAllButton.click();
    
    // すべて折りたたみ後、ボタンが「▼ すべて展開」に戻ることを確認
    await expect(expandAllButton).toBeVisible();
    
    // ルートノードが折りたたまれていることを確認
    await expect(page.getByRole('button', { name: '展開', exact: true })).toBeVisible();

    // 10. ノード詳細に電力・ベルト・入力/出力が表示されることを確認
    await expect(page.getByRole('button', { name: '展開', exact: true }).getByText('電力')).toBeVisible();
    await expect(page.getByText('🛤️ ベルト')).toBeVisible();
    await expect(page.getByText('入力').first()).toBeVisible();
  });
});
