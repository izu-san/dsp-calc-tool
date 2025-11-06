// spec: docs/ACCESSIBILITY_I18N_SPEC.md
import { expect } from "@playwright/test";
import { test } from "./fixtures";

test.describe("14: アクセシビリティ & 多言語対応", () => {
  test("14-01: キーボードショートカットで言語切り替え", async ({ appPage }) => {
    // 初期状態で日本語が選択されていることを確認
    const languageTrigger = appPage.getByTestId("language-menu-trigger");
    await expect(languageTrigger).toBeVisible();
    await expect(languageTrigger).toContainText("🇯🇵");

    // Ctrl+Lを押下
    await appPage.keyboard.press("Control+l");

    // 言語が切り替わるのを待つ (データ読み込みがあるため)
    await appPage.waitForTimeout(1000);

    // 英語に切り替わったことを確認
    await expect(languageTrigger).toContainText("🇺🇸", { timeout: 10000 });

    // 再度Ctrl+Lを押下して日本語に戻る
    await appPage.keyboard.press("Control+l");

    // 言語が切り替わるのを待つ
    await appPage.waitForTimeout(1000);

    await expect(languageTrigger).toContainText("🇯🇵", { timeout: 10000 });
  });

  test("14-02: Escキーでモーダルを閉じる", async ({ appPage }) => {
    // NOTE: このテストは12-02のテストと重複していますが、
    // アクセシビリティ機能の統合テストとして残しています。
    // 詳細なテストは12-help-modal.spec.tsの12-02を参照してください。

    // HelpModalを開く
    await appPage.getByTestId("help-menu-trigger").click();
    await expect(appPage.getByTestId("help-modal")).toBeVisible();

    // Escキーを押下
    await appPage.keyboard.press("Escape");

    // モーダルが閉じたことを確認
    await expect(appPage.getByTestId("help-modal")).not.toBeVisible();
  });

  test("14-03: F1キーでHelpModalを開く", async ({ appPage }) => {
    // 初期状態でモーダルが閉じていることを確認
    await expect(appPage.getByTestId("help-modal")).not.toBeVisible();

    // F1キーを押下
    await appPage.keyboard.press("F1");

    // HelpModalが開いたことを確認
    await expect(appPage.getByTestId("help-modal")).toBeVisible();

    // 再度F1キーを押下して閉じる
    await appPage.keyboard.press("F1");
    await expect(appPage.getByTestId("help-modal")).not.toBeVisible();
  });

  test("14-04: Ctrl+?でHelpModalを開く", async ({ appPage }) => {
    // 初期状態でモーダルが閉じていることを確認
    await expect(appPage.getByTestId("help-modal")).not.toBeVisible();

    // Ctrl+?を押下
    await appPage.keyboard.press("Control+?");

    // HelpModalが開いたことを確認
    await expect(appPage.getByTestId("help-modal")).toBeVisible();
  });

  test("14-05: HelpModalにキーボードショートカットタブが表示される", async ({ appPage }) => {
    // HelpModalを開く
    await appPage.getByTestId("help-menu-trigger").click();
    await expect(appPage.getByTestId("help-modal")).toBeVisible();

    // キーボードショートカットタブをクリック
    const shortcutsTab = appPage.getByRole("tab", { name: "キーボードショートカット" });
    await shortcutsTab.click();

    // ショートカット一覧が表示されることを確認
    await expect(appPage.getByTestId("help-tab-keyboard-shortcuts")).toBeVisible();
    const shortcutsContent = appPage.getByTestId("help-tab-keyboard-shortcuts");
    await expect(shortcutsContent.getByText("元に戻す")).toBeVisible();
    await expect(shortcutsContent.getByText("やり直し")).toBeVisible();
    await expect(shortcutsContent.getByText("言語を切り替える")).toBeVisible();
  });

  test("14-06: HelpModalのサポートタブにアクセシビリティ情報が表示される", async ({ appPage }) => {
    // HelpModalを開く
    await appPage.getByTestId("help-menu-trigger").click();
    await expect(appPage.getByTestId("help-modal")).toBeVisible();

    // サポートタブをクリック
    const supportTab = appPage.getByRole("tab", { name: "サポート" });
    await supportTab.click();

    // アクセシビリティ方針が表示されることを確認
    await expect(appPage.getByTestId("help-tab-support")).toBeVisible();
    await expect(appPage.getByText("アクセシビリティ方針")).toBeVisible();
    await expect(appPage.getByText("キーボード操作")).toBeVisible();
    await expect(appPage.getByText("スクリーンリーダー対応")).toBeVisible();
  });

  test("14-07: WelcomeModalの多言語対応", async ({ freshPage }) => {
    // freshPage fixtureを使用してWelcomeModalを表示
    // WelcomeModalが表示されることを確認
    await expect(freshPage.getByTestId("welcome-modal")).toBeVisible();
    await expect(freshPage.getByTestId("welcome-language-switch")).toBeVisible();

    // 初期状態で日本語が選択されていることを確認
    const languageSwitch = freshPage.getByTestId("welcome-language-switch");
    await expect(languageSwitch).toContainText("🇯🇵");

    // WelcomeModal内の言語切替ボタンをクリック
    await languageSwitch.click();

    // 英語で表示されることを確認
    await expect(languageSwitch).toContainText("🇺🇸");

    // 再度クリックして日本語に戻る
    await languageSwitch.click();
    await expect(languageSwitch).toContainText("🇯🇵");
  });

  test("14-08: WelcomeModalのEscキーで閉じる", async ({ freshPage }) => {
    // freshPage fixtureを使用してWelcomeModalを表示
    // WelcomeModalが表示されることを確認
    await expect(freshPage.getByTestId("welcome-modal")).toBeVisible();

    // Escキーを押下
    await freshPage.keyboard.press("Escape");

    // WelcomeModalが閉じたことを確認
    await expect(freshPage.getByTestId("welcome-modal")).not.toBeVisible();
  });

  test("14-09: 入力フィールドでのキーボードショートカット無効化", async ({ appPage }) => {
    // レシピ選択フィールドを取得
    const searchInput = appPage.getByPlaceholder(/検索/);
    if (await searchInput.isVisible()) {
      await searchInput.click();
      await searchInput.fill("test");

      // 入力フィールドにフォーカスがある状態でCtrl+Lを押下
      await appPage.keyboard.press("Control+L");

      // 言語が切り替わらないことを確認（入力フィールドでは無効化されている）
      // このテストは、言語が切り替わらないことを確認するため、少し待機してから確認
      await appPage.waitForTimeout(100);
      const languageTrigger = appPage.getByTestId("language-menu-trigger");
      // フォーカスを外してから確認
      await appPage.keyboard.press("Escape");
      await expect(languageTrigger).toContainText("🇯🇵");
    }
  });

  test("14-10: 履歴ダイアログのEscキーで閉じる", async ({ appPage }) => {
    // 履歴ボタンをクリック
    const historyButton = appPage.getByTestId("history-dialog-button");
    await historyButton.click();

    // 履歴ダイアログが表示されることを確認
    await expect(appPage.getByTestId("history-dialog-title")).toBeVisible();

    // Escキーを押下
    await appPage.keyboard.press("Escape");

    // 履歴ダイアログが閉じたことを確認
    await expect(appPage.getByTestId("history-dialog-title")).not.toBeVisible();
  });

  test("14-11: PlanManagerの保存ダイアログのEscキーで閉じる", async ({ appPage }) => {
    // レシピを選択（保存ボタンを有効にするため）
    await appPage.getByTestId("recipe-button-1101").click();

    // Plan Managerメニューを開く
    const menuTrigger = appPage.getByTestId("plan-manager-menu-trigger");
    await expect(menuTrigger).toBeEnabled();
    await menuTrigger.click();

    // 保存メニュー項目をクリック
    const saveMenuItem = appPage.getByTestId("plan-menu-save");
    await saveMenuItem.click();

    // 保存ダイアログが表示されることを確認
    await expect(appPage.getByRole("heading", { name: "💾 保存" })).toBeVisible();

    // Escキーを押下
    await appPage.keyboard.press("Escape");

    // 保存ダイアログが閉じたことを確認
    await expect(appPage.getByRole("heading", { name: "💾 保存" })).not.toBeVisible();
  });

  test("14-12: PlanManagerの読み込みダイアログのEscキーで閉じる", async ({ appPage }) => {
    // レシピを選択（メニューを有効にするため）
    await appPage.getByTestId("recipe-button-1101").click();

    // Plan Managerメニューを開く
    const menuTrigger = appPage.getByTestId("plan-manager-menu-trigger");

    await expect(menuTrigger).toBeEnabled();
    await menuTrigger.click();

    // 読み込みメニュー項目をクリック
    const loadMenuItem = appPage.getByTestId("plan-menu-load");
    await loadMenuItem.click();

    // 読み込みダイアログが表示されることを確認
    await expect(appPage.getByRole("heading", { name: "📂 読み込み" })).toBeVisible();

    // Escキーを押下
    await appPage.keyboard.press("Escape");

    // 読み込みダイアログが閉じたことを確認
    await expect(appPage.getByRole("heading", { name: "📂 読み込み" })).not.toBeVisible();
  });

  test("14-13: PlanManagerの共有ダイアログのEscキーで閉じる", async ({ appPage }) => {
    // レシピを選択（共有ボタンを有効にするため）
    await appPage.getByTestId("recipe-button-1101").click();

    // Plan Managerメニューを開く
    const menuTrigger = appPage.getByTestId("plan-manager-menu-trigger");
    await expect(menuTrigger).toBeEnabled();
    await menuTrigger.click();

    // 共有メニュー項目をクリック
    const shareMenuItem = appPage.getByTestId("plan-menu-share-url");
    await shareMenuItem.click();

    // 共有ダイアログが表示されることを確認
    await expect(appPage.getByTestId("share-url-input")).toBeVisible();

    // Escキーを押下
    await appPage.keyboard.press("Escape");

    // 共有ダイアログが閉じたことを確認
    await expect(appPage.getByTestId("share-url-input")).not.toBeVisible();
  });
});
