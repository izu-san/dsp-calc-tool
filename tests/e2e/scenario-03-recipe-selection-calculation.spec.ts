// spec: docs/TEST_PLAN.md - シナリオ3
// seed: tests/fixtures/seed.spec.ts

import { test, expect } from '@playwright/test';
import {
  initializeApp,
  selectRecipe,
  setTargetQuantity,
  switchTab,
} from './helpers/common-actions';
import { RECIPES, BUTTON_LABELS } from './helpers/constants';

test.describe('レシピ選択 → 目標数量入力 → 計算結果表示', () => {
  test('レシピ選択から計算結果表示までの基本フロー', async ({ page }) => {
    // 1. アプリを起動し、初期状態まで準備
    await initializeApp(page);

    // 2. レシピセレクターから「鉄インゴット」を選択
    await selectRecipe(page, RECIPES.IRON_INGOT);

    // 3-4. 目標数量に 10 を入力する
    await setTargetQuantity(page, 10);

    // 5. Production Tree が表示され、計算結果が反映されていることを確認
    await expect(
      page.getByRole('button', { name: BUTTON_LABELS.COLLAPSE }).getByText('10.0/s').first()
    ).toBeVisible();

    // 6. 統計ビューへ切替可能か確認
    await switchTab(page, BUTTON_LABELS.STATISTICS);

    // 7. 建設コストビューへ切替可能か確認
    await switchTab(page, BUTTON_LABELS.BUILDING_COST);
  });
});
