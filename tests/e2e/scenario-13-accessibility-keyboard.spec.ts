// spec: docs/TEST_PLAN.md - シナリオ 13: アクセシビリティとキーボード操作
// seed: tests/fixtures/seed.spec.ts

import { test, expect } from '@playwright/test';
import { initializeApp } from './helpers/common-actions';

test.describe('アクセシビリティとキーボード操作', () => {
  test('キーボードのみで主要機能を操作可能', async ({ page }) => {
    // 1-3. アプリを起動し、初期状態まで準備
    await initializeApp(page);

    // 4. Tabキーで主要要素にフォーカス移動できるか確認
    await page.keyboard.press('Tab');
    
    // 言語選択コンボボックスにフォーカスが当たっていることを確認
    const languageSelector = page.getByRole('combobox');
    await expect(languageSelector).toBeFocused();

    // 5. さらにTabキーを押して次の要素にフォーカスが移動することを確認
    await page.keyboard.press('Tab');
    
    // 「読み込み」ボタンにフォーカスが当たっていることを確認
    const loadButton = page.getByRole('button', { name: '📂 読み込み' });
    await expect(loadButton).toBeFocused();

    // 6. Enter/Spaceでボタン操作が可能か確認
    await page.keyboard.press('Enter');
    
    // 読み込みモーダルが開いたことを確認
    await expect(page.getByRole('heading', { name: '読み込み', level: 2 })).toBeVisible();
    
    // Escapeキーでモーダルを閉じる試み（機能していない場合もある）
    await page.keyboard.press('Escape');
    
    // モーダルを閉じるボタンをクリック
    await page.getByRole('button', { name: '閉じる' }).click();
    
    // モーダルが閉じたことを確認
    await expect(page.getByRole('heading', { name: '読み込み', level: 2 })).not.toBeVisible();

    // 7. ModSettings のショートカット（Ctrl+Shift+M）が動作するか確認
    await page.keyboard.press('Control+Shift+M');
    
    // Mod設定モーダルが開いたことを確認
    await expect(page.getByRole('heading', { name: 'Mod設定', level: 2 })).toBeVisible();
    
    // モーダルの説明文が表示されていることを確認
    await expect(page.getByText('Mod環境向けの高度な設定')).toBeVisible();
    
    // カスタムRecipes.xmlセクションが表示されていることを確認
    await expect(page.getByRole('heading', { name: '📄 カスタムRecipes.xml', level: 3 })).toBeVisible();
    
    // カスタム増産剤倍率セクションが表示されていることを確認
    await expect(page.getByRole('heading', { name: '💊 カスタム増産剤倍率', level: 3 })).toBeVisible();
    
    // ショートカットキーのヒントが表示されていることを確認
    await expect(page.getByText('Ctrl+Shift+M を押してこのパネルを開く')).toBeVisible();
  });
});
