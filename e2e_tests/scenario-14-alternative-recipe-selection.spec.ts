// spec: TEST_PLAN.md - Scenario 14
// seed: seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('代替レシピの選択と比較', () => {
  test('代替レシピ選択UIとRecipeComparisonModalの動作確認', async ({ page }) => {
    // 1. アプリを起動する
    await page.goto('http://localhost:5173');
    
    // データ読み込み完了まで待機
    await new Promise(f => setTimeout(f, 3 * 1000));
    
    // 2. Welcomeモーダルをスキップする
    await page.getByRole('button', { name: 'スキップ' }).click();
    
    // 3. 代替レシピがあるアイテム「グラフェン」を選択する
    await page.getByRole('button', { name: 'グラフェン', exact: true }).click();
    
    // 代替レシピセクションが表示されることを確認
    await expect(page.getByRole('heading', { name: '🔀 代替レシピ' })).toBeVisible();
    
    // 精製油に代替レシピがあることを確認
    await expect(page.getByText('精製油')).toBeVisible();
    await expect(page.getByText('2 代替レシピ').first()).toBeVisible();
    
    // 4. 精製油の代替レシピ「比較」ボタンをクリックする
    const compareButton = page.getByRole('button', { name: '比較' }).nth(1);
    await compareButton.click();
    
    // RecipeComparisonModalが開くことを確認
    await expect(page.getByRole('heading', { name: 'レシピ比較' })).toBeVisible();
    await expect(page.getByText('アイテムの生産方法比較: 精製油')).toBeVisible();
    
    // レシピ比較テーブルが表示されることを確認
    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    
    // 2つのレシピが表示されることを確認
    await expect(page.getByText('改質精製')).toBeVisible();
    await expect(page.getByRole('table').getByText('プラズマ精製')).toBeVisible();
    
    // 効率スコアが表示されることを確認
    await expect(page.getByRole('table').getByText('⭐')).toBeVisible(); // 最も効率的なオプション
    
    // 5. 「改質精製」レシピの「選択」ボタンをクリックして代替レシピを適用する
    const selectButton = page.getByRole('button', { name: '選択', exact: true });
    await selectButton.click();
    
    // モーダルが閉じることを確認
    await expect(page.getByRole('heading', { name: 'レシピ比較' })).not.toBeVisible();
    
    // 生産チェーンが再計算されて表示されることを確認
    await expect(page.getByRole('heading', { name: '生産チェーン' })).toBeVisible();
    
    // 選択したレシピが適用されていることを確認（改質精製が表示されている）
    await expect(page.getByText('改質精製')).toBeVisible();
    
    // 6. ESCキーでモーダルを閉じられることを確認
    // 再度比較ボタンをクリック
    await compareButton.click();
    await expect(page.getByRole('heading', { name: 'レシピ比較' })).toBeVisible();
    
    // ESCキーを押す
    await page.keyboard.press('Escape');
    
    // モーダルが閉じることを確認
    await expect(page.getByRole('heading', { name: 'レシピ比較' })).not.toBeVisible();
  });
});