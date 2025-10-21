// spec: TEST_PLAN.md - シナリオ 11: 設定永続化とロケール反映
// seed: seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('シナリオ 11: 設定永続化とロケール反映', () => {
  test('設定とロケールが再起動後も反映される', async ({ page }) => {
    // 1. アプリを起動する
    await page.goto('http://localhost:5173');

    // 2. データ読み込み完了まで3秒待機
    await new Promise(f => setTimeout(f, 3 * 1000));

    // 3. Welcomeモーダルをスキップする
    await page.getByRole('button', { name: 'スキップ' }).click();

    // 4. 言語セレクターで現在の言語を確認する（初期: 日本語）
    const languageSelector = page.getByRole('combobox');
    await expect(languageSelector).toHaveValue('ja');

    // 5. 言語を英語に切り替える
    await languageSelector.selectOption(['en']);

    // 6. UI表記が英語に変わることを確認
    await expect(page.getByRole('heading', { name: 'Dyson Sphere Program - Production Calculator' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Settings', level: 2 })).toBeVisible();

    // 7. 増産剤を「Proliferator Mk.III」に設定する
    await page.locator('button').filter({ hasText: 'Proliferator Mk.III' }).click();

    // 8. ベルトランクを「Mk.III」に変更する
    await page.getByRole('button', { name: 'Mk.III 30/s' }).click();

    // 9. ページをリロードする
    await page.goto('http://localhost:5173');

    // 10. データ読み込み完了まで3秒待機
    await new Promise(f => setTimeout(f, 3 * 1000));

    // 12. 言語が英語のまま維持されていることを確認
    await expect(languageSelector).toHaveValue('en');
    await expect(page.getByRole('heading', { name: 'Dyson Sphere Program - Production Calculator' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Settings', level: 2 })).toBeVisible();

    // 13. 増産剤が「Proliferator Mk.III」と表示されていることを確認
    await expect(page.getByRole('heading', { name: 'Active Effects', level: 4 })).toBeVisible();
    await expect(page.locator('text=Speed Bonus')).toBeVisible();
    await expect(page.locator('text=+100.0%').first()).toBeVisible();

    // 14. ベルトランクが「Mk.III」のまま維持されていることを確認
    await expect(page.locator('text=Total Belt Speed')).toBeVisible();
    await expect(page.locator('text=30 items/second')).toBeVisible();

    // 15. HTML lang属性が"en"になっていることを確認
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('en');
  });
});
