import { test } from '@playwright/test';

test.describe('Test group', () => {
  test('seed', async ({ page }) => {
    // 1. アプリを起動する
    await page.goto('http://localhost:5173');

    // 2. データ読み込み完了まで3秒待機
    await new Promise(f => setTimeout(f, 3 * 1000));

    // 3. Welcomeモーダルをスキップする
    await page.getByRole('button', { name: 'スキップ' }).click();
  });
});
