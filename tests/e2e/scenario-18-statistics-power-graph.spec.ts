// spec: docs/TEST_PLAN.md - シナリオ 18
// seed: tests/fixtures/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('統計ビュー（StatisticsView）と電力グラフ（PowerGraphView）の表示', () => {
  test('統計タブと電力グラフが正しく表示される', async ({ page }) => {
    // 1. アプリを起動してProduction Treeを準備
    await page.goto('http://localhost:5173');

    // 2. XMLデータの読み込み完了を待機
    await new Promise(f => setTimeout(f, 3 * 1000));

    // 3. Welcomeモーダルをスキップ
    await page.getByRole('button', { name: 'スキップ' }).click();

    // 4. 電磁タービンレシピを選択（複数素材あり、統計確認に適している）
    await page.getByRole('button', { name: '電磁タービン' }).click();

    // 5. 統計タブに切り替えて、StatisticsViewを表示
    await page.getByRole('button', { name: '統計' }).click();

    // 統計ビューが表示されることを確認
    await expect(page.getByRole('heading', { name: '📊 生産概要' })).toBeVisible();

    // 原材料セクションが表示されることを確認
    await expect(page.getByRole('heading', { name: '🔨 原材料' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '鉄鉱石' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '銅鉱石' })).toBeVisible();

    // 中間生産物セクションが表示されることを確認
    await expect(page.getByRole('heading', { name: '⚙️ 中間生産物' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '鉄インゴット' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '磁気コイル' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '磁石' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '電動モーター' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '歯車' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '銅インゴット' })).toBeVisible();

    // 最終生産物セクションが表示されることを確認
    await expect(page.getByRole('heading', { name: '📦 最終生産物' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '電磁タービン' })).toBeVisible();

    // 総施設数と総電力が表示されることを確認
    await expect(page.getByText('総施設数')).toBeVisible();
    await expect(page.getByText('総電力')).toBeVisible();
    await expect(page.getByText('21.4 MW').first()).toBeVisible();

    // 6. 電力グラフ表示ボタンをクリックして、PowerGraphViewを表示
    const powerGraphToggle = page.getByRole('button', { name: '⚡ 表示 電力グラフ' });
    await powerGraphToggle.click();

    // PowerGraphViewが表示されることを確認
    await expect(page.getByRole('heading', { name: '⚡ 総消費電力' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '📊 電力配分' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '⚙️ 電力内訳' })).toBeVisible();

    // 電力内訳データが表示されることを確認
    await expect(page.getByText('アーク製錬所').last()).toBeVisible();
    await expect(page.getByRole('heading', { name: '⚙️ 電力内訳' }).locator('..').getByText('組立機 Mk.I')).toBeVisible();
    await expect(page.getByText('5.0 MW').first()).toBeVisible();
    await expect(page.getByText('3.6 MW').first()).toBeVisible();
    await expect(page.getByText('58.3%').first()).toBeVisible();
    await expect(page.getByText('41.7%').first()).toBeVisible();

    // 7. 電力グラフ非表示ボタンをクリックして、グラフを非表示にする
    const hidePowerGraphToggle = page.getByRole('button', { name: '⚡ 非表示 電力グラフ' });
    await hidePowerGraphToggle.click();

    // PowerGraphViewが非表示になることを確認（電力内訳見出しが表示されない）
    await expect(page.getByRole('heading', { name: '⚡ 総消費電力' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: '⚙️ 電力内訳' })).not.toBeVisible();

    // 統計データは引き続き表示されることを確認
    await expect(page.getByRole('heading', { name: '📊 生産概要' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '🔨 原材料' })).toBeVisible();
  });
});
