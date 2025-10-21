// spec: docs/TEST_PLAN.md - シナリオ 10
// seed: tests/fixtures/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('境界値・大規模値の入力（数値精度・パフォーマンス）', () => {
  test('極大値・極小値の計算とUI安定性の検証', async ({ page }) => {
    // 1. アプリを起動する
    await page.goto('http://localhost:5173');

    // 2. データ読み込み完了まで3秒待機
    await new Promise(f => setTimeout(f, 3 * 1000));

    // 3. Welcomeモーダルをスキップする
    await page.getByRole('button', { name: 'スキップ' }).click();

    // 4. RecipeSelectorから「宇宙マトリックス」を選択する（最も複雑な生産チェーン）
    await page.getByRole('button', { name: '宇宙マトリックス' }).click();

    // 5. 極大値(1,000,000,000)を入力する
    const targetInput = page.getByRole('spinbutton');
    await targetInput.fill('1000000000');

    // 6. 計算が完了するまで待機する（宇宙マトリックスは計算が重いため長めに待つ）
    await new Promise(f => setTimeout(f, 3 * 1000));

    // 極大値での計算結果を検証
    // Production Tree内で計算が完了していることを確認
    // 宇宙マトリックスの生産には電磁マトリックス、エネルギーマトリックス、構造マトリックス、情報マトリックス、重力マトリックスが必要
    await expect(page.getByRole('heading', { name: '生産チェーン', level: 2 })).toBeVisible();
    
    // UIが安定していることを確認（エラーメッセージがないこと）
    await expect(page.getByText(/NaN/)).not.toBeVisible();
    await expect(page.getByText(/Infinity/)).not.toBeVisible();
    await expect(page.getByText(/undefined/)).not.toBeVisible();

    // 統計タブに切り替えて全体の計算結果を確認
    const statsTab = page.getByRole('button', { name: '統計' });
    if (await statsTab.isVisible()) {
      await statsTab.click();
      // 統計ビューが表示されることを確認
      await expect(page.getByText(/総電力/)).toBeVisible();
    }

    // 7. 極小値(0.000001)を入力する
    await targetInput.fill('0.000001');

    // 8. 計算が完了するまで1秒待機する
    await new Promise(f => setTimeout(f, 1 * 1000));

    // 極小値での計算結果を検証（入力値が丸められる可能性を考慮）
    // UIが安定していることを確認
    await expect(page.getByText(/NaN/)).not.toBeVisible();
    await expect(page.getByText(/Infinity/)).not.toBeVisible();
    await expect(page.getByText(/undefined/)).not.toBeVisible();

    // 9. 通常値(10)を入力してシステムの回復を確認する
    await targetInput.fill('10');

    // 10. 計算が完了するまで1秒待機する
    await new Promise(f => setTimeout(f, 1 * 1000));

    // 通常値での計算結果を検証
    // Production Treeが表示されることを確認
    await expect(page.getByRole('heading', { name: '生産チェーン', level: 2 })).toBeVisible();
    
    // 目標値が反映されていることを確認
    await expect(targetInput).toHaveValue('10');

    // UIが安定していることを確認（エラーメッセージがないこと）
    await expect(page.getByText(/NaN/)).not.toBeVisible();
    await expect(page.getByText(/Infinity/)).not.toBeVisible();
    await expect(page.getByText(/undefined/)).not.toBeVisible();
    
    // ページ全体がクラッシュしていないことを確認
    await expect(page.getByRole('heading', { name: 'Dyson Sphere Program - レシピ計算機', level: 1 })).toBeVisible();
  });
});
