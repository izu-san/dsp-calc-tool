import { test, expect } from '@playwright/test';
import { initializeApp, selectRecipe, waitForCalculation } from './helpers/common-actions';

/**
 * E2E Test Scenario 24: 複数出力レシピの表示
 * 
 * このテストは、複数の出力アイテムを持つレシピを選択した際に、
 * すべての出力アイテムが正しく表示されることを確認します。
 */
test.describe('Scenario 24: Multi-Output Recipes', () => {
  test.beforeEach(async ({ page }) => {
    await initializeApp(page);
  });

  test('X線クラッキング: 複数出力アイテムセクションが表示される', async ({ page }) => {
    // X線クラッキングレシピを選択（水素×3 + 高エネルギーグラファイト×1）
    await selectRecipe(page, 'X線クラッキング');
    await waitForCalculation(page);

    // 複数出力アイテムセクションが表示されることを確認
    const multiOutputSection = page.locator('text=複数出力アイテム').first();
    await expect(multiOutputSection).toBeVisible();

    // 水素が表示されることを確認
    const hydrogenItem = page.locator('text=水素').first();
    await expect(hydrogenItem).toBeVisible();

    // 高エネルギーグラファイトが表示されることを確認
    const graphiteItem = page.locator('text=高エネルギーグラファイト').first();
    await expect(graphiteItem).toBeVisible();

    // 生産速度が表示されることを確認（/s表記）
    const productionRates = page.locator('text=/\\d+\\.\\d+\\/s/').first();
    await expect(productionRates).toBeVisible();
  });

  test('X線クラッキング: 統計タブで正しい値が表示される', async ({ page }) => {
    // X線クラッキングレシピを選択
    await selectRecipe(page, 'X線クラッキング');
    await waitForCalculation(page);

    // 統計タブに切り替え
    await page.click('text=統計');

    // 最終生産物セクションを確認
    const finalProductsSection = page.locator('text=最終生産物').first();
    await expect(finalProductsSection).toBeVisible();

    // 水素が最終生産物として表示されることを確認
    const hydrogenRow = page.locator('tr:has-text("水素")').first();
    await expect(hydrogenRow).toBeVisible();

    // 高エネルギーグラファイトが最終生産物として表示されることを確認
    const graphiteRow = page.locator('tr:has-text("高エネルギーグラファイト")').first();
    await expect(graphiteRow).toBeVisible();

    // 原材料セクションを確認
    const rawMaterialsSection = page.locator('text=原材料').first();
    await expect(rawMaterialsSection).toBeVisible();

    // 原材料テーブルが存在することを確認
    const rawMaterialsTable = page.locator('text=原材料').locator('..').locator('table');
    await expect(rawMaterialsTable).toBeVisible();

    // 水素が原材料として表示されることを確認（入力）
    const hydrogenRawRow = rawMaterialsTable.locator('tr:has-text("水素")').first();
    await expect(hydrogenRawRow).toBeVisible();
  });

  test('プラズマ精製: 複数出力アイテムが表示される', async ({ page }) => {
    // プラズマ精製レシピを選択（水素×1 + 精製油×2）
    await selectRecipe(page, 'プラズマ精製');
    await waitForCalculation(page);

    // 複数出力アイテムセクションが表示されることを確認
    const multiOutputSection = page.locator('text=複数出力アイテム').first();
    await expect(multiOutputSection).toBeVisible();

    // 水素が表示されることを確認
    const hydrogenItem = page.locator('text=水素');
    await expect(hydrogenItem.first()).toBeVisible();

    // 精製油が表示されることを確認
    const refinedOilItem = page.locator('text=精製油');
    await expect(refinedOilItem.first()).toBeVisible();
  });

  test('グラフェン（高度）: 複数出力アイテムが表示される', async ({ page }) => {
    // グラフェン（高度）レシピを選択（グラフェン×2 + 水素×1）
    await selectRecipe(page, 'グラフェン (高度)');
    await waitForCalculation(page);

    // 複数出力アイテムセクションが表示されることを確認
    const multiOutputSection = page.locator('text=複数出力アイテム').first();
    await expect(multiOutputSection).toBeVisible();

    // グラフェンが表示されることを確認
    const grapheneItem = page.locator('text=グラフェン').first();
    await expect(grapheneItem).toBeVisible();

    // 水素が表示されることを確認
    const hydrogenItem = page.locator('text=水素').first();
    await expect(hydrogenItem).toBeVisible();
  });

  test('単一出力レシピ: 複数出力アイテムセクションが表示されない', async ({ page }) => {
    // 単一出力レシピを選択（例: 鉄インゴット）
    await selectRecipe(page, '鉄インゴット');
    await waitForCalculation(page);

    // 複数出力アイテムセクションが表示されないことを確認
    const multiOutputSection = page.locator('text=複数出力アイテム');
    await expect(multiOutputSection).not.toBeVisible();
  });

  test('複数出力アイテムのUI: アイコンと生産速度が表示される', async ({ page }) => {
    // X線クラッキングレシピを選択
    await selectRecipe(page, 'X線クラッキング');
    await waitForCalculation(page);

    // 複数出力アイテムセクション内のアイテムを確認
    const multiOutputSection = page.locator('text=複数出力アイテム').locator('..').locator('..');

    // アイテムアイコンが表示されることを確認
    const itemIcons = multiOutputSection.locator('img, div[role="img"]');
    await expect(itemIcons.first()).toBeVisible();

    // 生産速度が大きく表示されることを確認（text-lg font-bold クラス）
    const productionRate = multiOutputSection.locator('text=/\\d+\\.\\d+\\/s/').first();
    await expect(productionRate).toBeVisible();
    
    // 生産速度が右揃えになっていることを確認（視覚的には検証できないが、要素の存在を確認）
    const rateElement = multiOutputSection.locator('.text-lg.font-bold').first();
    await expect(rateElement).toBeVisible();
  });

  test('複数出力レシピ: ターゲット数量を変更すると生産速度が更新される', async ({ page }) => {
    // X線クラッキングレシピを選択
    await selectRecipe(page, 'X線クラッキング');
    await waitForCalculation(page);

    // 初期の生産速度を取得
    const initialRate = await page.locator('text=複数出力アイテム').locator('..').locator('..').locator('text=/\\d+\\.\\d+\\/s/').first().textContent();

    // ターゲット数量を変更
    const targetInput = page.locator('input[type="number"]').first();
    await targetInput.fill('10');
    await waitForCalculation(page);

    // 生産速度が更新されることを確認
    const updatedRate = await page.locator('text=複数出力アイテム').locator('..').locator('..').locator('text=/\\d+\\.\\d+\\/s/').first().textContent();
    expect(updatedRate).not.toBe(initialRate);
  });

  test('複数出力レシピ: 言語切り替えで翻訳が更新される', async ({ page }) => {
    // X線クラッキングレシピを選択
    await selectRecipe(page, 'X線クラッキング');
    await waitForCalculation(page);

    // 日本語で複数出力アイテムセクションが表示されることを確認
    await expect(page.locator('text=複数出力アイテム')).toBeVisible();

    // 英語に切り替え
    await page.selectOption('select', 'en');

    // 英語で表示が更新されることを確認
    await expect(page.locator('text=Multi-Output Items')).toBeVisible();
  });
});

