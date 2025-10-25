// spec: docs/TEST_PLAN.md (シナリオ 2: ゲームデータ読み込みと初期表示（ハッピーパス）)
// seed: tests/fixtures/seed.spec.ts

import { test, expect } from '@playwright/test';
import { initializeApp } from './helpers/common-actions';
import { HEADINGS } from './helpers/constants';

test.describe('ゲームデータ読み込みと初期表示', () => {
  test('データ読み込みが完了し、RecipeSelectorが表示されることを確認', async ({ page }) => {
    // 1-4. アプリを起動し、初期状態まで準備
    await initializeApp(page);

    // 5. 読み込みが完了し、RecipeSelectorが表示されることを確認する
    await expect(page.getByRole('heading', { name: 'レシピ選択' })).toBeVisible();

    // 6. RecipeSelectorに少なくとも1件のレシピが表示されることを確認する
    await expect(page.locator('text=160 レシピ 見つかりました')).toBeVisible();
    await expect(page.getByRole('button', { name: '鉄インゴット' })).toBeVisible();

    // エラー表示が出ないことを確認（生産チェーンエリアに初期メッセージが表示される）
    await expect(page.getByRole('heading', { name: HEADINGS.PRODUCTION_CHAIN })).toBeVisible();
    await expect(page.locator('text=レシピを選択してください')).toBeVisible();
  });
});
