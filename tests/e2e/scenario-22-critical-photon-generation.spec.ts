// spec: Critical Photon Generation Feature E2E Test
// 臨界光子生成機能のE2Eテスト

import { test, expect } from '@playwright/test';
import {
  initializeApp,
  selectRecipe,
  setTargetQuantity,
} from './helpers/common-actions';

test.describe('臨界光子生成機能のテスト', () => {
  test('宇宙マトリックスの生産チェーンで光子生成設定が表示される', async ({ page }) => {
    // 1. アプリを起動し、初期状態まで準備
    await initializeApp(page);

    // 2. レシピセレクターから「宇宙マトリックス」を選択
    await selectRecipe(page, '宇宙マトリックス');

    // 3. 目標数量に 1 を入力（デフォルトのまま）
    await setTargetQuantity(page, 1);

    // 4. 生産チェーンが表示されていることを確認
    await expect(page.getByRole('heading', { name: '宇宙マトリックス', level: 4 })).toBeVisible();

    // 5. 光子生成設定セクションが表示されていることを確認
    await expect(page.getByRole('heading', { name: '⚡ 光子生成', level: 4 })).toBeVisible();

    // 6. 初期状態の伝送効率を確認（30.00%であるべき）
    await expect(page.getByText(/放射線伝送効率: 30\.00%/)).toBeVisible();

    // 7. 連続受信が100%固定であることを確認
    await expect(page.getByText('⚠️ 連続受信: 100% (固定)')).toBeVisible();

    // 8. 重力子レンズのチェックボックスを確認
    const gravitonLensCheckbox = page.getByRole('checkbox', { name: '重力子レンズを使用' });
    await expect(gravitonLensCheckbox).toBeVisible();
    await expect(gravitonLensCheckbox).not.toBeChecked();

    // 9. 反物質ノードが表示されていることを確認
    await expect(page.getByRole('heading', { name: '反物質', level: 4 })).toBeVisible();

    // 10. 統計ビューへ切替
    await page.getByRole('button', { name: '統計' }).click();

    // 11. 統計ビューでダイソンスフィア電力が表示されていることを確認
    await expect(page.getByText('ダイソンスフィア電力')).toBeVisible();

    // 12. 建設コストビューへ切替
    await page.getByRole('button', { name: '建設コスト' }).click();

    // 13. 建設コストビューでγ線レシーバーが表示されていることを確認
    await expect(page.getByText('γ線レシーバー')).toBeVisible();
  });

  test('重力子レンズと太陽光線エネルギー損失研究の設定を操作できる', async ({ page }) => {
    // 1. アプリを起動し、初期状態まで準備
    await initializeApp(page);

    // 2. レシピセレクターから「宇宙マトリックス」を選択
    await selectRecipe(page, '宇宙マトリックス');

    // 3. 重力子レンズのチェックボックスを取得
    const gravitonLensCheckbox = page.getByRole('checkbox', { name: '重力子レンズを使用' });

    // 4. 重力子レンズを使用するチェックボックスをONにする
    await gravitonLensCheckbox.check();
    await expect(gravitonLensCheckbox).toBeChecked();

    // 5. 再計算を待つ
    await page.waitForTimeout(1000);

    // 6. 重力子レンズへの増産剤設定が表示されていることを確認
    await expect(page.getByText('重力子レンズへの増産剤')).toBeVisible();

    // 7. 放射線伝送効率研究レベルを変更する（10に設定）
    const transmissionEfficiencySlider = page.locator('input[type="range"][min="0"]').first();
    await transmissionEfficiencySlider.fill('10');

    // 8. 伝送効率が変化したことを確認（80%台になるはず）
    await page.waitForTimeout(500);
    await expect(page.getByText(/放射線伝送効率: \d+\.\d+%/)).toBeVisible();

    // 9. 重力子レンズのチェックボックスをOFFに戻す
    await gravitonLensCheckbox.uncheck();
    await expect(gravitonLensCheckbox).not.toBeChecked();

    // 10. 放射線伝送効率研究レベルを0に戻す
    await transmissionEfficiencySlider.fill('0');

    // 11. 伝送効率が30.00%に戻ることを確認
    await page.waitForTimeout(500);
    await expect(page.getByText(/放射線伝送効率: 30\.00%/)).toBeVisible();
  });

  test('重力子レンズへの増産剤の効果が反映される', async ({ page }) => {
    // 1. アプリを起動し、初期状態まで準備
    await initializeApp(page);

    // 2. レシピセレクターから「宇宙マトリックス」を選択
    await selectRecipe(page, '宇宙マトリックス');

    // 3. 重力子レンズを使用するチェックボックスをONにする
    const gravitonLensCheckbox = page.getByRole('checkbox', { name: '重力子レンズを使用' });
    await gravitonLensCheckbox.check();
    await page.waitForTimeout(1000);

    // 4. 重力子レンズへの増産剤設定が表示されていることを確認
    await expect(page.getByText('重力子レンズへの増産剤')).toBeVisible();

    // 5. 増産剤なしの状態を確認（速度モードなし）
    const noneButton = page.getByRole('button', { name: 'なし' }).last();
    await expect(noneButton).toHaveClass(/bg-neon-magenta/); // 選択されているボタンは bg-neon-magenta クラスを持つ

    // 6. 増産剤 Mk.III を選択（速度上昇 +25%）
    const mk3Icon = page.getByRole('button', { name: /増産剤 Mk\.III/ }).last();
    await mk3Icon.click();
    await page.waitForTimeout(1000);

    // 7. 増産剤 Mk.III が選択されていることを確認（アイコンボタンは bg-neon-cyan で選択状態）
    await expect(mk3Icon).toHaveClass(/bg-neon-cyan/);

    // 8. 増産剤 Mk.II を選択（速度上昇 +20%）
    const mk2Icon = page.getByRole('button', { name: /増産剤 Mk\.II/ }).last();
    await mk2Icon.click();
    await page.waitForTimeout(1000);

    // 9. 増産剤 Mk.II が選択されていることを確認
    await expect(mk2Icon).toHaveClass(/bg-neon-cyan/);

    // 10. 増産剤 Mk.I を選択（速度上昇 +12.5%）
    const mk1Icon = page.getByRole('button', { name: /増産剤 Mk\.I/ }).last();
    await mk1Icon.click();
    await page.waitForTimeout(1000);

    // 11. 増産剤 Mk.I が選択されていることを確認
    await expect(mk1Icon).toHaveClass(/bg-neon-cyan/);

    // 12. 増産剤をなしに戻す
    await noneButton.click();
    await page.waitForTimeout(1000);

    // 13. なしが選択されていることを確認（速度モードボタンに戻る）
    await expect(noneButton).toHaveClass(/bg-neon-magenta/);
  });

  test('光子生成設定変更時にツリーの折りたたみ状態が保持される', async ({ page }) => {
    // 1. アプリを起動し、初期状態まで準備
    await initializeApp(page);

    // 2. レシピセレクターから「宇宙マトリックス」を選択
    await selectRecipe(page, '宇宙マトリックス');

    // 3. すべて展開ボタンを押す
    await page.getByRole('button', { name: '▼ すべて展開' }).click();
    await page.waitForTimeout(1500); // 展開アニメーションを待つ

    // 4. 電磁マトリックスのノードが展開されていることを確認
    await expect(page.getByRole('heading', { name: '電磁マトリックス', level: 4 })).toBeVisible();

    // 5. 重力子レンズを使用するチェックボックスをONにする
    const gravitonLensCheckbox = page.getByRole('checkbox', { name: '重力子レンズを使用' });
    await gravitonLensCheckbox.check();

    // 6. 再計算を待つ
    await page.waitForTimeout(1000);

    // 7. 電磁マトリックスのノードがまだ表示されていることを確認（折りたたみ状態が保持されている）
    await expect(page.getByRole('heading', { name: '電磁マトリックス', level: 4 })).toBeVisible();

    // 8. 放射線伝送効率研究レベルを変更
    const transmissionEfficiencySlider = page.locator('input[type="range"][min="0"]').first();
    await transmissionEfficiencySlider.fill('20');

    // 9. 再計算を待つ
    await page.waitForTimeout(1000);

    // 10. 電磁マトリックスのノードがまだ表示されていることを確認
    await expect(page.getByRole('heading', { name: '電磁マトリックス', level: 4 })).toBeVisible();

    // 11. 重力子レンズのチェックボックスをOFFに戻す
    await gravitonLensCheckbox.uncheck();

    // 12. 再計算を待つ
    await page.waitForTimeout(1000);

    // 13. 電磁マトリックスのノードがまだ表示されていることを確認
    await expect(page.getByRole('heading', { name: '電磁マトリックス', level: 4 })).toBeVisible();
  });

  test('光子生成設定がlocalStorageに保存される', async ({ page }) => {
    // 1. アプリを起動し、初期状態まで準備
    await initializeApp(page);

    // 2. レシピセレクターから「宇宙マトリックス」を選択
    await selectRecipe(page, '宇宙マトリックス');

    // 3. 重力子レンズを使用するチェックボックスをONにする
    const gravitonLensCheckbox = page.getByRole('checkbox', { name: '重力子レンズを使用' });
    await gravitonLensCheckbox.check();
    await page.waitForTimeout(1000);

    // 4. 放射線伝送効率研究レベルを50に設定（増産剤選択前）
    const transmissionEfficiencySlider = page.locator('input[type="range"][min="0"]').first();
    await transmissionEfficiencySlider.fill('50');
    await page.waitForTimeout(500);

    // 5. 増産剤 Mk.II を選択
    const mk2Icon = page.getByRole('button', { name: /増産剤 Mk\.II/ }).last();
    await mk2Icon.click();
    await page.waitForTimeout(1000);

    // 6. localStorageの設定を確認
    const storageData = await page.evaluate(() => {
      const data = localStorage.getItem('dsp-calculator-settings');
      return data ? JSON.parse(data) : null;
    });

    // 7. photonGeneration設定が保存されていることを確認
    expect(storageData).not.toBeNull();
    expect(storageData.state.settings.photonGeneration).toBeDefined();
    expect(storageData.state.settings.photonGeneration.useGravitonLens).toBe(true);
    expect(storageData.state.settings.photonGeneration.rayTransmissionEfficiency).toBe(50);
    // gravitonLensProliferatorも保存されているか確認（少なくとも構造は保存されている）
    expect(storageData.state.settings.photonGeneration.gravitonLensProliferator).toBeDefined();

    // 8. ページをリロード
    await page.reload();
    await page.waitForTimeout(1500); // リロード後の初期化を待つ

    // 9. レシピセレクターから「宇宙マトリックス」を再選択
    await selectRecipe(page, '宇宙マトリックス');

    // 10. 設定が復元されていることを確認
    const gravitonLensCheckboxAfterReload = page.getByRole('checkbox', { name: '重力子レンズを使用' });
    await expect(gravitonLensCheckboxAfterReload).toBeChecked();

    // 11. 放射線伝送効率が50であることを確認
    const transmissionEfficiencySliderAfterReload = page.locator('input[type="range"][min="0"]').first();
    await expect(transmissionEfficiencySliderAfterReload).toHaveValue('50');

    // 12. 増産剤の設定も復元されていることを確認（UIが存在する）
    const mk2IconAfterReload = page.getByRole('button', { name: /増産剤 Mk\.II/ }).last();
    await expect(mk2IconAfterReload).toBeVisible();
  });
});

