// spec: docs/TEST_PLAN.md - シナリオ 10
// seed: tests/fixtures/seed.spec.ts

import { test, expect } from '@playwright/test';
import {
  initializeApp,
  selectRecipe,
  getTargetQuantityInput,
  assertNoErrorPatterns,
  assertProductionTreeVisible,
  switchTab,
} from './helpers/common-actions';
import { RECIPES, BUTTON_LABELS, HEADINGS, TEST_VALUES, TIMEOUTS } from './helpers/constants';

test.describe('境界値・大規模値の入力（数値精度・パフォーマンス）', () => {
  test('極大値・極小値の計算とUI安定性の検証', async ({ page }) => {
    // 1-3. アプリを起動し、初期状態まで準備
    await initializeApp(page);

    // 4. RecipeSelectorから「宇宙マトリックス」を選択する（最も複雑な生産チェーン）
    await selectRecipe(page, RECIPES.UNIVERSE_MATRIX);

    // 5. 極大値(1,000,000,000)を入力する
    const targetInput = getTargetQuantityInput(page);
    await targetInput.fill(String(TEST_VALUES.EXTREME_MAX));

    // 6. 計算が完了するまで待機する（宇宙マトリックスは計算が重いため長めに待つ）
    await page.waitForTimeout(TIMEOUTS.HEAVY_CALCULATION);

    // 極大値での計算結果を検証
    await assertProductionTreeVisible(page);
    
    // UIが安定していることを確認（エラーメッセージがないこと）
    await assertNoErrorPatterns(page);

    // 統計タブに切り替えて全体の計算結果を確認
    const statsTab = page.getByRole('button', { name: BUTTON_LABELS.STATISTICS });
    if (await statsTab.isVisible()) {
      await switchTab(page, BUTTON_LABELS.STATISTICS);
      // 統計ビューが表示されることを確認
      await expect(page.getByText(/総電力/)).toBeVisible();
    }

    // 7. 極小値(0.000001)を入力する
    await targetInput.fill(String(TEST_VALUES.EXTREME_MIN));

    // 8. 計算が完了するまで待機する
    await page.waitForTimeout(TIMEOUTS.CALCULATION);

    // 極小値での計算結果を検証
    await assertNoErrorPatterns(page);

    // 9. 通常値(10)を入力してシステムの回復を確認する
    await targetInput.fill(String(TEST_VALUES.NORMAL));

    // 10. 計算が完了するまで待機する
    await page.waitForTimeout(TIMEOUTS.CALCULATION);

    // 通常値での計算結果を検証
    await assertProductionTreeVisible(page);
    
    // 目標値が反映されていることを確認
    await expect(targetInput).toHaveValue(String(TEST_VALUES.NORMAL));

    // UIが安定していることを確認
    await assertNoErrorPatterns(page);
    
    // ページ全体がクラッシュしていないことを確認
    await expect(page.getByRole('heading', { name: HEADINGS.APP_TITLE, level: 1 })).toBeVisible();
  });
});
