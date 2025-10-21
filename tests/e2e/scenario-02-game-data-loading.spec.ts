// spec: docs/TEST_PLAN.md (シナリオ 2: ゲームデータ読み込みと初期表示（ハッピーパス）)
// seed: tests/fixtures/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('ゲームデータ読み込みと初期表示', () => {
  test('データ読み込みが完了し、RecipeSelectorが表示されることを確認', async ({ page }) => {
    // 1. アプリを起動する
    await page.goto('http://localhost:5173');

    // 2. ロード画面が表示されることを確認する（データ読み込みが非常に速い場合はスキップされる）
    // await expect(page.locator('text=ゲームデータを読み込み中...')).toBeVisible();

    // 3. 3秒待機してXMLデータの読み込みを待つ
    await new Promise(f => setTimeout(f, 3 * 1000));

    // 4. Welcomeモーダルをスキップする
    await page.getByRole('button', { name: 'スキップ' }).click();

    // 5. 読み込みが完了し、RecipeSelectorが表示されることを確認する
    await expect(page.getByRole('heading', { name: 'レシピ選択' })).toBeVisible();

    // 6. RecipeSelectorに少なくとも1件のレシピが表示されることを確認する
    await expect(page.locator('text=160 レシピ 見つかりました')).toBeVisible();
    await expect(page.getByRole('button', { name: '鉄インゴット' })).toBeVisible();

    // エラー表示が出ないことを確認（生産チェーンエリアに初期メッセージが表示される）
    await expect(page.getByRole('heading', { name: '生産チェーン' })).toBeVisible();
    await expect(page.locator('text=レシピを選択してください')).toBeVisible();
  });
});
