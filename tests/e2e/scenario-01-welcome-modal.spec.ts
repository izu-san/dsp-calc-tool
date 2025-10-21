// spec: docs/TEST_PLAN.md - シナリオ 1
// seed: tests/fixtures/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('起動時のWelcomeモーダル', () => {
  test('Welcome モーダルの表示と閉じる操作', async ({ page }) => {
    // 1. アプリを起動する（localhost:5173）
    await page.goto('http://localhost:5173');
    
    // データ読み込みが完了するまで待機
    await new Promise(f => setTimeout(f, 2 * 1000));
    
    // 2. Welcome モーダルが表示されることを確認
    await expect(page.getByRole('heading', { name: '🚀 Dyson Sphere Program Production Calculator へようこそ！' })).toBeVisible();
    
    // 4. 「次へ」ボタンでモーダルのページ切替が機能するか確認
    await page.getByRole('button', { name: '次へ' }).click();
    
    // ページ2が表示されていることを確認
    await expect(page.getByText('ステップ 2 / 3')).toBeVisible();
    
    // さらに次へボタンを押してページ3へ移動
    await page.getByRole('button', { name: '次へ' }).click();
    
    // ページ3が表示されていることを確認
    await expect(page.getByText('ステップ 3 / 3')).toBeVisible();
    
    // 3. 「始める！」ボタンでモーダルを閉じる
    await page.getByRole('button', { name: '始める！' }).click();
    
    // モーダルが閉じられたことを確認（Welcomeモーダルが表示されていないこと）
    await expect(page.getByRole('heading', { name: '🚀 Dyson Sphere Program Production Calculator へようこそ！' })).not.toBeVisible();
  });
});
