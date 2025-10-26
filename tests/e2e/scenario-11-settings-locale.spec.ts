// spec: docs/TEST_PLAN.md - シナリオ 11: 設定永続化とロケール反映
// seed: tests/fixtures/seed.spec.ts

import { test, expect } from '@playwright/test';
import {
  waitForLanguage,
  selectLanguage,
  clickRecipeByName,
  getTargetLabelLocator,
  getProductionRootTitleLocator,
  getProductionHeadingLocator,
} from './helpers/i18n-helpers';
import { waitForDataLoading, initializeApp } from './helpers/common-actions';
import { BUTTON_LABELS } from './helpers/constants';

test.describe('シナリオ 11: 設定永続化とロケール反映', () => {
  test('設定とロケールが再起動後も反映される', async ({ page }) => {
    // 1. アプリを起動する
    await page.goto('/');

    // 2. データ読み込み完了を待機
    await waitForDataLoading(page);

    // 3. Welcomeモーダルをスキップする
    await page.getByRole('button', { name: BUTTON_LABELS.SKIP }).click();

    // 4. 言語セレクターで現在の言語を確認する（初期: 日本語）
    const languageSelector = page.getByRole('combobox');
    await expect(languageSelector).toHaveValue('ja');

    // 5. 言語を英語に切り替える
    await languageSelector.selectOption(['en']);

    // 6. UI表記が英語に変わることを確認
    await expect(page.getByRole('heading', { name: 'Dyson Sphere Program - Production Calculator' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Settings', level: 2 })).toBeVisible();

    // 7. 増産剤を「Proliferator Mk.III」に設定する
    await page.locator('button').filter({ hasText: 'Proliferator Mk.III' }).click();

    // 8. ベルトランクを「Mk.III」に変更する
    await page.getByRole('button', { name: 'Mk.III 30/s' }).click();

    // 9. ページをリロードする
    await page.goto('/');

    // 10. データ読み込み完了を待機
    await waitForDataLoading(page);

    // 12. 言語が英語のまま維持されていることを確認
    await expect(languageSelector).toHaveValue('en');
    await expect(page.getByRole('heading', { name: 'Dyson Sphere Program - Production Calculator' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Settings', level: 2 })).toBeVisible();

    // 13. 増産剤が「Proliferator Mk.III」と表示されていることを確認
    await expect(page.getByRole('heading', { name: 'Active Effects', level: 4 })).toBeVisible();
    await expect(page.locator('text=Speed Bonus')).toBeVisible();
    await expect(page.locator('text=+100.0%').first()).toBeVisible();

    // 14. ベルトランクが「Mk.III」のまま維持されていることを確認
    await expect(page.locator('text=Total Belt Speed')).toBeVisible();
    await expect(page.locator('text=30 items/second')).toBeVisible();

    // 15. HTML lang属性が"en"になっていることを確認
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('en');
  });

  test('シナリオ11A: 設定エリアのアイテム名が言語切替で翻訳されること', async ({ page }) => {
    await initializeApp(page);

  // RecipeSelector で "重力マトリックス" を選択
  // RecipeGrid renders recipe buttons with title=recipe.name, so use role=button locator
  await clickRecipeByName(page, '重力マトリックス');

  // 設定領域の "目標" ラベルが日本語で表示されていることを確認（label 要素を明示的に取得）
  const targetLabelJa = page.locator('label', { hasText: '目標' }).first();
  await expect(targetLabelJa).toBeVisible();

  // 言語を英語に切替（ヘルパーで待機含む）
  await selectLanguage(page, 'en');

  // 英語のラベルに変わっていることを確認（ヘルパーを使って label を取得）
  const targetLabelEn = getTargetLabelLocator(page);
  await expect(targetLabelEn).toBeVisible();
  });

  test('シナリオ11B: 生産チェーンのルートノード名と入力アイテム名が翻訳されること', async ({ page }) => {
    await initializeApp(page);

    // レシピ選択と目標入力
  await clickRecipeByName(page, '重力マトリックス');

    const spin = page.getByRole('spinbutton');
    await expect(spin).toBeVisible();
    await spin.fill('1');

  // Production Results パネルの見出しが表示されることを待つ
  const productionHeading = getProductionHeadingLocator(page);
  await expect(productionHeading).toBeVisible();

  // ルートノードのタイトル（h4）を取得（ヘルパーを利用）
  const rootNodeH4 = getProductionRootTitleLocator(page);
  const rootBefore = (await rootNodeH4.innerText()) ?? '';

  // 言語切替（ヘルパー）
  await selectLanguage(page, 'en');

  const rootAfter = (await rootNodeH4.innerText()) ?? '';

  expect(rootAfter).not.toBe(rootBefore);

  // ページリロード後も状態が維持されることを確認
  await page.reload();
  await waitForLanguage(page, 'en');
  
  // リロード後にレシピを再選択して計算結果を表示
  await clickRecipeByName(page, 'Gravity Matrix');
  const spinReload = page.getByRole('spinbutton');
  await expect(spinReload).toBeVisible();
  await spinReload.fill('1');
  
  // Production Results パネルの見出しが表示されることを待つ
  const productionHeadingReload = getProductionHeadingLocator(page);
  await expect(productionHeadingReload).toBeVisible();
  
  // ルートノードのタイトルを再取得
  const rootNodeH4Reload = getProductionRootTitleLocator(page);
  const rootReload = (await rootNodeH4Reload.innerText()) ?? '';
  expect(rootReload).toBe(rootAfter);
  });
});
