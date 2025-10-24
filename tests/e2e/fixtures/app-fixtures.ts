/**
 * E2Eテスト用のカスタムfixtures
 * テストの前処理を共通化し、コードの重複を削減する
 */

import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';
import { initializeApp, selectRecipe, setTargetQuantity } from '../helpers/common-actions';

/**
 * カスタムfixturesの型定義
 */
type AppFixtures = {
  /**
   * アプリが初期化された状態のpage
   * データ読み込み完了 + Welcomeモーダルクローズ済み
   */
  appReady: Page;

  /**
   * レシピ選択済みの状態のpage
   * 使用方法: test.use({ recipeName: '鉄インゴット' })
   */
  withRecipeSelected: Page;
};

type AppOptions = {
  /**
   * withRecipeSelected fixture用のレシピ名
   */
  recipeName?: string;

  /**
   * withRecipeSelected fixture用の目標数量
   */
  targetQuantity?: number;
};

/**
 * カスタムfixturesの実装
 */
export const test = base.extend<AppFixtures & AppOptions>({
  // オプション用のfixture（デフォルト値を設定）
  recipeName: ['', { option: true }],
  targetQuantity: [10, { option: true }],

  /**
   * アプリ初期化済みfixture
   * データ読み込み完了 + Welcomeモーダルクローズまで実行
   */
  appReady: async ({ page }, use) => {
    await initializeApp(page);
    await use(page);
  },

  /**
   * レシピ選択済みfixture
   * appReadyを使用し、さらにレシピ選択と目標数量設定を実行
   */
  withRecipeSelected: async ({ appReady, recipeName, targetQuantity }, use) => {
    if (!recipeName) {
      throw new Error('recipeName option must be set when using withRecipeSelected fixture');
    }

    await selectRecipe(appReady, recipeName);
    
    if (targetQuantity) {
      await setTargetQuantity(appReady, targetQuantity);
    }

    await use(appReady);
  },
});

/**
 * カスタムexpectをエクスポート
 */
export { expect } from '@playwright/test';

