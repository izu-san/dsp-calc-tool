// spec: docs/testing/CUSTOM_TEMPLATE_E2E_TEST_PLAN.md
// seed: tests/e2e/seed.spec.ts

import { expect } from "@playwright/test";
import { test } from "./fixtures";
import {
  confirmApplyTemplate,
  confirmDeleteTemplate,
  createTemplate,
  getAllTemplateCards,
  getFirstTemplateApplyButton,
  getFirstTemplateCard,
  getFirstTemplateDeleteButton,
  getFirstTemplateEditButton,
} from "./helpers/template-helpers";

test.describe("カスタムテンプレート機能", () => {
  test.beforeEach(async ({ clearLocalStorage, reloadPage }) => {
    // LocalStorageをクリアして初期状態に
    await clearLocalStorage();
    await reloadPage();
  });

  test.describe("1. テンプレート作成機能", () => {
    test("1.1 新規テンプレート作成（正常系）", async ({ appPage }) => {
      // 1. カスタムテンプレートセクションを表示
      await expect(appPage.getByRole("button", { name: "＋ テンプレート作成" })).toBeVisible();
      await expect(
        appPage.getByText("現在の設定をテンプレート化して素早く切り替えられます")
      ).toBeVisible();

      // 2. 「＋ テンプレート作成」ボタンをクリック
      await appPage.getByTestId("create-custom-template-button").click();

      // 3. テンプレート作成モーダルが表示されることを確認
      await expect(appPage.getByTestId("create-template-modal")).toBeVisible();

      // 4. テンプレート名「省電力モード」、メモ「電力消費を最小化する設定」を入力
      await appPage.getByTestId("template-name-input").fill("省電力モード");
      await appPage.getByTestId("template-note-input").fill("電力消費を最小化する設定");

      // 5. 現在の設定プレビューが表示されることを確認
      await expect(appPage.getByTestId("template-settings-preview")).toBeVisible();

      // 6. 「保存」ボタンをクリック
      await appPage.getByTestId("create-template-save-button").click();

      // 7. モーダルが閉じることを確認
      await expect(appPage.getByTestId("create-template-modal")).not.toBeVisible();

      // 8. カスタムテンプレートセクションに「省電力モード」が表示されることを確認
      await expect(appPage.getByText("省電力モード")).toBeVisible();
      await expect(appPage.getByText("電力消費を最小化する設定")).toBeVisible();
    });

    // NOTE: input要素にmaxLength=40が設定されているため、41文字以上は物理的に入力できません。
    // そのため、バリデーションエラーのE2Eテストは実施できません。
    // 代わりに、maxLength属性によって40文字までしか入力できないことを確認します。
    test("1.2 テンプレート名の最大長制限（maxLength属性）", async ({ appPage }) => {
      // 1. テンプレート作成モーダルを開く
      await appPage.getByTestId("create-custom-template-button").click();

      // 2. テンプレート名に41文字の文字列を入力試行
      const longName = "あ".repeat(41); // 41文字
      await appPage.getByTestId("template-name-input").fill(longName);

      // 3. input要素のmaxLength属性により、実際には40文字までしか入力されないことを確認
      const inputValue = await appPage.getByTestId("template-name-input").inputValue();
      expect(inputValue.length).toBe(40); // 40文字に制限される
      expect(inputValue).toBe("あ".repeat(40));

      // 4. 「保存」ボタンをクリック
      await appPage.getByTestId("create-template-save-button").click();

      // 5. エラーなく保存されることを確認（40文字は有効な長さ）
      await expect(appPage.getByTestId("create-template-modal")).not.toBeVisible();

      // 6. テンプレート名が40文字で作成されていることを確認
      await expect(appPage.getByText("あ".repeat(40))).toBeVisible();
    });
    test("1.3 メモの文字数制限", async ({ appPage }) => {
      // 1. 「＋ テンプレート作成」ボタンをクリック
      await appPage.getByTestId("create-custom-template-button").click();

      // 2. テンプレート名に「テストテンプレート」と入力
      await appPage.getByTestId("template-name-input").fill("テストテンプレート");

      // 3. メモフィールドに120文字のテキストを入力
      const memoText = "あ".repeat(120);
      await appPage.getByTestId("template-note-input").fill(memoText);

      // 4. 文字数カウンターが「120/120 文字」と表示されることを確認
      await expect(appPage.getByText("120/120 文字")).toBeVisible();

      // 5. 「保存」ボタンをクリック
      await appPage.getByTestId("create-template-save-button").click();

      // 6. テンプレートが正常に作成されることを確認
      await expect(appPage.getByText("テストテンプレート")).toBeVisible();
    });

    test("1.4 同名テンプレートの上書き確認", async ({ appPage }) => {
      // 1. テンプレート「高速モード」を作成（増産剤: なし、コンベアベルト: Mk.3）
      await createTemplate(appPage, "高速モード", undefined, false);
      await expect(getFirstTemplateCard(appPage).getByText("高速モード")).toBeVisible();

      // 2. 設定パネルで増産剤を「増産剤 Mk.III」に変更
      await appPage.getByTestId("proliferator-type-button-mk3").click();

      // 3. 再度「＋ テンプレート作成」ボタンをクリック
      await appPage.getByTestId("create-custom-template-button").click();

      // 4. テンプレート名に「高速モード」（既存と同じ名前）を入力
      await appPage.getByTestId("template-name-input").fill("高速モード");

      // 5. 「保存」ボタンをクリック
      await appPage.getByTestId("create-template-save-button").click();

      // 6. 上書き確認モーダルが表示されることを確認
      await expect(
        appPage.getByText("同名のテンプレートが既に存在します。上書きしますか？")
      ).toBeVisible();

      // 7. 「上書き」ボタンをクリック
      await appPage.getByRole("button", { name: "上書き" }).click();

      // 8. テンプレート一覧で「高速モード」が1件のみ存在することを確認
      await expect(getAllTemplateCards(appPage)).toHaveCount(1);
    });
  });

  test.describe("2. テンプレート一覧表示", () => {
    test("2.1 デフォルトテンプレートとカスタムテンプレートの区別表示", async ({ appPage }) => {
      // 1. デフォルトテンプレート（序盤、中盤、後半、終盤、省電力）が表示されることを確認
      await expect(appPage.getByRole("button", { name: "🌱序盤" })).toBeVisible();
      await expect(appPage.getByRole("button", { name: "⚙️中盤" })).toBeVisible();
      await expect(appPage.getByRole("button", { name: "🚀後半" })).toBeVisible();
      await expect(appPage.getByRole("button", { name: "⭐終盤" })).toBeVisible();
      await expect(appPage.getByRole("button", { name: "💡省電力" })).toBeVisible();

      // 2. カスタムテンプレートセクションが独立して表示されることを確認
      await expect(appPage.getByTestId("custom-template-section")).toBeVisible();

      // 3. 空状態メッセージが表示されることを確認
      await expect(appPage.getByTestId("custom-template-empty-state")).toBeVisible();
      await expect(
        appPage.getByText("現在の設定をテンプレート化して素早く切り替えられます")
      ).toBeVisible();
    });

    test("2.2 カスタムテンプレートカードの表示", async ({ appPage }) => {
      // 1. カスタムテンプレート「省電力モード」（メモ付き）を作成
      await createTemplate(appPage, "省電力モード", "電力消費を最小化");

      // 2. カスタムテンプレート「高速モード」（メモなし）を作成
      await createTemplate(appPage, "高速モード");

      // 3. 各テンプレートカードにテンプレート名が表示されることを確認
      await expect(appPage.getByText("省電力モード")).toBeVisible();
      await expect(appPage.getByText("高速モード")).toBeVisible();

      // 4. メモが設定されている場合のみメモが表示されることを確認
      await expect(appPage.getByText("電力消費を最小化")).toBeVisible();

      // 5. 各カードに「適用」ボタンとメニューボタン（編集・削除）が表示されることを確認
      await expect(getAllTemplateCards(appPage)).toHaveCount(2);
    });
  });

  test.describe("3. テンプレート適用機能", () => {
    test("3.1 カスタムテンプレートの適用", async ({ appPage }) => {
      // 1. カスタムテンプレート「省電力モード」を作成（増産剤: なし）
      await createTemplate(appPage, "省電力モード");

      // 2. 設定パネルで増産剤を「増産剤 Mk.III」に変更
      await appPage.getByTestId("proliferator-type-button-mk3").click();

      // 3. カスタムテンプレート「省電力モード」の「適用」ボタンをクリック
      await getFirstTemplateApplyButton(appPage).click();

      // 4. 適用確認モーダルが表示されることを確認
      await expect(
        appPage.getByRole("heading", { name: /省電力モード を適用しますか？/ })
      ).toBeVisible();

      // 5. 設定プレビューが表示されることを確認
      await expect(appPage.getByText("コンベアベルト:")).toBeVisible();

      // 6. 「適用」ボタンをクリック
      await confirmApplyTemplate(appPage);

      // 7. 設定が反映されることを確認（増産剤が「なし」に戻る）
      await expect(appPage.getByRole("button", { name: "なし" })).toBeVisible();
    });

    test("3.2 デフォルトテンプレートの適用", async ({ appPage }) => {
      // 1. 設定パネルで増産剤を「増産剤 Mk.III」に変更
      await appPage.getByTestId("proliferator-type-button-mk3").click();

      // 2. デフォルトテンプレート「💡省電力」ボタンをクリック
      await appPage.getByTestId("template-button-powerSaver").click();

      // 3. 適用確認モーダルが表示されることを確認
      await expect(appPage.getByRole("heading", { name: /省電力 を適用しますか？/ })).toBeVisible();

      // 4. 「適用」ボタンをクリック
      await appPage.getByRole("button", { name: "適用" }).click();

      // 5. 設定が反映されることを確認
      await expect(appPage.getByRole("button", { name: "なし" })).toBeVisible();
    });

    test("3.3 テンプレート適用のキャンセル", async ({ appPage }) => {
      // 1. カスタムテンプレート「省電力モード」を作成
      await createTemplate(appPage, "省電力モード");

      // 2. 設定パネルで増産剤を「増産剤 Mk.III」に変更
      await appPage.getByTestId("proliferator-type-button-mk3").click();

      // 3. 「適用」ボタンをクリック
      await getFirstTemplateApplyButton(appPage).click();

      // 4. 確認モーダルで「キャンセル」ボタンをクリック
      await appPage.getByTestId("custom-template-confirm-cancel-button").click();

      // 5. 設定が変更されていないことを確認（増産剤が「増産剤 Mk.III」のまま）
      await expect(appPage.getByTestId("proliferator-type-button-mk3")).toBeVisible();
    });
  });

  test.describe("4. テンプレート編集機能", () => {
    test("4.1 テンプレート名とメモの編集", async ({ appPage }) => {
      // 1. カスタムテンプレート「省電力モード」を作成（メモ付き）
      await createTemplate(appPage, "省電力モード", "電力を抑える");

      // 2. 編集メニューを開く
      await getFirstTemplateEditButton(appPage).click();

      // 3. 編集モーダルが表示されることを確認
      await expect(appPage.getByTestId("edit-template-modal")).toBeVisible();

      // 4. テンプレート名を「エコモード」に変更
      await appPage.getByTestId("edit-template-name-input").clear();
      await appPage.getByTestId("edit-template-name-input").fill("エコモード");

      // 5. メモを「電力消費を最小化する最適設定」に変更
      await appPage.getByTestId("edit-template-note-input").clear();
      await appPage.getByTestId("edit-template-note-input").fill("電力消費を最小化する最適設定");

      // 6. 「保存」ボタンをクリック
      await appPage.getByTestId("edit-template-save-button").click();

      // 7. モーダルが閉じることを確認
      await expect(appPage.getByTestId("edit-template-modal")).not.toBeVisible();

      // 8. テンプレートカードの名称とメモが更新されていることを確認
      await expect(appPage.getByText("エコモード")).toBeVisible();
      await expect(appPage.getByText("電力消費を最小化する最適設定")).toBeVisible();
    });

    test("4.2 現在の設定で上書き", async ({ appPage }) => {
      // 1. カスタムテンプレート「高速モード」を作成（増産剤: なし、コンベアベルト: Mk.III）
      await createTemplate(appPage, "高速モード");

      // 2. 設定パネルで増産剤を「増産剤 Mk.III」に変更
      await appPage.getByTestId("proliferator-type-button-mk3").click();

      // 3. 編集モーダルを開く
      await getFirstTemplateEditButton(appPage).click();

      // 4. 「現在の設定で上書き」ボタンをクリック（保存ボタンは不要）
      await appPage.getByTestId("overwrite-with-current-button").click();

      // 5. モーダルが閉じることを確認
      await expect(appPage.getByTestId("edit-template-modal")).not.toBeVisible();

      // 6. テンプレート「高速モード」を適用
      await getFirstTemplateApplyButton(appPage).click();
      await confirmApplyTemplate(appPage);

      // 7. 設定が正しく反映されることを確認（増産剤: 増産剤 Mk.III）
      await expect(appPage.getByTestId("proliferator-type-button-mk3")).toBeVisible();
    });

    test("4.3 編集時の名称重複チェック", async ({ appPage }) => {
      // 1. カスタムテンプレート「モードA」を作成
      await createTemplate(appPage, "モードA");

      // 2. カスタムテンプレート「モードB」を作成
      await createTemplate(appPage, "モードB");

      // 3. テンプレート「モードA」の編集モーダルを開く
      const editButtons = appPage.locator('[data-testid^="edit-custom-template-"]');
      await editButtons.last().click(); // モードAは最初に作成したので last() を使用

      // 4. テンプレート名を「モードB」（既存の別テンプレート名）に変更
      await appPage.getByTestId("edit-template-name-input").clear();
      await appPage.getByTestId("edit-template-name-input").fill("モードB");

      // 5. 「保存」ボタンをクリック
      await appPage.getByTestId("edit-template-save-button").click();

      // 6. バリデーションエラーが表示されることを確認
      await expect(appPage.getByText("同名のテンプレートが既に存在します")).toBeVisible();

      // 7. キャンセル
      await appPage.getByTestId("edit-template-cancel-button").click();
    });
  });

  test.describe("5. テンプレート削除機能", () => {
    test("5.1 テンプレートの削除", async ({ appPage }) => {
      // 1. カスタムテンプレート「削除テスト」を作成
      await createTemplate(appPage, "削除テスト");

      // 2. 削除メニューを開く
      await getFirstTemplateDeleteButton(appPage).click();

      // 3. 削除確認モーダルが表示されることを確認
      await expect(appPage.getByTestId("delete-template-modal")).toBeVisible();

      // 4. モーダルに削除対象のテンプレート名が表示されることを確認
      await expect(appPage.getByText(/このプランを削除しますか？: 削除テスト/)).toBeVisible();

      // 5. 「削除」ボタンをクリック
      await appPage.getByTestId("delete-template-confirm-button").click();

      // 6. モーダルが閉じることを確認
      await expect(appPage.getByTestId("delete-template-modal")).not.toBeVisible();

      // 7. テンプレートカードが一覧から消えることを確認
      await expect(appPage.getByText("削除テスト")).not.toBeVisible();

      // 8. 空状態メッセージが表示されることを確認
      await expect(appPage.getByTestId("custom-template-empty-state")).toBeVisible();
    });

    test("5.2 削除のキャンセル", async ({ appPage }) => {
      // 1. カスタムテンプレート「キャンセルテスト」を作成
      await createTemplate(appPage, "キャンセルテスト");

      // 2. 削除メニューを開く
      await getFirstTemplateDeleteButton(appPage).click();

      // 3. 削除確認モーダルで「キャンセル」ボタンをクリック
      await appPage.getByTestId("delete-template-cancel-button").click();

      // 4. モーダルが閉じることを確認
      await expect(appPage.getByTestId("delete-template-modal")).not.toBeVisible();

      // 5. テンプレートが削除されずに残っていることを確認
      await expect(appPage.getByText("キャンセルテスト")).toBeVisible();
    });

    test("5.3 適用中テンプレートの削除", async ({ appPage }) => {
      // 1. カスタムテンプレート「適用中モード」を作成（増産剤: 増産剤 Mk.III）
      await appPage.getByTestId("proliferator-type-button-mk3").click();
      await createTemplate(appPage, "適用中モード");

      // 2. テンプレート「適用中モード」を適用
      await getFirstTemplateApplyButton(appPage).click();
      await appPage.getByTestId("custom-template-confirm-apply-button").click();

      // 3. 設定パネルで増産剤が「増産剤 Mk.III」になっていることを確認
      await expect(appPage.getByTestId("proliferator-type-button-mk3")).toBeVisible();

      // 4. テンプレートを削除
      await getFirstTemplateDeleteButton(appPage).click();
      await confirmDeleteTemplate(appPage);

      // 5. テンプレートが削除されることを確認
      await expect(appPage.getByText("適用中モード")).not.toBeVisible();

      // 6. 設定パネルの設定値は変わらないことを確認（増産剤: 増産剤 Mk.III のまま）
      await expect(appPage.getByTestId("proliferator-type-button-mk3")).toBeVisible();
    });
  });

  test.describe("6. 履歴連携機能", () => {
    test("6.1 テンプレート作成の履歴記録", async ({ appPage }) => {
      // 1. カスタムテンプレート「履歴テスト1」を作成
      await createTemplate(appPage, "履歴テスト1");

      // 2. ヘッダーの「📜 履歴」ボタンをクリック
      await appPage.getByTestId("history-dialog-button").click();

      // 3. 履歴パネルが開くことを確認
      await expect(appPage.getByRole("heading", { name: "履歴" })).toBeVisible();

      // 4. 最新の履歴エントリにテンプレート作成が記録されていることを確認
      await expect(appPage.getByTestId("history-entry-text-0")).toContainText("履歴テスト1");
    });

    test("6.2 履歴の Undo/Redo（テンプレート作成）", async ({ appPage }) => {
      // 1. 初期状態でカスタムテンプレートが0件であることを確認
      await expect(appPage.getByTestId("custom-template-empty-state")).toBeVisible();

      // 2. カスタムテンプレート「Undo/Redoテスト」を作成
      await createTemplate(appPage, "Undo/Redoテスト");

      // 3. カスタムテンプレートが1件表示されることを確認
      await expect(getAllTemplateCards(appPage)).toHaveCount(1);

      // 4. ヘッダーの「↶ 元に戻す」ボタンをクリック
      await appPage.getByTestId("undo-button").click();

      // 5. カスタムテンプレートが0件に戻ることを確認（テンプレートが消える）
      await expect(getAllTemplateCards(appPage)).toHaveCount(0);

      // 6. 空状態メッセージが表示されることを確認
      await expect(appPage.getByTestId("custom-template-empty-state")).toBeVisible();

      // 7. 「↷ やり直し」ボタンをクリック
      await appPage.getByTestId("redo-button").click();

      // 8. カスタムテンプレート「Undo/Redoテスト」が再び表示されることを確認
      await expect(getAllTemplateCards(appPage)).toHaveCount(1);
      await expect(getFirstTemplateCard(appPage).getByText("Undo/Redoテスト")).toBeVisible();
    });

    test("6.3 履歴の Undo/Redo（テンプレート編集）", async ({ appPage }) => {
      // 1. カスタムテンプレート「編集前」を作成（メモ: 「初期メモ」）
      await createTemplate(appPage, "編集前", "初期メモ");

      // 2. テンプレートを編集（名称: 「編集後」、メモ: 「更新メモ」）
      await getFirstTemplateEditButton(appPage).click();
      await appPage.getByTestId("edit-template-name-input").clear();
      await appPage.getByTestId("edit-template-name-input").fill("編集後");
      await appPage.getByTestId("edit-template-note-input").clear();
      await appPage.getByTestId("edit-template-note-input").fill("更新メモ");
      await appPage.getByTestId("edit-template-save-button").click();

      // 3. テンプレート名とメモが更新されていることを確認
      const templateCard = getFirstTemplateCard(appPage);
      await expect(templateCard.getByText("編集後")).toBeVisible();
      await expect(templateCard.getByText("更新メモ")).toBeVisible();

      // 4. 「↶ 元に戻す」ボタンをクリック
      await appPage.getByTestId("undo-button").click();

      // 5. テンプレート名が「編集前」、メモが「初期メモ」に戻ることを確認
      await expect(templateCard.getByText("編集前")).toBeVisible();
      await expect(templateCard.getByText("初期メモ")).toBeVisible();

      // 6. 「↷ やり直し」ボタンをクリック
      await appPage.getByTestId("redo-button").click();

      // 7. テンプレート名が「編集後」、メモが「更新メモ」に戻ることを確認
      await expect(templateCard.getByText("編集後")).toBeVisible();
      await expect(templateCard.getByText("更新メモ")).toBeVisible();
    });

    test("6.4 履歴の Undo/Redo（テンプレート削除）", async ({ appPage }) => {
      // 1. カスタムテンプレート「削除Undoテスト」を作成
      await createTemplate(appPage, "削除Undoテスト");

      // 2. テンプレートを削除
      await getFirstTemplateDeleteButton(appPage).click();
      await confirmDeleteTemplate(appPage);

      // 3. テンプレートが一覧から消えることを確認
      await expect(getAllTemplateCards(appPage)).toHaveCount(0);

      // 4. 「↶ 元に戻す」ボタンをクリック
      await appPage.getByTestId("undo-button").click();

      // 5. テンプレート「削除Undoテスト」が復元されることを確認
      await expect(getAllTemplateCards(appPage)).toHaveCount(1);
      await expect(getFirstTemplateCard(appPage).getByText("削除Undoテスト")).toBeVisible();

      // 6. 「↷ やり直し」ボタンをクリック
      await appPage.getByTestId("redo-button").click();

      // 7. テンプレートが再び削除されることを確認
      await expect(getAllTemplateCards(appPage)).toHaveCount(0);
    });
  });

  test.describe("7. データ永続化機能", () => {
    test("7.1 LocalStorageへの保存とページリロード後の復元", async ({ appPage }) => {
      // 1. カスタムテンプレート「永続化テスト1」を作成（メモ: 「リロードテスト」）
      await createTemplate(appPage, "永続化テスト1", "リロードテスト");

      // 2. カスタムテンプレート「永続化テスト2」を作成
      await createTemplate(appPage, "永続化テスト2");

      // 3. テンプレート「永続化テスト1」を適用
      const applyButtons = appPage.locator('[data-testid^="custom-template-apply-button-"]');
      // NOTE: 意図的に.first()を使用 - 複数テンプレートから最初のものを選択
      await applyButtons.first().click();
      await appPage.getByTestId("custom-template-confirm-apply-button").click();

      // 4. ページをリロード（F5またはブラウザの更新ボタン）
      await appPage.reload();

      // 5. カスタムテンプレートセクションに2件のテンプレートが表示されることを確認
      await expect(getAllTemplateCards(appPage)).toHaveCount(2);

      // 6. テンプレート名とメモが正しく表示されることを確認
      await expect(appPage.getByText("永続化テスト1")).toBeVisible();
      await expect(appPage.getByText("リロードテスト")).toBeVisible();
      await expect(appPage.getByText("永続化テスト2")).toBeVisible();
    });
  });

  test.describe("8. エッジケースとエラーハンドリング", () => {
    test("8.2 特殊文字を含むテンプレート名", async ({ appPage }) => {
      // 1. テンプレート名に「<script>alert('XSS')</script>」を入力して作成
      await appPage.getByTestId("create-custom-template-button").click();
      await appPage.getByTestId("template-name-input").fill("<script>alert('XSS')</script>");
      await appPage.getByTestId("create-template-save-button").click();

      // 2. スクリプトタグが文字列として表示されることを確認（実行されない）
      await expect(appPage.getByText("<script>alert('XSS')</script>")).toBeVisible();

      // 3. テンプレート名に絵文字「🚀🎮⭐」を入力して作成
      await appPage.getByTestId("create-custom-template-button").click();
      await appPage.getByTestId("template-name-input").fill("🚀🎮⭐");
      await appPage.getByTestId("create-template-save-button").click();

      // 4. 絵文字が正しく表示されることを確認
      await expect(appPage.getByText("🚀🎮⭐")).toBeVisible();
    });

    test("8.3 前後空白を含むテンプレート名", async ({ appPage }) => {
      // 1. テンプレート名に「  前後空白テスト  」を入力
      await appPage.getByTestId("create-custom-template-button").click();
      await appPage.getByTestId("template-name-input").fill("  前後空白テスト  ");

      // 2. 「保存」ボタンをクリック
      await appPage.getByTestId("create-template-save-button").click();

      // 3. バリデーションエラーが表示されることを確認（空白は自動削除されない）
      await expect(appPage.getByTestId("template-name-error")).toBeVisible();

      // 4. キャンセル
      await appPage.getByTestId("create-template-cancel-button").click();
    });

    test("8.4 備考の最大長制限（maxLength属性）", async ({ appPage }) => {
      // 1. テンプレート作成モーダルを開く
      await appPage.getByTestId("create-custom-template-button").click();

      // 2. テンプレート名を入力
      await appPage.getByTestId("template-name-input").fill("備考長さテスト");

      // 3. 121文字の備考を入力しようとする
      const longNote = "あ".repeat(121); // 121文字
      await appPage.getByTestId("template-note-input").fill(longNote);

      // 4. HTML maxLength=120により120文字に制限されることを確認
      const inputValue = await appPage.getByTestId("template-note-input").inputValue();
      expect(inputValue.length).toBe(120);
      expect(inputValue).toBe("あ".repeat(120));

      // 5. 120文字は有効なのでエラーなく保存される
      await appPage.getByTestId("create-template-save-button").click();
      await expect(appPage.getByTestId("create-template-modal")).not.toBeVisible();

      // 6. テンプレートが作成されたことを確認
      await expect(appPage.getByText("備考長さテスト")).toBeVisible();
    });

    test("8.5 編集時の名前重複チェック", async ({ appPage }) => {
      // 1. テンプレート「テンプレートA」を作成
      await appPage.getByTestId("create-custom-template-button").click();
      await appPage.getByTestId("template-name-input").fill("テンプレートA");
      await appPage.getByTestId("create-template-save-button").click();
      await expect(appPage.getByTestId("create-template-modal")).not.toBeVisible();

      // 2. テンプレート「テンプレートB」を作成
      await appPage.getByTestId("create-custom-template-button").click();
      await appPage.getByTestId("template-name-input").fill("テンプレートB");
      await appPage.getByTestId("create-template-save-button").click();
      await expect(appPage.getByTestId("create-template-modal")).not.toBeVisible();

      // 3. テンプレート「テンプレートB」（最新=first）を編集
      const editButtons = appPage.locator('[data-testid^="edit-custom-template-"]');
      await editButtons.first().click();

      // 4. 名前を「テンプレートA」に変更しようとする
      const nameInput = appPage.getByTestId("edit-template-name-input");
      await nameInput.clear();
      await nameInput.fill("テンプレートA");

      // 5. 「保存」ボタンをクリック
      await appPage.getByTestId("edit-template-save-button").click();

      // 6. 重複エラーメッセージが表示されることを確認
      await expect(appPage.getByTestId("edit-template-name-error")).toBeVisible();
      await expect(appPage.getByTestId("edit-template-name-error")).toContainText(
        "同名のテンプレート"
      );

      // 7. キャンセル
      await appPage.getByTestId("edit-template-cancel-button").click();
    });

    test("8.6 最大テンプレート数制限（50件）", async ({ appPage }) => {
      // タイムアウトを120秒に設定（50個のテンプレート作成）
      test.setTimeout(120000);

      // 1. 50個のテンプレートを作成
      for (let i = 1; i <= 50; i++) {
        await appPage.getByTestId("create-custom-template-button").click();
        await appPage.getByTestId("template-name-input").fill(`テンプレート${i}`);
        await appPage.getByTestId("create-template-save-button").click();
        await expect(appPage.getByTestId("create-template-modal")).not.toBeVisible();
      }

      // 2. ボタンがdisabledになっていることを確認
      const createButton = appPage.getByTestId("create-custom-template-button");
      await expect(createButton).toBeDisabled();

      // 3. ボタンのtitle属性に最大数到達メッセージが表示されていることを確認
      await expect(createButton).toHaveAttribute("title", "最大保持数（50件）に達しました");
    });

    test("8.7 編集時の備考の最大長制限（maxLength属性）", async ({ appPage }) => {
      // 1. テンプレートを作成
      await appPage.getByTestId("create-custom-template-button").click();
      await appPage.getByTestId("template-name-input").fill("編集備考テスト");
      await appPage.getByTestId("create-template-save-button").click();
      await expect(appPage.getByTestId("create-template-modal")).not.toBeVisible();

      // 2. 作成したテンプレートを編集
      const editButtons = appPage.locator('[data-testid^="edit-custom-template-"]');
      await editButtons.first().click();

      // 3. 121文字の備考を入力しようとする
      const longNote = "あ".repeat(121); // 121文字
      await appPage.getByTestId("edit-template-note-input").fill(longNote);

      // 4. HTML maxLength=120により120文字に制限されることを確認
      const inputValue = await appPage.getByTestId("edit-template-note-input").inputValue();
      expect(inputValue.length).toBe(120);
      expect(inputValue).toBe("あ".repeat(120));

      // 5. 120文字は有効なのでエラーなく保存される
      await appPage.getByTestId("edit-template-save-button").click();
      await expect(appPage.getByTestId("edit-template-modal")).not.toBeVisible();
    });
  });

  test.describe("9. 統合テスト", () => {
    test("9.1 テンプレートのライフサイクル全体", async ({ appPage }) => {
      // タイムアウトを120秒に設定（多数の操作とリロードを含む）
      test.setTimeout(120000);

      // 1. アプリケーションを起動し、カスタムテンプレートが0件であることを確認
      await expect(appPage.getByTestId("custom-template-empty-state")).toBeVisible();

      // 2. カスタムテンプレート「統合テスト」を作成（増産剤: なし、コンベアベルト: Mk.III）
      await appPage.getByTestId("create-custom-template-button").click();
      await appPage.getByTestId("template-name-input").fill("統合テスト");
      await appPage.getByTestId("create-template-save-button").click();

      // 3. テンプレートを適用
      const applyButton = appPage.locator('[data-testid^="custom-template-apply-button-"]').first();
      await applyButton.click();
      await appPage.getByRole("button", { name: "適用" }).click();

      // 4. 設定が変更されることを確認（増産剤が「なし」になっている）
      await expect(appPage.getByTestId("proliferator-type-button-none")).toHaveClass(
        /bg-neon-magenta/
      );

      // 5. 設定パネルで増産剤を「増産剤 Mk.III」に変更
      await appPage.getByTestId("proliferator-type-button-mk3").click();

      // 6. テンプレート「統合テスト」を編集し、現在の設定で上書き
      const editButton = appPage.locator('[data-testid^="edit-custom-template-"]').first();
      await editButton.click();
      await appPage.getByTestId("overwrite-with-current-button").click();

      // 7. テンプレート「統合テスト」を再度適用
      const applyButton2 = appPage
        .locator('[data-testid^="custom-template-apply-button-"]')
        .first();
      await applyButton2.click();
      await appPage.getByRole("button", { name: "適用" }).click();

      // 8. 設定が最新の内容に変更されることを確認（増産剤: 増産剤 Mk.III）
      await expect(appPage.getByTestId("proliferator-type-button-mk3")).toHaveClass(
        /bg-neon-magenta/
      );

      // 9. ページをリロード
      await appPage.reload();

      // 10. テンプレート「統合テスト」が保持されていることを確認
      await expect(getFirstTemplateCard(appPage).getByText("統合テスト")).toBeVisible();

      // 11. テンプレートを削除
      await getFirstTemplateDeleteButton(appPage).click();
      await confirmDeleteTemplate(appPage);

      // 12. 「↶ 元に戻す」ボタンをクリック
      await appPage.getByTestId("undo-button").click();

      // 13. テンプレートが復元されることを確認
      await expect(getAllTemplateCards(appPage)).toHaveCount(1);

      // 14. 「📜 履歴」ボタンをクリック
      await appPage.getByTestId("history-dialog-button").click();

      // 15. すべての操作が履歴に記録されていることを確認
      await expect(appPage.getByRole("heading", { name: "履歴" })).toBeVisible();
    });
  });
});
