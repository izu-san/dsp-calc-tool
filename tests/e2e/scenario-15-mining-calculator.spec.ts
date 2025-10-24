// spec: docs/TEST_PLAN.md - シナリオ15
// seed: tests/fixtures/seed.spec.ts

import { test, expect } from '@playwright/test';
import { initializeApp, selectRecipe, setTargetQuantity, switchTab } from './helpers/common-actions';
import { RECIPES, BUTTON_LABELS } from './helpers/constants';

test.describe('採掘計算機の表示と設定反映', () => {
  test('採掘計算機が建設コストビューに正しく表示される', async ({ page }) => {
    // 1. アプリを起動し、初期状態まで準備
    await initializeApp(page);

    // 2. 鉄インゴットレシピを選択
    await selectRecipe(page, RECIPES.IRON_INGOT);

    // 3. 目標数量を10に設定
    await setTargetQuantity(page, 10);

    // 4. 建設コストビューに切り替える
    await switchTab(page, BUTTON_LABELS.BUILDING_COST);

    // 5. 採掘計算機セクションが表示されることを確認
    await expect(page.getByRole('heading', { name: '⛏️ 採掘計算機' })).toBeVisible();

    // 6. 鉄鉱石の必要量（20.0/s）が表示されることを確認
    await expect(page.getByText('必要量: 20.0/s')).toBeVisible();

    // 7. 採掘機タイプが「高度採掘機」に設定されていることを確認（デフォルト）
    // 建設コストビュー内のcomboboxを取得（言語選択を除外）
    const allComboboxes = await page.getByRole('combobox').all();
    const machineTypeCombobox = allComboboxes[1]; // 2番目のcomboboxが採掘機タイプ
    await expect(machineTypeCombobox).toHaveValue('Advanced Mining Machine');

    // 8. 電力倍率が1.0xであることを確認
    await expect(page.getByText('1.0x')).toBeVisible();
    await expect(page.getByText('標準電力')).toBeVisible();
  });
});
