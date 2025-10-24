// spec: docs/TEST_PLAN.md - シナリオ 1
// seed: tests/fixtures/seed.spec.ts

import { test, expect } from '@playwright/test';
import { waitForDataLoading } from './helpers/common-actions';
import { HEADINGS, BUTTON_LABELS } from './helpers/constants';

test.describe('起動時のWelcomeモーダル', () => {
  test('Welcome モーダルの表示と閉じる操作', async ({ page }) => {
    // 1. アプリを起動する
    await page.goto('/');
    
    // データ読み込みが完了するまで待機
    await waitForDataLoading(page);
    
    // 2. Welcome モーダルが表示されることを確認
    await expect(page.getByRole('heading', { name: HEADINGS.WELCOME })).toBeVisible();
    
    // 4. 「次へ」ボタンでモーダルのページ切替が機能するか確認
    await page.getByRole('button', { name: BUTTON_LABELS.NEXT }).click();
    
    // ページ2が表示されていることを確認
    await expect(page.getByText('ステップ 2 / 3')).toBeVisible();
    
    // さらに次へボタンを押してページ3へ移動
    await page.getByRole('button', { name: BUTTON_LABELS.NEXT }).click();
    
    // ページ3が表示されていることを確認
    await expect(page.getByText('ステップ 3 / 3')).toBeVisible();
    
    // 3. 「始める！」ボタンでモーダルを閉じる
    await page.getByRole('button', { name: BUTTON_LABELS.START }).click();
    
    // モーダルが閉じられたことを確認（Welcomeモーダルが表示されていないこと）
    await expect(page.getByRole('heading', { name: HEADINGS.WELCOME })).not.toBeVisible();
  });
});
