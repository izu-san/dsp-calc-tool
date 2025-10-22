// spec: docs/TEST_PLAN.md - シナリオ16
// seed: tests/fixtures/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('ノード個別設定（NodeSettingsModal）のオーバーライド', () => {
  test('ノード固有設定がグローバル設定をオーバーライドし、該当ノードのみが変更される', async ({ page }) => {
    // 1. アプリを起動する
    await page.goto('http://localhost:5173');
    
    // データ読み込み完了を待つ
    await new Promise(f => setTimeout(f, 3 * 1000));
    
    // 2. Welcomeモーダルをスキップする
    await page.getByRole('button', { name: 'スキップ' }).click();
    
    // 3. レシピ（鉄インゴット）を選択する
    await page.getByRole('button', { name: '鉄インゴット' }).click();
    
    // 4. 目標数量を10に設定する
    await page.getByRole('spinbutton').fill('10');
    
    // 5. Production Treeが表示されることを確認する
    await expect(page.getByText('アーク製錬所 × 10.0')).toBeVisible();
    await expect(page.getByRole('button', { name: '折りたたむ' }).getByText('7.2 MW')).toBeVisible();
    await expect(page.getByText('🌐')).toBeVisible();
    await expect(page.getByText('グローバル設定を使用中')).toBeVisible();
    
    // 6-7. 初期状態では「カスタム設定を使用」がオフで、グローバル設定が表示されていることを確認
    const customSettingsSwitch = page.getByRole('switch', { name: 'カスタム設定を使用' });
    await expect(customSettingsSwitch).not.toBeChecked();
    
    // 8. 「カスタム設定を使用」スイッチをオンにする
    await customSettingsSwitch.click();
    
    // スイッチがオンになったことを確認
    await expect(customSettingsSwitch).toBeChecked();
    
  // カスタム設定のコンボボックスが表示されることを確認
  // aria-label を厳密一致で指定し、画像等のラベルと衝突しないようにする
  await expect(page.getByLabel('増産剤', { exact: true })).toBeVisible();

  // 9. 増産剤をMk.IIIに設定する
  await page.getByLabel('増産剤', { exact: true }).selectOption(['Mk.III']);
    
    // 10. マシンランクを最高ランク（負エントロピー溶鉱炉）に設定する
    await page.getByRole('combobox').nth(2).selectOption(['負エントロピー溶鉱炉']);
    
    // 11-12. 該当ノードの計算結果（マシン数・電力・出力量）が更新されることを確認
    await expect(page.getByText('負エントロピー製錬所 × 1.7')).toBeVisible();
    await expect(page.getByRole('button', { name: '折りたたむ' }).getByText('12.6 MW')).toBeVisible();
    await expect(page.getByText('🧪 MK3 · 速度')).toBeVisible();
    await expect(page.getByRole('button', { name: '折りたたむ' }).getByText('10.0/s').first()).toBeVisible();
    
    // What-if分析の値も更新されていることを確認
    await expect(page.getByText('現在: 12.6 MW · 1.7 施設数')).toBeVisible();
    
    // 13. 他のノード（鉄鉱石）はグローバル設定のまま変化していないことを確認
    // 鉄鉱石ノードは採掘なので、設定の影響を受けない
    await expect(page.getByText('⛏️ 鉄鉱脈')).toBeVisible();
    await expect(page.getByText('10.0/s').last()).toBeVisible();
    
    // 14. カスタム設定をクリアしてグローバル設定に戻ることを確認
    // スイッチをオフにする
    await customSettingsSwitch.click();
    
    // スイッチがオフになったことを確認
    await expect(customSettingsSwitch).not.toBeChecked();
    
    // グローバル設定に戻ったことを確認
    await expect(page.getByText('グローバル設定を使用中')).toBeVisible();
    await expect(page.getByText('アーク製錬所 × 10.0')).toBeVisible();
    await expect(page.getByRole('button', { name: '折りたたむ' }).getByText('7.2 MW')).toBeVisible();
  });
});
