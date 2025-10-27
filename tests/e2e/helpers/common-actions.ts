/**
 * E2Eテスト用の共通操作ヘルパー
 */

import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { TIMEOUTS, BUTTON_LABELS, HEADINGS, RECIPES, RECIPES_EN } from './constants';

/**
 * アプリの初期読み込みを待機する
 * XMLデータの読み込みが完了するまで待つ
 */
export async function waitForDataLoading(page: Page): Promise<void> {
  // データ読み込み完了を待つ（XMLパース完了のシグナルとして、レシピボタンが表示されるのを待つ）
  await expect(page.getByRole('button').first()).toBeVisible({ timeout: TIMEOUTS.DATA_LOADING });
}

/**
 * Welcomeモーダルを閉じる
 * スキップボタンまたは開始ボタンを使用
 * 
 * @param method - 'skip' | 'start' | 'navigate' (次へボタンで最後まで進む)
 */
export async function closeWelcomeModal(
  page: Page,
  method: 'skip' | 'start' | 'navigate' = 'skip'
): Promise<void> {
  if (method === 'skip') {
    const skipButton = page.getByRole('button', { name: BUTTON_LABELS.SKIP });
    // モーダルが表示されていない場合は何もしない
    if (await skipButton.isVisible().catch(() => false)) {
      await skipButton.click();
    }
  } else if (method === 'start') {
    const startButton = page.getByRole('button', { name: BUTTON_LABELS.START });
    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
    }
  } else if (method === 'navigate') {
    // 次へボタンでページ3まで進み、開始ボタンをクリック
    const nextButton = page.getByRole('button', { name: BUTTON_LABELS.NEXT });
    if (await nextButton.first().isVisible().catch(() => false)) {
      // ページ2へ
      await nextButton.click();
      await page.waitForTimeout(TIMEOUTS.MODAL_ANIMATION);
      // ページ3へ
      await nextButton.click();
      await page.waitForTimeout(TIMEOUTS.MODAL_ANIMATION);
      // 開始ボタンをクリック
      await page.getByRole('button', { name: BUTTON_LABELS.START }).click();
    }
  }

  // モーダルのオーバーレイが完全に消えるのを待つ
  const overlay = page.locator('div[role="dialog"], div[class*="fixed inset-0 bg-black"]');
  if (await overlay.count() > 0) {
    await overlay.waitFor({ state: 'detached', timeout: TIMEOUTS.MODAL_ANIMATION * 2 }).catch(() => {
      // タイムアウトしても続行（環境差を考慮）
    });
  }
}

/**
 * アプリを起動し、初期状態まで準備する
 * データ読み込み完了 + Welcomeモーダルクローズまで実行
 */
export async function initializeApp(page: Page): Promise<void> {
  await page.goto('/');
  await waitForDataLoading(page);
  await closeWelcomeModal(page);
}

/**
 * レシピを選択する
 * 
 * @param page - Pageオブジェクト
 * @param recipeName - レシピ名（例: '鉄インゴット'）
 */
export async function selectRecipe(page: Page, recipeName: string): Promise<void> {
  // Build candidate names to try (support both Japanese and English labels)
  const candidates: string[] = [recipeName];

  // If recipeName matches a value in RECIPES_EN, add the corresponding Japanese name
  for (const key of Object.keys(RECIPES_EN) as Array<keyof typeof RECIPES_EN>) {
    if (RECIPES_EN[key] === recipeName && RECIPES[key]) {
      candidates.push(RECIPES[key]);
      break;
    }
  }

  // If recipeName matches a value in RECIPES (Japanese), try English counterpart too
  for (const key of Object.keys(RECIPES) as Array<keyof typeof RECIPES>) {
    if (RECIPES[key] === recipeName && RECIPES_EN[key]) {
      candidates.push(RECIPES_EN[key]);
      break;
    }
  }

  let found = false;
  let lastError: unknown = null;

  for (const name of candidates) {
    try {
      // Try exact role name first
      let recipeButton = page.getByRole('button', { name, exact: true });
      if ((await recipeButton.count()) === 0) {
        // Try partial match
        recipeButton = page.getByRole('button', { name });
      }

      // Fallback: title attribute
      if ((await recipeButton.count()) === 0) {
        recipeButton = page.locator(`button[title*="${name}"]`);
      }

      // If multiple matched, pick the first visible one
      if ((await recipeButton.count()) > 1) {
        recipeButton = recipeButton.first();
      }

      await expect(recipeButton).toBeVisible();
      await recipeButton.click();
      await page.waitForTimeout(TIMEOUTS.UI_UPDATE);
      found = true;
      break;
    } catch (e) {
      lastError = e;
      // try next candidate
    }
  }

  if (!found) {
    // If nothing matched, throw the last error to show helpful context
    if (lastError) throw lastError;
    throw new Error(`Recipe button not found: ${recipeName}`);
  }
}

/**
 * 目標数量を設定する
 * 
 * @param page - Pageオブジェクト
 * @param value - 設定する数量
 */
export async function setTargetQuantity(page: Page, value: number | string): Promise<void> {
  const input = page.getByRole('spinbutton');
  await expect(input).toBeVisible();
  await input.click();
  await input.fill(String(value));
  // 計算完了を待つ
  await page.waitForTimeout(TIMEOUTS.CALCULATION);
}

/**
 * 計算完了を待つ
 * Production Treeが表示されるのを待機
 */
export async function waitForCalculation(page: Page, isHeavy = false): Promise<void> {
  const timeout = isHeavy ? TIMEOUTS.HEAVY_CALCULATION : TIMEOUTS.CALCULATION;
  // 折りたたむボタンが表示されることで計算完了とみなす
  await expect(page.getByRole('button', { name: BUTTON_LABELS.COLLAPSE }).first())
    .toBeVisible({ timeout });
}

/**
 * タブを切り替える
 * 
 * @param page - Pageオブジェクト
 * @param tabName - タブ名（'統計' | '建設コスト' など）
 */
export async function switchTab(page: Page, tabName: string): Promise<void> {
  const tab = page.getByRole('button', { name: tabName });
  await expect(tab).toBeVisible();
  await tab.click();
  await page.waitForTimeout(TIMEOUTS.UI_UPDATE);
}

/**
 * エラーパターンが表示されていないことを確認
 * NaN, Infinity, undefined などのエラー表示をチェック
 */
export async function assertNoErrorPatterns(page: Page): Promise<void> {
  await expect(page.getByText(/NaN/)).not.toBeVisible();
  await expect(page.getByText(/Infinity/)).not.toBeVisible();
  await expect(page.getByText(/undefined/)).not.toBeVisible();
}

/**
 * Production Treeが表示されていることを確認
 */
export async function assertProductionTreeVisible(page: Page): Promise<void> {
  await expect(
    page.getByRole('heading', { name: HEADINGS.PRODUCTION_CHAIN, level: 2 })
  ).toBeVisible();
}

/**
 * ボタンの有効/無効状態を確認
 */
export async function assertButtonState(
  page: Page,
  buttonName: string,
  enabled: boolean
): Promise<void> {
  const button = page.getByRole('button', { name: buttonName });
  if (enabled) {
    await expect(button).toBeEnabled();
  } else {
    await expect(button).toBeDisabled();
  }
}

/**
 * レシピボタンのLocatorを取得
 */
export function getRecipeButton(page: Page, recipeName: string): Locator {
  return page.getByRole('button', { name: recipeName });
}

/**
 * 目標数量入力フィールドのLocatorを取得
 */
export function getTargetQuantityInput(page: Page): Locator {
  return page.getByRole('spinbutton');
}

/**
 * 保存ボタンのLocatorを取得
 */
export function getSaveButton(page: Page): Locator {
  return page.getByRole('button', { name: BUTTON_LABELS.SAVE });
}

/**
 * URL共有ボタンのLocatorを取得
 */
export function getUrlShareButton(page: Page): Locator {
  return page.getByRole('button', { name: BUTTON_LABELS.URL_SHARE });
}

/**
 * コンソールエラーを収集するリスナーをセットアップ
 * 
 * @returns エラーメッセージの配列
 */
export function setupConsoleErrorListener(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

