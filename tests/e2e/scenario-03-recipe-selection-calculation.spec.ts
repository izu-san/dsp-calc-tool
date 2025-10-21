// spec: docs/TEST_PLAN.md - シナリオ3
// seed: tests/fixtures/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('レシピ選択 → 目標数量入力 → 計算結果表示', () => {
  test('レシピ選択から計算結果表示までの基本フロー', async ({ page }) => {
    // 1. アプリを起動する
    await page.goto('http://localhost:5173');

    // データ読み込み完了まで待機
    await new Promise(f => setTimeout(f, 3 * 1000));

    // 1. Welcomeモーダルを閉じる
    await page.getByRole('button', { name: 'スキップ' }).click();

    // 2. レシピセレクターから「鉄インゴット」を選択
    await page.getByRole('button', { name: '鉄インゴット' }).click();

    // 3. 目標数量フィールドをクリック
    await page.getByRole('spinbutton').click();

    // 4. 目標数量に 10 を入力する
    await page.getByRole('spinbutton').fill('10');

    // 5. Production Tree が表示され、計算結果が反映されていることを確認
    await expect(page.getByRole('button', { name: '折りたたむ' }).getByText('10.0/s').first()).toBeVisible();

    // 6. 統計ビューへ切替可能か確認
    await page.getByRole('button', { name: '統計' }).click();

    // 7. 建設コストビューへ切替可能か確認
    await page.getByRole('button', { name: '建設コスト' }).click();
  });
});
