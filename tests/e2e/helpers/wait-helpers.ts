import type { Locator, Page } from "@playwright/test";

/**
 * デバウンス処理を待つヘルパー関数
 * UIの状態が安定するまで待機します（例: 履歴のデバウンス完了）
 *
 * @param page - Playwrightのページオブジェクト
 * @param selector - 状態変化を検出する要素のセレクタ（オプション）
 */
export async function waitForDebounce(page: Page, selector?: string): Promise<void> {
  // ネットワークアイドルを待つ（より安全）
  await page.waitForLoadState("networkidle", { timeout: 2000 }).catch(() => {
    // ネットワークアイドルにならない場合もあるのでエラーは無視
  });

  // DOMの変更が落ち着くまで待つ
  if (selector) {
    await page
      .locator(selector)
      .first()
      .waitFor({ state: "attached", timeout: 1000 })
      .catch(() => {});
  }
}

/**
 * 履歴エントリが作成されるのを待つ
 * デバウンス期間を考慮した安全な待機
 *
 * @param page - Playwrightのページオブジェクト
 */
export async function waitForHistoryEntry(page: Page): Promise<void> {
  // 履歴ストアの更新を待つ（localStorageの変更を監視）
  await page
    .waitForFunction(
      () => {
        const historyData = localStorage.getItem("dsp-calculator-history-store");
        if (!historyData) return false;
        try {
          const parsed = JSON.parse(historyData);
          return parsed.state?.entries && parsed.state.entries.length > 0;
        } catch {
          return false;
        }
      },
      { timeout: 1500 } // タイムアウトを短縮
    )
    .catch(() => {
      // タイムアウトしても続行（一部のテストではエントリが存在しない場合もある）
    });

  // さらに少し待機してデバウンスが完了するのを確実にする
  await page.waitForTimeout(100);
}

/**
 * UI要素がクリック可能になるまで待つ
 *
 * @param page - Playwrightのページオブジェクト
 * @param locator - 待機する要素のLocator
 */
export async function waitForClickable(page: Page, locator: Locator): Promise<void> {
  await locator.waitFor({ state: "visible", timeout: 3000 });
  // 要素が有効化されるまで少し待つ
  await page.waitForTimeout(100);
}

/**
 * テンプレート適用が完了するのを待つ
 *
 * @param page - Playwrightのページオブジェクト
 */
export async function waitForTemplateApplied(page: Page): Promise<void> {
  // テンプレート適用後の再計算完了を待つ
  await page
    .waitForFunction(
      () => {
        // 計算結果が表示されているか確認
        const resultTree = document.querySelector('[data-testid*="production-tree"]');
        return resultTree !== null;
      },
      { timeout: 5000 }
    )
    .catch(() => {});

  // さらにDOMの安定を待つ
  await waitForDebounce(page);
}

export default {
  waitForDebounce,
  waitForHistoryEntry,
  waitForClickable,
  waitForTemplateApplied,
};
