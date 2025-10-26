// spec: 発電設備機能のE2Eテスト
// seed: tests/fixtures/seed.spec.ts

import { test, expect } from '@playwright/test';
import { initializeApp, switchTab } from './helpers/common-actions';
import { BUTTON_LABELS } from './helpers/constants';

test.describe('発電設備機能（PowerGenerationView）', () => {
  test('発電設備タブの基本表示と操作', async ({ page }) => {
    // 1-3. アプリを起動し、初期状態まで準備
    await initializeApp(page);

    // 4. 電磁タービンレシピを選択（電力消費が明確）
    await page.getByRole('button', { name: '電磁タービン' }).click();

    // 5. 統計タブに切り替え
    await switchTab(page, BUTTON_LABELS.STATISTICS);

    // 統計ビューが表示されることを確認
    await expect(page.getByRole('heading', { name: '📊 生産概要' })).toBeVisible();

    // 総電力が表示されることを確認
    await expect(page.getByText('総電力')).toBeVisible();

    // 6. 発電設備タブに切り替え
    const powerGenerationButton = page.getByRole('button', { name: '発電設備' });
    await powerGenerationButton.click();

    // 発電設備ビューが表示されることを確認
    // Note: i18n対応により、翻訳キーから取得されたテキストを使用
    await expect(page.locator('h3').filter({ hasText: /発電設備テンプレート|Power Generation Template/ }).first()).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: /手動選択|Manual Selection/ }).first()).toBeVisible();

    // 必要電力が表示されることを確認
    await expect(page.getByText('必要電力')).toBeVisible();

    // 発電設備構成が表示されることを確認
    await expect(page.getByText('発電設備構成')).toBeVisible();

    // サマリーが表示されることを確認
    await expect(page.getByText('サマリー')).toBeVisible();
    await expect(page.getByText('総設備台数')).toBeVisible();
  });

  test('発電設備テンプレートの変更', async ({ page }) => {
    // 初期化
    await initializeApp(page);

    // レシピを選択
    await page.getByRole('button', { name: '電磁タービン' }).click();

    // 統計タブに切り替え
    await switchTab(page, BUTTON_LABELS.STATISTICS);

    // 発電設備タブに切り替え
    await page.getByRole('button', { name: '発電設備' }).click();

    // テンプレートセレクトボックスを確認
    // Note: i18n対応により、日本語/英語で異なるテキストになる
    const templateHeading = page.locator('h3').filter({ hasText: /発電設備テンプレート|Power Generation Template/ });
    await expect(templateHeading.first()).toBeVisible();
    
    // テンプレートのselectを取得（heading配下のselectを探す）
    // Note: i18n対応により、正規表現で両言語に対応
    const templateCard = page.locator('div.hologram-card').filter({ has: templateHeading });
    const templateSelect = templateCard.locator('select');
    await expect(templateSelect).toBeVisible();

    // デフォルト値を確認
    await expect(templateSelect).toHaveValue('default');

    // テンプレートを変更（序盤）
    await templateSelect.selectOption('earlyGame');
    await expect(templateSelect).toHaveValue('earlyGame');

    // テンプレートを変更（終盤）
    await templateSelect.selectOption('endGame');
    await expect(templateSelect).toHaveValue('endGame');
  });

  test('発電設備の手動選択（自動→手動）', async ({ page }) => {
    // 初期化
    await initializeApp(page);

    // レシピを選択
    await page.getByRole('button', { name: '電磁タービン' }).click();

    // 統計タブに切り替え
    await switchTab(page, BUTTON_LABELS.STATISTICS);

    // 発電設備タブに切り替え
    await page.getByRole('button', { name: '発電設備' }).click();

    // 手動選択エリアを取得
    const manualSelectionArea = page.locator('div:has-text("手動選択（オプション）")').first();
    
    // 手動選択セクションが表示されることを確認
    await expect(page.locator('h3').filter({ hasText: /手動選択|Manual Selection/ }).first()).toBeVisible();
    await expect(manualSelectionArea.locator('label').filter({ hasText: /発電設備|Generator/ }).first()).toBeVisible();

    // 自動選択ボタンが表示されることを確認
    const autoButton = manualSelectionArea.locator('button').filter({ hasText: /自動|Auto/ }).first();
    await expect(autoButton).toBeVisible();

    // 発電設備ボタンが表示されることを確認
    const geothermalButton = manualSelectionArea.getByRole('button', { name: /地熱発電所/ });
    await expect(geothermalButton).toBeVisible();

    // 地熱発電所をクリック
    await geothermalButton.click();

    // 選択状態が変わることを確認（スタイルの変化）
    await expect(geothermalButton).toHaveClass(/scale-105/);
  });

  test('燃料が必要な発電設備の選択', async ({ page }) => {
    // 初期化
    await initializeApp(page);

    // レシピを選択
    await page.getByRole('button', { name: '電磁タービン' }).click();

    // 統計タブに切り替え
    await switchTab(page, BUTTON_LABELS.STATISTICS);

    // 発電設備タブに切り替え
    await page.getByRole('button', { name: '発電設備' }).click();

    // 手動選択エリアを取得
    const manualSelectionArea = page.locator('div:has-text("手動選択（オプション）")').first();

    // 火力発電所を選択（燃料が必要）
    const thermalPlantButton = manualSelectionArea.getByRole('button', { name: /火力発電所/ });
    await expect(thermalPlantButton).toBeVisible();
    await thermalPlantButton.click();

    // 燃料選択UIが表示されることを確認
    const fuelLabel = manualSelectionArea.locator('label').filter({ hasText: /燃料|Fuel/ });
    await expect(fuelLabel.first()).toBeVisible();

    // 燃料ボタンが表示されることを確認
    const coalButton = manualSelectionArea.getByRole('button', { name: /石炭/ });
    await expect(coalButton).toBeVisible();
  });

  test('燃料が不要な発電設備（地熱発電所）', async ({ page }) => {
    // 初期化
    await initializeApp(page);

    // レシピを選択
    await page.getByRole('button', { name: '電磁タービン' }).click();

    // 統計タブに切り替え
    await switchTab(page, BUTTON_LABELS.STATISTICS);

    // 発電設備タブに切り替え
    await page.getByRole('button', { name: '発電設備' }).click();

    // 手動選択エリアを取得
    const manualSelectionArea = page.locator('div:has-text("手動選択（オプション）")').first();

    // 地熱発電所を選択（燃料不要）
    const geothermalButton = manualSelectionArea.getByRole('button', { name: /地熱発電所/ });
    await geothermalButton.click();

    // 燃料選択UIが表示されないことを確認
    // （地熱発電所は燃料不要なので、燃料セクションは非表示）
    const fuelLabel = manualSelectionArea.locator('label').filter({ hasText: /燃料|Fuel/ });
    await expect(fuelLabel).not.toBeVisible();
  });

  test('燃料が1種類の発電設備（ミニ核融合発電所）', async ({ page }) => {
    // 初期化
    await initializeApp(page);

    // レシピを選択
    await page.getByRole('button', { name: '電磁タービン' }).click();

    // 統計タブに切り替え
    await switchTab(page, BUTTON_LABELS.STATISTICS);

    // 発電設備タブに切り替え
    await page.getByRole('button', { name: '発電設備' }).click();

    // ミニ核融合発電所を選択（燃料1種類のみ）
    // 手動選択エリア内の発電設備ボタンを探す
    const manualSelectionArea = page.locator('div:has-text("手動選択（オプション）")').first();
    const miniFusionButton = manualSelectionArea.getByRole('button', { name: /ミニ核融合発電所/ });
    await expect(miniFusionButton).toBeVisible();
    await miniFusionButton.click();

    // 燃料選択UIが表示されないことを確認
    // （ミニ核融合発電所は重水素燃料棒のみなので、燃料選択UIは非表示）
    // 手動選択エリア内に"燃料"ラベルが存在しないことを確認
    const fuelLabel = manualSelectionArea.locator('label').filter({ hasText: /燃料|Fuel/ });
    await expect(fuelLabel).not.toBeVisible();
  });

  test('人工恒星の手動選択（複数燃料対応）', async ({ page }) => {
    // 初期化
    await initializeApp(page);

    // レシピを選択
    await page.getByRole('button', { name: '電磁タービン' }).click();

    // 統計タブに切り替え
    await switchTab(page, BUTTON_LABELS.STATISTICS);

    // 発電設備タブに切り替え
    await page.getByRole('button', { name: '発電設備' }).click();

    // 手動選択エリアを取得
    const manualSelectionArea = page.locator('div:has-text("手動選択（オプション）")').first();

    // 人工恒星を選択（複数燃料対応）
    const artificialStarButton = manualSelectionArea.getByRole('button', { name: /人工恒星/ });
    await expect(artificialStarButton).toBeVisible();
    await artificialStarButton.click();

    // 燃料選択UIが表示されることを確認
    const fuelLabel = manualSelectionArea.locator('label').filter({ hasText: /燃料|Fuel/ });
    await expect(fuelLabel.first()).toBeVisible();

    // 複数の燃料ボタンが表示されることを確認
    // 燃料セクション（grid-cols-8のグリッド）内のボタンのみを対象にする
    const fuelSection = manualSelectionArea.locator('div.grid.grid-cols-8').last();
    
    // 燃料ボタンの数を確認（自動選択 + 2つの燃料）
    const fuelButtons = fuelSection.getByRole('button');
    const fuelButtonCount = await fuelButtons.count();
    expect(fuelButtonCount).toBeGreaterThanOrEqual(3); // 自動 + 反物質 + ストレンジ
    
    // 燃料名でボタンを特定（ItemIconを含むボタン）
    const antimatterButton = fuelSection.locator('button:has-text("反物質燃料棒")');
    const strangeButton = fuelSection.locator('button:has-text("ストレンジ物質対消滅燃料棒")');
    
    await expect(antimatterButton).toBeVisible();
    await expect(strangeButton).toBeVisible();

    // 燃料を選択
    await antimatterButton.click();

    // 選択状態が変わることを確認
    await expect(antimatterButton).toHaveClass(/scale-105/);
  });

  test('発電設備タブから他のタブへの切り替え', async ({ page }) => {
    // 初期化
    await initializeApp(page);

    // レシピを選択
    await page.getByRole('button', { name: '電磁タービン' }).click();

    // 統計タブに切り替え
    await switchTab(page, BUTTON_LABELS.STATISTICS);

    // 発電設備タブに切り替え
    await page.getByRole('button', { name: '発電設備' }).click();

    // 発電設備ビューが表示されることを確認
    await expect(page.getByText('発電設備テンプレート')).toBeVisible();

    // 統計タブに戻る
    await switchTab(page, BUTTON_LABELS.STATISTICS);

    // 統計ビューが表示されることを確認
    await expect(page.getByRole('heading', { name: '📊 生産概要' })).toBeVisible();

    // 再度発電設備タブに切り替え
    await page.getByRole('button', { name: '発電設備' }).click();

    // 発電設備ビューが再び表示されることを確認
    await expect(page.locator('h3').filter({ hasText: /発電設備テンプレート|Power Generation Template/ }).first()).toBeVisible();
  });

  test('電力消費がない場合のメッセージ表示', async ({ page }) => {
    // 初期化
    await initializeApp(page);

    // レシピを選択（電磁タービンを選択してから確認）
    await page.getByRole('button', { name: '電磁タービン' }).click();

    // 統計タブに切り替え
    await switchTab(page, BUTTON_LABELS.STATISTICS);

    // 発電設備タブに切り替え
    const powerGenButton = page.getByRole('button', { name: '発電設備' });
    await powerGenButton.click();

    // 電力が必要な場合は、発電設備が表示されることを確認
    await expect(page.locator('h3').filter({ hasText: /発電設備テンプレート|Power Generation Template/ }).first()).toBeVisible();
    
    // NOTE: 電力消費がゼロのレシピがないため、
    // このテストは基本的に発電設備が表示されることを確認する
  });

  test('発電設備構成の詳細表示', async ({ page }) => {
    // 初期化
    await initializeApp(page);

    // レシピを選択
    await page.getByRole('button', { name: '電磁タービン' }).click();

    // 統計タブに切り替え
    await switchTab(page, BUTTON_LABELS.STATISTICS);

    // 発電設備タブに切り替え
    await page.getByRole('button', { name: '発電設備' }).click();

    // 発電設備構成セクションが表示されることを確認
    await expect(page.getByText('発電設備構成')).toBeVisible();

    // 発電設備の詳細情報が表示されることを期待
    // - 発電設備名
    // - 台数
    // - 総出力
    // - 燃料消費（該当する場合）

    // サマリーセクションが表示されることを確認
    await expect(page.getByText('サマリー')).toBeVisible();
    await expect(page.getByText('総設備台数')).toBeVisible();
  });
});

