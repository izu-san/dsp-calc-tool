// spec: docs/TEST_PLAN.md シナリオ 20: テンプレート設定（プリセット）の適用
// seed: tests/fixtures/seed.spec.ts

import { test, expect } from '@playwright/test';
import { initializeApp, selectRecipe } from './helpers/common-actions';
import { RECIPES } from './helpers/constants';

test.describe('テンプレート設定（プリセット）の適用', () => {
  test('5つのテンプレートを適用し、それぞれが正しい設定を反映することを確認', async ({ page }) => {
    // 1-3. アプリを起動し、初期状態まで準備
    await initializeApp(page);

    // 4. レシピ「電磁マトリックス」を選択
    await selectRecipe(page, RECIPES.ELECTROMAGNETIC_MATRIX);

    // 5. テンプレート「🌱序盤」を適用して設定を序盤用（増産剤なし、基本マシン、低ランクベルト）に変更
    await page.getByRole('button', { name: '🌱序盤' }).click();

    // 6. 「序盤」テンプレートの設定を適用して、設定が序盤用に変更されることを確認
    await page.locator('.flex-1.px-4.py-2.text-sm.font-medium.rounded-lg.border-2.border-neon-green').click();

    // 序盤テンプレート適用後の検証
    await expect(page.locator('text=6 アイテム/秒')).toBeVisible();
    await expect(page.locator('text=3.4 MW')).toBeVisible();

    // 7. テンプレート「⚙️中盤」を適用して、設定が中盤用に変更されることを確認
    await page.getByRole('button', { name: '⚙️中盤' }).click();

    // 8. 「中盤」テンプレートの設定を適用し、設定が中盤用に変更されることを確認
    await page.locator('.flex-1.px-4.py-2.text-sm.font-medium.rounded-lg.border-2.border-neon-green').click();

    // 中盤テンプレート適用後の検証
    await expect(page.locator('text=12 アイテム/秒')).toBeVisible();
    await expect(page.locator('text=3.9 MW')).toBeVisible();

    // 9. 「後半」テンプレートボタンをクリックして確認ダイアログを表示
    await page.getByRole('button', { name: '🚀後半' }).click();

    // 10. 「後半」テンプレートの設定を適用し、設定が後半用に変更されることを確認
    await page.locator('.flex-1.px-4.py-2.text-sm.font-medium.rounded-lg.border-2.border-neon-green').click();

    // 後半テンプレート適用後の検証
    await expect(page.locator('text=30 アイテム/秒')).toBeVisible();
    await expect(page.locator('text=5.1 MW')).toBeVisible();

    // 11. 「終盤」テンプレートボタンをクリックして確認ダイアログを表示
    await page.getByRole('button', { name: '⭐終盤' }).click();

    // 12. 「終盤」テンプレートの設定を適用し、すべてが最大設定になることを確認
    await page.getByRole('button', { name: '適用' }).nth(4).click();

    // 終盤テンプレート適用後の検証
    await expect(page.locator('text=120 アイテム/秒')).toBeVisible();
    await expect(page.locator('text=19.0 MW')).toBeVisible();
    await expect(page.locator('text=ボトルネックなし')).toBeVisible();

    // 13. 「省電力」テンプレートボタンをクリックして確認ダイアログを表示
    await page.getByRole('button', { name: '💡省電力' }).click();

    // 14. 「省電力」テンプレートの設定を適用し、追加生産モードで電力効率が良くなることを確認
    await page.getByRole('button', { name: '適用' }).nth(1).click();

    // 省電力テンプレート適用後の検証: 追加生産モードに変更されたことを確認
    await expect(page.locator('text=📦 生産ボーナス:')).toBeVisible();
    await expect(page.locator('text=+25.0%').first()).toBeVisible();
  });
});
