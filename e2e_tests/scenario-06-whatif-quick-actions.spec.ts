// spec: シナリオ 6: What-if分析とクイックアクションの適用
// seed: seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('What-if分析とクイックアクションの適用', () => {
  test('What-if 提案の適用とクイックアクションの実行', async ({ page }) => {
    // 1. アプリを起動する
    await page.goto('http://localhost:5173');

    // 2. 3秒待機してXMLデータの読み込みを待つ
    await new Promise(f => setTimeout(f, 3 * 1000));

    // 3. Welcomeモーダルをスキップする
    await page.getByRole('button', { name: 'スキップ' }).click();

    // 4. レシピ（電磁マトリックス）を選択する
    await page.getByRole('button', { name: '電磁マトリックス' }).click();

    // 5. What-if セクションが表示されることを確認
    await expect(page.getByRole('heading', { name: 'What-if分析', level: 3 })).toBeVisible();
    await expect(page.getByText('異なる設定を比較して生産を最適化')).toBeVisible();

    // 6. 改善提案（増産剤Mk.IIIにアップグレード）が表示されることを確認
    await expect(page.getByText('Mk.III増産剤を使用していません')).toBeVisible();
    await expect(page.getByRole('heading', { name: '増産剤Mk.IIIにアップグレード', level: 4 })).toBeVisible();

    // 7. クイックアクション（🧪 増産剤最大、📦 スタック最大）が表示されることを確認
    await expect(page.getByText('クイックアクション')).toBeVisible();
    await expect(page.getByRole('button', { name: '🧪 増産剤最大' })).toBeVisible();
    await expect(page.getByRole('button', { name: '📦 スタック最大' })).toBeVisible();

    // 初期状態の電力と施設数を記録
    const initialStats = await page.getByText(/現在: .* MW · .* 施設数/).textContent();

    // 8. 「増産剤Mk.IIIにアップグレード」の「適用」ボタンを押す
    await page.getByRole('button', { name: '適用' }).first().click();

    // 9. 設定が Mk.III に変更されることを確認
    await expect(page.getByText('シナリオ適用完了！')).toBeVisible();
    await expect(page.getByText('増産剤Mk.IIIにアップグレード がグローバル設定に適用されました')).toBeVisible();
    // await expect(page.getByText('⚡ 生産速度上昇 +100.0% 速度')).toBeVisible();
    await expect(page.getByText('⚡ 速度ボーナス:')).toBeVisible();
    await expect(page.getByText('+100.0%').first()).toBeVisible();

    // 10. 計算結果（電力・施設数）が更新されることを確認
    const updatedStats = await page.getByText(/現在: .* MW · .* 施設数/).textContent();
    expect(updatedStats).not.toBe(initialStats);

    // ボトルネックが解消されたことを確認
    await expect(page.getByText('ボトルネックなし')).toBeVisible();

    // 生産ツリーに増産剤ブーストが表示されることを確認
    await expect(page.getByText('🧪 MK3 · 生産').first()).toBeVisible();

    // 初期のベルト速度を確認（30 アイテム/秒）
    await expect(page.getByText('30 アイテム/秒')).toBeVisible();

    // 11. 「📦 スタック最大」クイックアクションを押す
    await page.getByRole('button', { name: '📦 スタック最大' }).click();

    // 12. ベルトスタック数が4に変更されることを確認
    await expect(page.getByText('シナリオ適用完了！')).toBeVisible();
    await expect(page.getByText('ベルトスタックを×4に増加 がグローバル設定に適用されました')).toBeVisible();

    // ベルト総速度が120アイテム/秒（30/s × 4）に変更されたことを確認
    await expect(page.getByText('120 アイテム/秒')).toBeVisible();
    await expect(page.getByText('(30/s × 4)')).toBeVisible();

    // すべてのクイックアクションが無効化されたことを確認（最大値適用済み）
    await expect(page.getByRole('button', { name: '🧪 増産剤最大' })).toBeDisabled();
    await expect(page.getByRole('button', { name: '📦 スタック最大' })).toBeDisabled();
  });
});
