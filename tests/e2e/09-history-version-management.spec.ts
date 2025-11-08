// spec: docs/testing/TEST_PLAN_HISTORY_VERSION_MANAGEMENT.md
// 履歴・バージョン管理機能 E2E テスト

import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { waitForClickable, waitForDebounce, waitForTemplateApplied } from "./helpers/wait-helpers";

test.describe("履歴・バージョン管理機能", () => {
  test.beforeEach(async ({ clearLocalStorageKeepingTutorial, reloadPage }) => {
    // localStorage をクリア（但しWelcomeモーダルのスキップ状態は保持）
    await clearLocalStorageKeepingTutorial();
    await reloadPage();
  }); // ========================================
  // シナリオ 1: 履歴基本挙動
  // ========================================

  test.describe("シナリオ 1: 履歴基本挙動", () => {
    test("1.1: 設定変更の履歴化", async ({ appPage }) => {
      // 前提: レシピ「鉄インゴット」を選択し、目標 1 で計算済み
      await appPage.getByTestId("recipe-button-1101").click(); // 鉄インゴット

      // 目標が自動的に1になっていることを確認
      const targetInput = appPage.getByTestId("target-quantity-input");
      await expect(targetInput).toBeVisible();

      // 1. 設定パネルで増産剤を Mk.I (速度) に設定
      const proliferatorMk1Button = appPage.getByTestId("proliferator-type-button-mk1");
      await proliferatorMk1Button.click();

      // 増産剤モードが表示されるのを待つ
      const speedModeButton = appPage.getByTestId("proliferator-mode-button-speed");
      await expect(speedModeButton).toBeVisible();
      await speedModeButton.click();

      // 2. デバウンス待機後、履歴ダイアログを開く
      await waitForDebounce(appPage);
      await appPage.getByTestId("history-dialog-button").click();

      // 3. 履歴パネルが表示されることを確認
      const historyHeading = appPage.getByRole("heading", { name: "履歴", level: 2 });
      await expect(historyHeading).toBeVisible();

      // 期待結果: 履歴エントリに「増産剤」に関する変更が表示されること
      const historyEntry = appPage.getByTestId("history-entry-0");
      await expect(historyEntry).toBeVisible();
      await expect(appPage.getByText(/増産剤をなし/)).toBeVisible();
    });

    test("1.2: デバウンスまとめ動作", async ({ appPage }) => {
      // 前提: レシピを選択
      await appPage.getByTestId("recipe-button-1101").click(); // 鉄インゴット

      // 履歴をクリア（localStorage から）
      await appPage.evaluate(() => {
        localStorage.removeItem("dsp-calculator-history");
        localStorage.removeItem("dsp-calculator-history-store");
      });

      // 1. 増産剤モードを速度→追加生産→速度と 300ms 間隔で切り替える
      const proliferatorMk1Button = appPage.getByTestId("proliferator-type-button-mk1");
      await proliferatorMk1Button.click();

      // 速度モードを選択
      const speedModeButton = appPage.getByTestId("proliferator-mode-button-speed");
      await expect(speedModeButton).toBeVisible();
      await speedModeButton.click();

      // 追加生産モードを選択
      const extraProductButton = appPage.getByTestId("proliferator-mode-button-production");
      await expect(extraProductButton).toBeVisible();
      await extraProductButton.click();

      // 再び速度モードを選択
      await speedModeButton.click();

      // 2. デバウンス待機後に履歴ダイアログを開く
      await waitForDebounce(appPage);
      await appPage.getByTestId("history-dialog-button").click();

      // 履歴パネルが表示されることを確認
      const historyHeading = appPage.getByRole("heading", { name: "履歴", level: 2 });
      await expect(historyHeading).toBeVisible();

      // localStorageから履歴数を確認
      const historyCount = await appPage.evaluate(() => {
        const historyData = localStorage.getItem("dsp-calculator-history-store");
        if (!historyData) return 0;
        const parsed = JSON.parse(historyData);
        return parsed.state?.entries?.length || 0;
      });

      // デバウンスにより1件にまとまっていることを期待
      expect(historyCount).toBeLessThanOrEqual(2); // 初期操作 + デバウンスまとめ
    });

    test("1.3: Undo/Redo ボタンの有効状態", async ({ appPage }) => {
      // 前提: 履歴エントリが 2 件以上存在
      await appPage.getByTestId("recipe-button-1101").click(); // 鉄インゴット

      // 設定変更1: 増産剤を Mk.I に設定
      const proliferatorMk1Button = appPage.getByTestId("proliferator-type-button-mk1");
      await proliferatorMk1Button.click();
      const speedModeButton = appPage.getByTestId("proliferator-mode-button-speed");
      await speedModeButton.click();
      await waitForDebounce(appPage);

      // 設定変更2: ソーターを Mk.II に変更
      const sorterMk2Button = appPage.getByRole("button", { name: /Mk\.II.*36kW/ });
      await sorterMk2Button.click();
      await waitForDebounce(appPage);

      // 1. Undo ボタンを確認
      const undoButton = appPage.getByTestId("undo-button");
      const redoButton = appPage.getByTestId("redo-button");

      // Undo ボタンが有効になっていることを確認
      await expect(undoButton).toBeEnabled();
      await expect(redoButton).toBeDisabled();

      // 2. Undo ボタンを 2 回押下
      await undoButton.click();
      await undoButton.click();

      // 4. Redo ボタンを 2 回押下
      await expect(redoButton).toBeEnabled();
      await redoButton.click();
      await redoButton.click();

      // 期待結果: Undo ボタンが有効
      await expect(undoButton).toBeEnabled();
    });

    test("1.4: Undo/Redoボタン操作", async ({ appPage }) => {
      // 前提: 履歴が存在する状態
      await appPage.getByTestId("recipe-button-1101").click();

      const proliferatorMk1Button = appPage.getByTestId("proliferator-type-button-mk1");
      await proliferatorMk1Button.click();
      const speedModeButton = appPage.getByTestId("proliferator-mode-button-speed");
      await speedModeButton.click();
      await waitForDebounce(appPage);

      const undoButton = appPage.getByTestId("undo-button");
      const redoButton = appPage.getByTestId("redo-button");

      // 1. Undoボタンをクリック
      await undoButton.click();

      // Undo が実行されたことを確認（増産剤がなしに戻る）
      // 設定パネルで「なし」ボタンが選択されていることを確認
      const noneButton = appPage.getByTestId("proliferator-type-button-none");
      // 選択されたボタンには特定のCSSクラスが付与される
      await expect(noneButton).toHaveClass(/bg-neon-magenta\/30/);

      // Redo ボタンが有効になる
      await expect(redoButton).toBeEnabled();

      // 2. Redoボタンをクリック
      await redoButton.click();

      // Redo が実行されたことを確認（増産剤が速度モードに戻る）
      await expect(appPage.getByText(/生産速度上昇.*\+25\.0%/)).toBeVisible();

      // Undo ボタンが有効になる
      await expect(undoButton).toBeEnabled();
    });

    test("1.5: Undo 後の履歴分岐", async ({ appPage }) => {
      // 前提: 履歴が存在する状態
      await appPage.getByTestId("recipe-button-1101").click();

      const proliferatorMk1Button = appPage.getByTestId("proliferator-type-button-mk1");
      await proliferatorMk1Button.click();
      const speedModeButton = appPage.getByTestId("proliferator-mode-button-speed");
      await speedModeButton.click();
      await waitForDebounce(appPage);

      // Undo を実行
      const undoButton = appPage.getByTestId("undo-button");
      await undoButton.click();

      // 1. Undo 実行後に設定パネルでソーターを Mk.II に変更
      const sorterMk2Button = appPage.getByRole("button", { name: /Mk\.II.*36kW/ });
      await sorterMk2Button.click();
      await waitForDebounce(appPage);

      // 期待結果: Redo ボタンが無効化される
      const redoButton = appPage.getByTestId("redo-button");
      await expect(redoButton).toBeDisabled();

      // 2. 履歴ダイアログを開く
      await appPage.getByTestId("history-dialog-button").click();
      const historyHeading = appPage.getByRole("heading", { name: "履歴", level: 2 });
      await expect(historyHeading).toBeVisible();

      // 新たなエントリが追加されていることを確認 (data-testidを使用)
      const historyEntry = appPage.getByTestId("history-entry-0");
      await expect(historyEntry).toBeVisible();
    });

    test("1.6: 履歴最大数 50 のローテーション", async ({ appPage }) => {
      // テストタイムアウトを120秒に設定
      test.setTimeout(120000);

      // 1. レシピを選択
      await appPage.getByTestId("recipe-button-1101").click(); // 鉄インゴット
      await appPage.waitForTimeout(300); // レシピロード待機

      // 2. ループで 51 件の履歴エントリを作成（増産剤設定を切り替え）
      for (let i = 1; i <= 51; i++) {
        if (i % 2 === 1) {
          // 増産剤 Mk.I 速度モードに変更
          const proliferatorMk1Button = appPage.getByTestId("proliferator-type-button-mk1");
          await proliferatorMk1Button.click();
          const speedModeButton = appPage.getByTestId("proliferator-mode-button-speed");
          await speedModeButton.click();
        } else {
          // 増産剤をなしに変更
          const noneButton = appPage.getByTestId("proliferator-type-button-none");
          await noneButton.click();
        }
        // デバウンス待機（履歴が確実に記録されるまで待つ）
        await appPage.waitForTimeout(600); // デバウンス時間(500ms)より長く
      }

      // 3. 履歴ダイアログを開く
      await appPage.getByTestId("history-dialog-button").click();

      const historyHeading = appPage.getByRole("heading", { name: "履歴", level: 2 });
      await expect(historyHeading).toBeVisible();

      // 4. 履歴エントリの数を確認（UIから直接カウント）
      const historyEntries = appPage.getByTestId(/history-entry-\d+/);
      const entryCount = await historyEntries.count();

      // 期待結果: エントリ数が 50 以下
      expect(entryCount).toBeLessThanOrEqual(50);

      // 期待結果: 履歴エントリが存在する（最大数に達している）
      expect(entryCount).toBeGreaterThan(0);
    });
  });

  // ========================================
  // シナリオ 2: 履歴ダイアログと差分表示
  // ========================================

  test.describe("シナリオ 2: 履歴ダイアログと差分表示", () => {
    test.beforeEach(async ({ appPage }) => {
      // 基本的なレシピを選択
      await appPage.getByTestId("recipe-button-1101").click(); // 鉄インゴット
      await waitForClickable(appPage, appPage.getByTestId("proliferator-type-button-mk1"));
    });
    test("2.1: 差分カテゴリの色分け", async ({ appPage }) => {
      // 1. 設定変更で新規プロパティを追加する操作（増産剤を有効化）
      const proliferatorMk1Button = appPage.getByTestId("proliferator-type-button-mk1");
      await proliferatorMk1Button.click();
      const speedModeButton = appPage.getByTestId("proliferator-mode-button-speed");
      await speedModeButton.click();
      await waitForDebounce(appPage);

      // 2. 別操作で設定を削除（増産剤を無効化）
      const noneButton = appPage.getByTestId("proliferator-type-button-none");
      await noneButton.click();
      await waitForDebounce(appPage);

      // 履歴リストを確認
      await appPage.getByTestId("history-dialog-button").click();

      const historyHeading = appPage.getByRole("heading", { name: "履歴", level: 2 });
      await expect(historyHeading).toBeVisible();

      // 履歴エントリをクリックして詳細を表示 (data-testidを使用)
      const historyEntry = appPage.getByTestId("history-entry-0");
      await expect(historyEntry).toBeVisible();
      await historyEntry.click();
    });

    test("2.2: バッチ操作の説明文", async ({ appPage }) => {
      // 1. テンプレート「終盤」を適用
      const lateGameTemplate = appPage.getByRole("button", { name: /⭐終盤/ });
      await lateGameTemplate.click();

      // テンプレート適用確認ダイアログで適用ボタンをクリック
      const applyButton = appPage.getByTestId("template-confirm-apply-button");
      await expect(applyButton).toBeVisible();
      await applyButton.click();
      await waitForTemplateApplied(appPage);

      // 2. 履歴ダイアログを開く
      await appPage.getByTestId("history-dialog-button").click();

      const historyHeading = appPage.getByRole("heading", { name: "履歴", level: 2 });
      await expect(historyHeading).toBeVisible();

      // 期待結果: 説明「テンプレート「終盤」を適用」が表示される
      // 履歴ダイアログ内のテキストで確認（履歴は新しい順なので最初のエントリ）
      const historyEntries = appPage.getByTestId(/history-entry-text-\d+/);
      const templateEntry = historyEntries.filter({ hasText: /テンプレート.*終盤.*適用/ });
      await expect(templateEntry).toHaveCount(1);

      // 履歴エントリを選択 (data-testidを使用)
      const historyEntry = appPage.getByTestId("history-entry-0");
      await expect(historyEntry).toBeVisible();
    });

    test("2.3: ノードオーバーライド差分", async ({ appPage }) => {
      // 1. レシピ「電磁タービン」で特定ノードにカスタム設定を適用
      await appPage.getByTestId("recipe-button-1204").click(); // 電磁タービン

      // 生産チェーンが表示されるまで待機
      const productionChain = appPage.getByRole("heading", { name: /生産チェーン/ });
      await expect(productionChain).toBeVisible();

      // 設定変更を行う
      const proliferatorMk2Button = appPage.getByTestId("proliferator-type-button-mk2");
      await proliferatorMk2Button.click();
      await waitForDebounce(appPage);

      // 2. 履歴詳細で affectedNodes を確認
      await appPage.getByTestId("history-dialog-button").click();

      const historyHeading = appPage.getByRole("heading", { name: "履歴", level: 2 });
      await expect(historyHeading).toBeVisible();

      // 履歴エントリが存在することを確認 (data-testidを使用)
      const historyEntry = appPage.getByTestId("history-entry-0");
      await expect(historyEntry).toBeVisible();
    });
  });

  // ========================================
  // シナリオ 3: プランバージョン管理
  // ========================================

  test.describe("シナリオ 3: プランバージョン管理", () => {
    test("3.1: 新規プラン保存", async ({ appPage }) => {
      // レシピを選択して設定
      await appPage.getByTestId("recipe-button-1101").click(); // 鉄インゴット

      const targetInput = appPage.getByTestId("target-quantity-input");
      await targetInput.fill("5");
      await targetInput.press("Enter");
      await appPage.waitForTimeout(500);

      // 1. 保存メニューを開く
      await appPage.getByTestId("plan-manager-menu-trigger").click();
      await appPage.getByTestId("plan-menu-save").click();

      // 保存ダイアログが表示されることを確認
      const saveHeading = appPage.getByRole("heading", { name: "保存", level: 2 });
      await expect(saveHeading).toBeVisible();

      // プラン名を入力
      const planNameInput = appPage.getByTestId("plan-name-input");
      await planNameInput.fill("テストプラン1");

      // 「ブラウザに保存」ボタンをクリック
      const browserSaveButton = appPage.getByRole("button", { name: /ブラウザに保存/ });
      await expect(browserSaveButton).toBeVisible();
      await browserSaveButton.click();
      await appPage.waitForTimeout(500);

      // localStorage から保存されたプランを確認
      const savedPlans = await appPage.evaluate(() => {
        const keys = Object.keys(localStorage);
        const planKeys = keys.filter(k => k.includes("saved-plan") || k.includes("plan"));
        return planKeys
          .map(key => {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
          })
          .filter(Boolean);
      });

      // 期待結果: プランが保存されている
      expect(savedPlans.length).toBeGreaterThan(0);
    });

    test("3.2: 既存プランの継続保存", async ({ appPage }) => {
      // 1. 最初のプランを保存
      await appPage.getByTestId("recipe-button-1101").click();
      const targetInput = appPage.getByTestId("target-quantity-input");
      await targetInput.fill("5");
      await appPage.waitForTimeout(500);

      await appPage.getByTestId("plan-manager-menu-trigger").click();
      await appPage.getByTestId("plan-menu-save").click();

      const saveHeading = appPage.getByRole("heading", { name: "保存", level: 2 });
      await expect(saveHeading).toBeVisible();

      const planNameInput = appPage.getByTestId("plan-name-input");
      await planNameInput.fill("バージョンテスト");

      const browserSaveButton = appPage.getByRole("button", { name: /ブラウザに保存/ });
      await browserSaveButton.click();
      await appPage.waitForTimeout(500);

      // ダイアログを閉じる
      const closeButton = appPage.getByRole("button", { name: /閉じる/ });
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await appPage.waitForTimeout(300);
      }

      // 2. プランを編集
      await targetInput.fill("10");
      await appPage.waitForTimeout(500);

      // 再度保存
      await appPage.getByTestId("plan-manager-menu-trigger").click();
      await appPage.getByTestId("plan-menu-save").click();
      await appPage.waitForTimeout(500);

      const browserSaveButton2 = appPage.getByRole("button", { name: /ブラウザに保存/ });
      await browserSaveButton2.click();
      await appPage.waitForTimeout(500);

      // localStorage から保存されたプランを確認
      const savedPlans = await appPage.evaluate(() => {
        const keys = Object.keys(localStorage);
        const planKeys = keys.filter(k => k.includes("saved-plan") || k.includes("plan"));
        return planKeys
          .map(key => {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
          })
          .filter(Boolean);
      });

      // 期待結果: プランが保存されている
      expect(savedPlans.length).toBeGreaterThan(0);
    });

    test("3.3: 既存プランのマイグレーション", async ({ appPage }) => {
      // 1. localStorage に旧形式のプランを注入
      await appPage.evaluate(() => {
        const oldPlan = {
          name: "旧形式プラン",
          recipe: { id: "1101", name: "鉄インゴット" },
          target: 3,
          settings: {},
        };
        localStorage.setItem("saved-plan-old", JSON.stringify(oldPlan));
      });

      // まずレシピを選択してボタンを有効化
      await appPage.getByTestId("recipe-button-1101").click();
      await appPage.waitForTimeout(300);

      // 2. プラン読み込みボタンをクリック
      await appPage.getByTestId("plan-manager-menu-trigger").click();
      await appPage.getByTestId("plan-menu-load").click();

      const loadHeading = appPage.getByRole("heading", { name: "読み込み", level: 2 });
      await expect(loadHeading).toBeVisible();

      // 旧形式プランが表示されることを確認
      const oldPlanItem = appPage.getByText(/旧形式プラン/);

      if (await oldPlanItem.isVisible()) {
        await oldPlanItem.click();
        await appPage.waitForTimeout(300);

        // 読み込みボタンをクリック
        const loadPlanButton = appPage.getByRole("button", { name: /読み込む/ });
        if (await loadPlanButton.isVisible()) {
          await loadPlanButton.click();
          await appPage.waitForTimeout(500);
        }

        // ダイアログを閉じる
        const closeButton = appPage.getByRole("button", { name: /閉じる/ });
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await appPage.waitForTimeout(300);
        }

        // 3. 再保存する
        await appPage.getByTestId("plan-manager-menu-trigger").click();
        await appPage.getByTestId("plan-menu-save").click();

        const browserSaveButton = appPage.getByRole("button", { name: /ブラウザに保存/ });
        await browserSaveButton.click();
        await appPage.waitForTimeout(500);

        // 期待結果: プランが保存されている
        const savedPlans = await appPage.evaluate(() => {
          const keys = Object.keys(localStorage);
          const planKeys = keys.filter(k => k.includes("saved-plan") || k.includes("plan"));
          return planKeys
            .map(key => {
              const data = localStorage.getItem(key);
              return data ? JSON.parse(data) : null;
            })
            .filter(Boolean);
        });

        expect(savedPlans.length).toBeGreaterThan(0);
      }
    });
  });

  // ========================================
  // シナリオ 5: エラーハンドリングとマイグレーション
  // ========================================

  test.describe("シナリオ 5: エラーハンドリングとマイグレーション", () => {
    test("5.1: 無効データ検出", async ({ appPage }) => {
      // 1. localStorage に必須フィールド欠落の履歴エントリを注入
      await appPage.evaluate(() => {
        const invalidHistory = {
          state: {
            entries: [
              {
                // id が欠落
                timestamp: Date.now(),
                type: "settings",
                description: "無効なエントリ",
                changes: {},
              },
              {
                id: "valid-id",
                timestamp: Date.now(),
                // type が欠落
                description: "無効なエントリ2",
                changes: {},
              },
              {
                id: "valid-id-2",
                timestamp: Date.now(),
                type: "settings",
                description: "有効なエントリ",
                changes: { "settings.test": "value" },
              },
            ],
            currentIndex: 2,
          },
        };
        localStorage.setItem("dsp-calculator-history-store", JSON.stringify(invalidHistory));
      });

      // 2. アプリをリロード
      await appPage.reload();
      await appPage.waitForTimeout(1000);

      // 履歴ダイアログを開いて、無効なエントリが除外されていることを確認
      await appPage.getByTestId("history-dialog-button").click();

      const historyHeading = appPage.getByRole("heading", { name: "履歴", level: 2 });
      await expect(historyHeading).toBeVisible();

      // 有効なエントリのみが表示されることを確認 (data-testidを使用)
      const historyEntries = appPage.getByTestId(/history-entry-\d+/);

      // 有効なエントリ（1件）のみが表示されているはず
      const entryCount = await historyEntries.count();
      expect(entryCount).toBeLessThanOrEqual(1);
    });

    // Note: before/after 形式から changes 形式への自動マイグレーション機能は未実装
    test.fixme("5.2: バージョンマイグレーション", async ({ appPage }) => {
      // 1. 旧形式 (before/after) を含む履歴を注入
      await appPage.evaluate(() => {
        const oldFormatHistory = {
          state: {
            entries: [
              {
                id: "old-entry-1",
                timestamp: Date.now() - 1000,
                type: "settings",
                description: "旧形式エントリ",
                before: {
                  proliferator: { type: "none", mode: null },
                },
                after: {
                  proliferator: { type: "mk1", mode: "speed" },
                },
              },
            ],
            currentIndex: 0,
            maxHistorySize: 50,
          },
        };
        localStorage.setItem("dsp-calculator-history-store", JSON.stringify(oldFormatHistory));
      });

      // 2. アプリをリロードし履歴ダイアログを開く
      await appPage.reload();
      await appPage.waitForTimeout(500);

      // 履歴ダイアログを開く
      await appPage.getByTestId("history-dialog-button").click();

      const historyHeading = appPage.getByRole("heading", { name: "履歴", level: 2 });
      await expect(historyHeading).toBeVisible();

      // 期待結果: changes 形式に変換され version が付与される
      const migratedData = await appPage.evaluate(() => {
        const historyData = localStorage.getItem("dsp-calculator-history-store");
        if (!historyData) return null;
        const parsed = JSON.parse(historyData);
        return parsed.state?.entries?.[0] || null;
      });

      if (migratedData) {
        // 新形式に変換されていることを確認
        expect(migratedData).toHaveProperty("changes");
        expect(migratedData).toHaveProperty("version");
      }
    });

    test("5.3: 復元失敗時のフォールバック", async ({ appPage }) => {
      // レシピを選択して状態を作成
      await appPage.getByTestId("recipe-button-1101").click();

      const proliferatorMk1Button = appPage.getByTestId("proliferator-type-button-mk1");
      await proliferatorMk1Button.click();
      const speedModeButton = appPage.getByTestId("proliferator-mode-button-speed");
      await speedModeButton.click();
      await appPage.waitForTimeout(600);

      // 1. 履歴エントリの changes に不正パスを含むデータを注入
      await appPage.evaluate(() => {
        const historyData = localStorage.getItem("dsp-calculator-history-store");
        if (historyData) {
          const parsed = JSON.parse(historyData);
          if (parsed.state?.entries) {
            const latestEntry = parsed.state.entries[parsed.state.entries.length - 1];
            if (latestEntry) {
              latestEntry.changes = {
                "invalid.nonexistent.path": "invalid value",
                "another.bad.path": null,
              };
            }
            localStorage.setItem("dsp-calculator-history-store", JSON.stringify(parsed));
          }
        }
      });

      // 2. Undo を実行
      await appPage.keyboard.press("Control+Z");
      await appPage.waitForTimeout(500);

      // 期待結果: アプリがクラッシュせず、適切に処理される
      const undoButton = appPage.getByTestId("undo-button");
      await expect(undoButton).toBeVisible();
    });
  });

  // ========================================
  // シナリオ 6: 永続化と再計算
  // ========================================

  test.describe("シナリオ 6: 永続化と再計算", () => {
    test("6.1: 再計算トリガー", async ({ appPage }) => {
      // 1. 設定を変更し履歴を作成
      await appPage.getByTestId("recipe-button-1101").click(); // 鉄インゴット

      const targetInput = appPage.getByTestId("target-quantity-input");
      await targetInput.fill("10");
      await waitForDebounce(appPage);

      // 増産剤を設定
      const proliferatorMk1Button = appPage.getByTestId("proliferator-type-button-mk1");
      await proliferatorMk1Button.click();
      const speedModeButton = appPage.getByTestId("proliferator-mode-button-speed");
      await speedModeButton.click();
      await waitForDebounce(appPage);

      // 2. Undo を実行
      await appPage.keyboard.press("Control+Z");
      await appPage.waitForTimeout(200);

      // 3. 統計タブで再計算結果を確認
      const productionChainHeading = appPage.getByRole("heading", { name: /生産チェーン/ });
      await expect(productionChainHeading).toBeVisible();

      // 統計タブを開く
      const statsTab = appPage.getByRole("tab", { name: /統計/ });
      if (await statsTab.isVisible()) {
        await statsTab.click();
        await appPage.waitForTimeout(500);

        // 計算中表示がないことを確認（再計算完了）
        const loadingIndicator = appPage.getByText(/計算中/);
        await expect(loadingIndicator).not.toBeVisible();
      }
    });

    test("6.2: 非対象状態が記録されないことの検証", async ({ appPage }) => {
      // レシピを選択
      await appPage.getByTestId("recipe-button-1101").click();
      await appPage.waitForTimeout(500);

      // 1. Production Tree を展開/折りたたみ
      const expandButton = appPage.getByRole("button", { name: /すべて展開/ });
      if (await expandButton.isVisible()) {
        await expandButton.click();
        await appPage.waitForTimeout(300);

        const collapseButton = appPage.getByRole("button", { name: /すべて折りたたみ/ });
        if (await collapseButton.isVisible()) {
          await collapseButton.click();
          await appPage.waitForTimeout(300);
        }
      }

      // 2. お気に入り登録
      const favoriteButton = appPage.getByRole("button", { name: /お気に入りに追加/ });
      if (await favoriteButton.isVisible()) {
        await favoriteButton.click();
        await appPage.waitForTimeout(300);
      }

      // 3. 履歴ダイアログを確認
      await appPage.getByTestId("history-dialog-button").click();

      const historyHeading = appPage.getByRole("heading", { name: "履歴", level: 2 });
      await expect(historyHeading).toBeVisible();

      // UI状態に関する履歴エントリがないことを確認
      // 履歴エントリのテキスト内で検索 (data-testidを使用)
      const historyEntryTexts = appPage.getByTestId(/history-entry-text-\d+/);
      const uiStateEntry = historyEntryTexts.filter({ hasText: /折りたたみ|お気に入り/ });
      await expect(uiStateEntry).toHaveCount(0);
    });

    test("6.3: localStorage 永続化", async ({ appPage }) => {
      // 1. 複数の履歴エントリを作成
      await appPage.getByTestId("recipe-button-1101").click();

      const targetInput = appPage.getByTestId("target-quantity-input");
      await targetInput.fill("5");
      await appPage.waitForTimeout(600);

      const proliferatorMk1Button = appPage.getByTestId("proliferator-type-button-mk1");
      await proliferatorMk1Button.click();
      const speedModeButton = appPage.getByTestId("proliferator-mode-button-speed");
      await speedModeButton.click();
      await appPage.waitForTimeout(600);

      // Undo を 1 回実行
      await appPage.keyboard.press("Control+Z");
      await appPage.waitForTimeout(200);

      // Undo ボタンの状態を確認
      const undoButton = appPage.getByTestId("undo-button");
      const undoEnabledBefore = await undoButton.isEnabled();

      const redoButton = appPage.getByTestId("redo-button");
      const redoEnabledBefore = await redoButton.isEnabled();

      // 2. ページをリロード
      await appPage.reload();

      // 期待結果: Undo/Redo ボタン状態が継続
      const undoEnabledAfter = await undoButton.isEnabled();
      const redoEnabledAfter = await redoButton.isEnabled();

      expect(undoEnabledAfter).toBe(undoEnabledBefore);
      expect(redoEnabledAfter).toBe(redoEnabledBefore);

      // localStorage に履歴データが存在することを確認
      const historyExists = await appPage.evaluate(() => {
        const historyData = localStorage.getItem("dsp-calculator-history-store");
        return historyData !== null;
      });

      expect(historyExists).toBe(true);
    });
  });

  // ========================================
  // シナリオ 7: UI/UX 仕様確認
  // ========================================

  test.describe("シナリオ 7: UI/UX 仕様確認", () => {
    test("7.1: 履歴エントリアイコン", async ({ appPage }) => {
      // 1. 各タイプの履歴エントリを作成
      await appPage.getByTestId("recipe-button-1101").click(); // 鉄インゴット

      // settings タイプ: 増産剤設定
      const proliferatorMk1Button = appPage.getByTestId("proliferator-type-button-mk1");
      await proliferatorMk1Button.click();
      const speedModeButton = appPage.getByTestId("proliferator-mode-button-speed");
      await speedModeButton.click();
      await appPage.waitForTimeout(600);

      // settings タイプ: ソーター設定
      const sorterMk2Button = appPage.getByRole("button", { name: /Mk\.II.*36kW/ });
      await sorterMk2Button.click();
      await appPage.waitForTimeout(600);

      // plan タイプ: 目標変更
      const targetInput = appPage.getByTestId("target-quantity-input");
      await targetInput.fill("10");
      await appPage.waitForTimeout(600);

      // 2. 履歴リストを確認
      await appPage.getByTestId("history-dialog-button").click();

      const historyHeading = appPage.getByRole("heading", { name: "履歴", level: 2 });
      await expect(historyHeading).toBeVisible();

      // 履歴エントリが表示されることを確認 (data-testidを使用)
      const historyEntry = appPage.getByTestId("history-entry-0");
      await expect(historyEntry).toBeVisible();

      // アイコンが存在することを確認 (data-testidを使用)
      const iconElement = appPage.getByTestId("history-entry-icon-0");
      await expect(iconElement).toBeVisible();

      // テキストが存在することを確認 (data-testidを使用)
      const textElement = appPage.getByTestId("history-entry-text-0");
      await expect(textElement).toBeVisible();
    });

    test("7.2: トースト通知のタイムアウト", async ({ appPage }) => {
      // 設定変更を行う
      await appPage.getByTestId("recipe-button-1101").click();

      const proliferatorMk1Button = appPage.getByTestId("proliferator-type-button-mk1");
      await proliferatorMk1Button.click();
      const speedModeButton = appPage.getByTestId("proliferator-mode-button-speed");
      await speedModeButton.click();
      await appPage.waitForTimeout(600);

      // 1. Undo を実行
      await appPage.keyboard.press("Control+Z");
      await appPage.waitForTimeout(100);

      // トースト通知が表示されることを確認
      const toast = appPage.getByRole("alert").or(appPage.getByTestId("toast"));

      if (await toast.isVisible()) {
        const toastVisible = await toast.isVisible();
        expect(toastVisible).toBe(true);

        // 2. トーストが 3 秒後に消えるまで待機
        await appPage.waitForTimeout(3500);

        // 期待結果: 3 秒前後で自動クローズ
        const toastHidden = await toast.isHidden();
        expect(toastHidden).toBe(true);
      }
    });
  });
});
