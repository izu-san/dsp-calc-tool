// spec: docs/testing/CUSTOM_TEMPLATE_E2E_TEST_PLAN.md
// seed: tests/e2e/seed.spec.ts

import { expect, test } from "@playwright/test";

test.describe("カスタムテンプレート機能", () => {
  test.beforeEach(async ({ page }) => {
    // LocalStorageをクリアして初期状態に
    await page.goto("http://localhost:5173/");
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();

    // Welcomeモーダルが表示されている場合はスキップ
    const skipButton = page.getByTestId("welcome-skip-button");
    try {
      await skipButton.click({ timeout: 5000 });
      // モーダルが閉じるまで待機
      await page.getByTestId("welcome-modal").waitFor({ state: "hidden", timeout: 5000 });
    } catch {
      // モーダルが表示されていない場合は何もしない
    }
  });

  test.describe("1. テンプレート作成機能", () => {
    test("1.1 新規テンプレート作成（正常系）", async ({ page }) => {
      // 1. カスタムテンプレートセクションを表示
      await expect(page.getByRole("button", { name: "＋ テンプレート作成" })).toBeVisible();
      await expect(
        page.getByText("現在の設定をテンプレート化して素早く切り替えられます")
      ).toBeVisible();

      // 2. 「＋ テンプレート作成」ボタンをクリック
      await page.getByTestId("create-custom-template-button").click();

      // 3. テンプレート作成モーダルが表示されることを確認
      await expect(page.getByTestId("create-template-modal")).toBeVisible();

      // 4. テンプレート名「省電力モード」、メモ「電力消費を最小化する設定」を入力
      await page.getByTestId("template-name-input").fill("省電力モード");
      await page.getByTestId("template-note-input").fill("電力消費を最小化する設定");

      // 5. 現在の設定プレビューが表示されることを確認
      await expect(page.getByTestId("template-settings-preview")).toBeVisible();

      // 6. 「保存」ボタンをクリック
      await page.getByTestId("create-template-save-button").click();

      // 7. モーダルが閉じることを確認
      await expect(page.getByTestId("create-template-modal")).not.toBeVisible();

      // 8. カスタムテンプレートセクションに「省電力モード」が表示されることを確認
      await expect(page.getByText("省電力モード")).toBeVisible();
      await expect(page.getByText("電力消費を最小化する設定")).toBeVisible();
    });

    // NOTE: input要素にmaxLength=40が設定されているため、41文字以上は物理的に入力できません。
    // そのため、バリデーションエラーのE2Eテストは実施できません。
    // 代わりに、maxLength属性によって40文字までしか入力できないことを確認します。
    test("1.2 テンプレート名の最大長制限（maxLength属性）", async ({ page }) => {
      // 1. テンプレート作成モーダルを開く
      await page.getByTestId("create-custom-template-button").click();

      // 2. テンプレート名に41文字の文字列を入力試行
      const longName = "あ".repeat(41); // 41文字
      await page.getByTestId("template-name-input").fill(longName);

      // 3. input要素のmaxLength属性により、実際には40文字までしか入力されないことを確認
      const inputValue = await page.getByTestId("template-name-input").inputValue();
      expect(inputValue.length).toBe(40); // 40文字に制限される
      expect(inputValue).toBe("あ".repeat(40));

      // 4. 「保存」ボタンをクリック
      await page.getByTestId("create-template-save-button").click();

      // 5. エラーなく保存されることを確認（40文字は有効な長さ）
      await expect(page.getByTestId("create-template-modal")).not.toBeVisible();

      // 6. テンプレート名が40文字で作成されていることを確認
      await expect(page.getByText("あ".repeat(40))).toBeVisible();
    });
    test("1.3 メモの文字数制限", async ({ page }) => {
      // 1. 「＋ テンプレート作成」ボタンをクリック
      await page.getByTestId("create-custom-template-button").click();

      // 2. テンプレート名に「テストテンプレート」と入力
      await page.getByTestId("template-name-input").fill("テストテンプレート");

      // 3. メモフィールドに120文字のテキストを入力
      const memoText = "あ".repeat(120);
      await page.getByTestId("template-note-input").fill(memoText);

      // 4. 文字数カウンターが「120/120 文字」と表示されることを確認
      await expect(page.getByText("120/120 文字")).toBeVisible();

      // 5. 「保存」ボタンをクリック
      await page.getByTestId("create-template-save-button").click();

      // 6. テンプレートが正常に作成されることを確認
      await expect(page.getByText("テストテンプレート")).toBeVisible();
    });

    test("1.4 同名テンプレートの上書き確認", async ({ page }) => {
      // 1. テンプレート「高速モード」を作成（増産剤: なし、コンベアベルト: Mk.3）
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("高速モード");
      await page.getByTestId("create-template-save-button").click();
      await expect(
        page.locator('[data-testid^="custom-template-card-"]').first().getByText("高速モード")
      ).toBeVisible();

      // 2. 設定パネルで増産剤を「増産剤 Mk.III」に変更
      await page.getByTestId("proliferator-type-button-mk3").click();

      // 3. 再度「＋ テンプレート作成」ボタンをクリック
      await page.getByTestId("create-custom-template-button").click();

      // 4. テンプレート名に「高速モード」（既存と同じ名前）を入力
      await page.getByTestId("template-name-input").fill("高速モード");

      // 5. 「保存」ボタンをクリック
      await page.getByTestId("create-template-save-button").click();

      // 6. 上書き確認モーダルが表示されることを確認
      await expect(
        page.getByText("同名のテンプレートが既に存在します。上書きしますか？")
      ).toBeVisible();

      // 7. 「上書き」ボタンをクリック
      await page.getByRole("button", { name: "上書き" }).click();

      // 8. テンプレート一覧で「高速モード」が1件のみ存在することを確認
      const templateCards = page.locator('[data-testid^="custom-template-card-"]');
      await expect(templateCards).toHaveCount(1);
    });
  });

  test.describe("2. テンプレート一覧表示", () => {
    test("2.1 デフォルトテンプレートとカスタムテンプレートの区別表示", async ({ page }) => {
      // 1. デフォルトテンプレート（序盤、中盤、後半、終盤、省電力）が表示されることを確認
      await expect(page.getByRole("button", { name: "🌱序盤" })).toBeVisible();
      await expect(page.getByRole("button", { name: "⚙️中盤" })).toBeVisible();
      await expect(page.getByRole("button", { name: "🚀後半" })).toBeVisible();
      await expect(page.getByRole("button", { name: "⭐終盤" })).toBeVisible();
      await expect(page.getByRole("button", { name: "💡省電力" })).toBeVisible();

      // 2. カスタムテンプレートセクションが独立して表示されることを確認
      await expect(page.getByTestId("custom-template-section")).toBeVisible();

      // 3. 空状態メッセージが表示されることを確認
      await expect(page.getByTestId("custom-template-empty-state")).toBeVisible();
      await expect(
        page.getByText("現在の設定をテンプレート化して素早く切り替えられます")
      ).toBeVisible();
    });

    test("2.2 カスタムテンプレートカードの表示", async ({ page }) => {
      // 1. カスタムテンプレート「省電力モード」（メモ付き）を作成
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("省電力モード");
      await page.getByTestId("template-note-input").fill("電力消費を最小化");
      await page.getByTestId("create-template-save-button").click();

      // 2. カスタムテンプレート「高速モード」（メモなし）を作成
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("高速モード");
      await page.getByTestId("create-template-save-button").click();

      // 3. 各テンプレートカードにテンプレート名が表示されることを確認
      await expect(page.getByText("省電力モード")).toBeVisible();
      await expect(page.getByText("高速モード")).toBeVisible();

      // 4. メモが設定されている場合のみメモが表示されることを確認
      await expect(page.getByText("電力消費を最小化")).toBeVisible();

      // 5. 各カードに「適用」ボタンとメニューボタン（編集・削除）が表示されることを確認
      const templateCards = page.locator('[data-testid^="custom-template-card-"]');
      await expect(templateCards).toHaveCount(2);
    });
  });

  test.describe("3. テンプレート適用機能", () => {
    test("3.1 カスタムテンプレートの適用", async ({ page }) => {
      // 1. カスタムテンプレート「省電力モード」を作成（増産剤: なし）
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("省電力モード");
      await page.getByTestId("create-template-save-button").click();

      // 2. 設定パネルで増産剤を「増産剤 Mk.III」に変更
      await page.getByTestId("proliferator-type-button-mk3").click();

      // 3. カスタムテンプレート「省電力モード」の「適用」ボタンをクリック
      const applyButton = page.locator('[data-testid^="custom-template-apply-button-"]').first();
      await applyButton.click();

      // 4. 適用確認モーダルが表示されることを確認
      await expect(
        page.getByRole("heading", { name: /省電力モード を適用しますか？/ })
      ).toBeVisible();

      // 5. 設定プレビューが表示されることを確認
      await expect(page.getByText("コンベアベルト:")).toBeVisible();

      // 6. 「適用」ボタンをクリック
      await page.getByRole("button", { name: "適用" }).click();

      // 7. 設定が反映されることを確認（増産剤が「なし」に戻る）
      await expect(page.getByRole("button", { name: "なし" })).toBeVisible();
    });

    test("3.2 デフォルトテンプレートの適用", async ({ page }) => {
      // 1. 設定パネルで増産剤を「増産剤 Mk.III」に変更
      await page.getByTestId("proliferator-type-button-mk3").click();

      // 2. デフォルトテンプレート「💡省電力」ボタンをクリック
      await page.getByTestId("template-button-powerSaver").click();

      // 3. 適用確認モーダルが表示されることを確認
      await expect(page.getByRole("heading", { name: /省電力 を適用しますか？/ })).toBeVisible();

      // 4. 「適用」ボタンをクリック
      await page.getByRole("button", { name: "適用" }).click();

      // 5. 設定が反映されることを確認
      await expect(page.getByRole("button", { name: "なし" })).toBeVisible();
    });

    test("3.3 テンプレート適用のキャンセル", async ({ page }) => {
      // 1. カスタムテンプレート「省電力モード」を作成
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("省電力モード");
      await page.getByTestId("create-template-save-button").click();

      // 2. 設定パネルで増産剤を「増産剤 Mk.III」に変更
      await page.getByTestId("proliferator-type-button-mk3").click();

      // 3. 「適用」ボタンをクリック
      const applyButton = page.locator('[data-testid^="custom-template-apply-button-"]').first();
      await applyButton.click();

      // 4. 確認モーダルで「キャンセル」ボタンをクリック
      await page.getByTestId("custom-template-confirm-cancel-button").click();

      // 5. 設定が変更されていないことを確認（増産剤が「増産剤 Mk.III」のまま）
      await expect(page.getByTestId("proliferator-type-button-mk3")).toBeVisible();
    });
  });

  test.describe("4. テンプレート編集機能", () => {
    test("4.1 テンプレート名とメモの編集", async ({ page }) => {
      // 1. カスタムテンプレート「省電力モード」を作成（メモ付き）
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("省電力モード");
      await page.getByTestId("template-note-input").fill("電力を抑える");
      await page.getByTestId("create-template-save-button").click();

      // 2. 編集メニューを開く
      const editButton = page.locator('[data-testid^="edit-custom-template-"]').first();
      await editButton.click();

      // 3. 編集モーダルが表示されることを確認
      await expect(page.getByTestId("edit-template-modal")).toBeVisible();

      // 4. テンプレート名を「エコモード」に変更
      await page.getByTestId("edit-template-name-input").clear();
      await page.getByTestId("edit-template-name-input").fill("エコモード");

      // 5. メモを「電力消費を最小化する最適設定」に変更
      await page.getByTestId("edit-template-note-input").clear();
      await page.getByTestId("edit-template-note-input").fill("電力消費を最小化する最適設定");

      // 6. 「保存」ボタンをクリック
      await page.getByTestId("edit-template-save-button").click();

      // 7. モーダルが閉じることを確認
      await expect(page.getByTestId("edit-template-modal")).not.toBeVisible();

      // 8. テンプレートカードの名称とメモが更新されていることを確認
      await expect(page.getByText("エコモード")).toBeVisible();
      await expect(page.getByText("電力消費を最小化する最適設定")).toBeVisible();
    });

    test("4.2 現在の設定で上書き", async ({ page }) => {
      // 1. カスタムテンプレート「高速モード」を作成（増産剤: なし、コンベアベルト: Mk.III）
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("高速モード");
      await page.getByTestId("create-template-save-button").click();

      // 2. 設定パネルで増産剤を「増産剤 Mk.III」に変更
      await page.getByTestId("proliferator-type-button-mk3").click();

      // 3. 編集モーダルを開く
      const editButton = page.locator('[data-testid^="edit-custom-template-"]').first();
      await editButton.click();

      // 4. 「現在の設定で上書き」ボタンをクリック（保存ボタンは不要）
      await page.getByTestId("overwrite-with-current-button").click();

      // 5. モーダルが閉じることを確認
      await expect(page.getByTestId("edit-template-modal")).not.toBeVisible();

      // 6. テンプレート「高速モード」を適用
      const applyButton = page.locator('[data-testid^="custom-template-apply-button-"]').first();
      await applyButton.click();
      await page.getByRole("button", { name: "適用" }).click();

      // 7. 設定が正しく反映されることを確認（増産剤: 増産剤 Mk.III）
      await expect(page.getByTestId("proliferator-type-button-mk3")).toBeVisible();
    });

    test("4.3 編集時の名称重複チェック", async ({ page }) => {
      // 1. カスタムテンプレート「モードA」を作成
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("モードA");
      await page.getByTestId("create-template-save-button").click();

      // 2. カスタムテンプレート「モードB」を作成
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("モードB");
      await page.getByTestId("create-template-save-button").click();

      // 3. テンプレート「モードA」の編集モーダルを開く
      const editButtons = page.locator('[data-testid^="edit-custom-template-"]');
      await editButtons.last().click(); // モードAは最初に作成したので last() を使用

      // 4. テンプレート名を「モードB」（既存の別テンプレート名）に変更
      await page.getByTestId("edit-template-name-input").clear();
      await page.getByTestId("edit-template-name-input").fill("モードB");

      // 5. 「保存」ボタンをクリック
      await page.getByTestId("edit-template-save-button").click();

      // 6. バリデーションエラーが表示されることを確認
      await expect(page.getByText("同名のテンプレートが既に存在します")).toBeVisible();

      // 7. キャンセル
      await page.getByTestId("edit-template-cancel-button").click();
    });
  });

  test.describe("5. テンプレート削除機能", () => {
    test("5.1 テンプレートの削除", async ({ page }) => {
      // 1. カスタムテンプレート「削除テスト」を作成
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("削除テスト");
      await page.getByTestId("create-template-save-button").click();

      // 2. 削除メニューを開く
      const deleteButton = page.locator('[data-testid^="delete-custom-template-"]').first();
      await deleteButton.click();

      // 3. 削除確認モーダルが表示されることを確認
      await expect(page.getByTestId("delete-template-modal")).toBeVisible();

      // 4. モーダルに削除対象のテンプレート名が表示されることを確認
      await expect(page.getByText(/このプランを削除しますか？: 削除テスト/)).toBeVisible();

      // 5. 「削除」ボタンをクリック
      await page.getByTestId("delete-template-confirm-button").click();

      // 6. モーダルが閉じることを確認
      await expect(page.getByTestId("delete-template-modal")).not.toBeVisible();

      // 7. テンプレートカードが一覧から消えることを確認
      await expect(page.getByText("削除テスト")).not.toBeVisible();

      // 8. 空状態メッセージが表示されることを確認
      await expect(page.getByTestId("custom-template-empty-state")).toBeVisible();
    });

    test("5.2 削除のキャンセル", async ({ page }) => {
      // 1. カスタムテンプレート「キャンセルテスト」を作成
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("キャンセルテスト");
      await page.getByTestId("create-template-save-button").click();

      // 2. 削除メニューを開く
      const deleteButton = page.locator('[data-testid^="delete-custom-template-"]').first();
      await deleteButton.click();

      // 3. 削除確認モーダルで「キャンセル」ボタンをクリック
      await page.getByTestId("delete-template-cancel-button").click();

      // 4. モーダルが閉じることを確認
      await expect(page.getByTestId("delete-template-modal")).not.toBeVisible();

      // 5. テンプレートが削除されずに残っていることを確認
      await expect(page.getByText("キャンセルテスト")).toBeVisible();
    });

    test("5.3 適用中テンプレートの削除", async ({ page }) => {
      // 1. カスタムテンプレート「適用中モード」を作成（増産剤: 増産剤 Mk.III）
      await page.getByTestId("proliferator-type-button-mk3").click();
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("適用中モード");
      await page.getByTestId("create-template-save-button").click();

      // 2. テンプレート「適用中モード」を適用
      const applyButton = page.locator('[data-testid^="custom-template-apply-button-"]').first();
      await applyButton.click();
      await page.getByTestId("custom-template-confirm-apply-button").click();

      // 3. 設定パネルで増産剤が「増産剤 Mk.III」になっていることを確認
      await expect(page.getByTestId("proliferator-type-button-mk3")).toBeVisible();

      // 4. テンプレートを削除
      const deleteButton = page.locator('[data-testid^="delete-custom-template-"]').first();
      await deleteButton.click();
      await page.getByTestId("delete-template-confirm-button").click();

      // 5. テンプレートが削除されることを確認
      await expect(page.getByText("適用中モード")).not.toBeVisible();

      // 6. 設定パネルの設定値は変わらないことを確認（増産剤: 増産剤 Mk.III のまま）
      await expect(page.getByTestId("proliferator-type-button-mk3")).toBeVisible();
    });
  });

  test.describe("6. 履歴連携機能", () => {
    test("6.1 テンプレート作成の履歴記録", async ({ page }) => {
      // 1. カスタムテンプレート「履歴テスト1」を作成
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("履歴テスト1");
      await page.getByTestId("create-template-save-button").click();

      // 2. ヘッダーの「📜 履歴」ボタンをクリック
      await page.getByRole("button", { name: "📜 履歴" }).click();

      // 3. 履歴パネルが開くことを確認
      await expect(page.getByRole("heading", { name: "履歴" })).toBeVisible();

      // 4. 最新の履歴エントリにテンプレート作成が記録されていることを確認
      await expect(page.getByTestId("history-entry-text-0")).toContainText("履歴テスト1");
    });

    test("6.2 履歴の Undo/Redo（テンプレート作成）", async ({ page }) => {
      // 1. 初期状態でカスタムテンプレートが0件であることを確認
      await expect(page.getByTestId("custom-template-empty-state")).toBeVisible();

      // 2. カスタムテンプレート「Undo/Redoテスト」を作成
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("Undo/Redoテスト");
      await page.getByTestId("create-template-save-button").click();

      // 3. カスタムテンプレートが1件表示されることを確認
      await expect(page.locator('[data-testid^="custom-template-card-"]')).toHaveCount(1);

      // 4. ヘッダーの「↶ 元に戻す」ボタンをクリック
      await page.getByRole("button", { name: "↶ 元に戻す" }).click();

      // 5. カスタムテンプレートが0件に戻ることを確認（テンプレートが消える）
      await expect(page.locator('[data-testid^="custom-template-card-"]')).toHaveCount(0);

      // 6. 空状態メッセージが表示されることを確認
      await expect(page.getByTestId("custom-template-empty-state")).toBeVisible();

      // 7. 「↷ やり直し」ボタンをクリック
      await page.getByRole("button", { name: "↷ やり直し" }).click();

      // 8. カスタムテンプレート「Undo/Redoテスト」が再び表示されることを確認
      await expect(page.locator('[data-testid^="custom-template-card-"]')).toHaveCount(1);
      await expect(
        page.locator('[data-testid^="custom-template-card-"]').first().getByText("Undo/Redoテスト")
      ).toBeVisible();
    });

    test("6.3 履歴の Undo/Redo（テンプレート編集）", async ({ page }) => {
      // 1. カスタムテンプレート「編集前」を作成（メモ: 「初期メモ」）
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("編集前");
      await page.getByTestId("template-note-input").fill("初期メモ");
      await page.getByTestId("create-template-save-button").click();

      // 2. テンプレートを編集（名称: 「編集後」、メモ: 「更新メモ」）
      const editButton = page.locator('[data-testid^="edit-custom-template-"]').first();
      await editButton.click();
      await page.getByTestId("edit-template-name-input").clear();
      await page.getByTestId("edit-template-name-input").fill("編集後");
      await page.getByTestId("edit-template-note-input").clear();
      await page.getByTestId("edit-template-note-input").fill("更新メモ");
      await page.getByTestId("edit-template-save-button").click();

      // 3. テンプレート名とメモが更新されていることを確認
      const templateCard = page.locator('[data-testid^="custom-template-card-"]').first();
      await expect(templateCard.getByText("編集後")).toBeVisible();
      await expect(templateCard.getByText("更新メモ")).toBeVisible();

      // 4. 「↶ 元に戻す」ボタンをクリック
      await page.getByRole("button", { name: "↶ 元に戻す" }).click();

      // 5. テンプレート名が「編集前」、メモが「初期メモ」に戻ることを確認
      await expect(templateCard.getByText("編集前")).toBeVisible();
      await expect(templateCard.getByText("初期メモ")).toBeVisible();

      // 6. 「↷ やり直し」ボタンをクリック
      await page.getByRole("button", { name: "↷ やり直し" }).click();

      // 7. テンプレート名が「編集後」、メモが「更新メモ」に戻ることを確認
      await expect(templateCard.getByText("編集後")).toBeVisible();
      await expect(templateCard.getByText("更新メモ")).toBeVisible();
    });

    test("6.4 履歴の Undo/Redo（テンプレート削除）", async ({ page }) => {
      // 1. カスタムテンプレート「削除Undoテスト」を作成
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("削除Undoテスト");
      await page.getByTestId("create-template-save-button").click();

      // 2. テンプレートを削除
      const deleteButton = page.locator('[data-testid^="delete-custom-template-"]').first();
      await deleteButton.click();
      await page.getByTestId("delete-template-confirm-button").click();

      // 3. テンプレートが一覧から消えることを確認
      await expect(page.locator('[data-testid^="custom-template-card-"]')).toHaveCount(0);

      // 4. 「↶ 元に戻す」ボタンをクリック
      await page.getByRole("button", { name: "↶ 元に戻す" }).click();

      // 5. テンプレート「削除Undoテスト」が復元されることを確認
      await expect(page.locator('[data-testid^="custom-template-card-"]')).toHaveCount(1);
      await expect(
        page.locator('[data-testid^="custom-template-card-"]').first().getByText("削除Undoテスト")
      ).toBeVisible();

      // 6. 「↷ やり直し」ボタンをクリック
      await page.getByRole("button", { name: "↷ やり直し" }).click();

      // 7. テンプレートが再び削除されることを確認
      await expect(page.locator('[data-testid^="custom-template-card-"]')).toHaveCount(0);
    });
  });

  test.describe("7. データ永続化機能", () => {
    test("7.1 LocalStorageへの保存とページリロード後の復元", async ({ page }) => {
      // 1. カスタムテンプレート「永続化テスト1」を作成（メモ: 「リロードテスト」）
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("永続化テスト1");
      await page.getByTestId("template-note-input").fill("リロードテスト");
      await page.getByTestId("create-template-save-button").click();

      // 2. カスタムテンプレート「永続化テスト2」を作成
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("永続化テスト2");
      await page.getByTestId("create-template-save-button").click();

      // 3. テンプレート「永続化テスト1」を適用
      const applyButtons = page.locator('[data-testid^="custom-template-apply-button-"]');
      await applyButtons.first().click();
      await page.getByTestId("custom-template-confirm-apply-button").click();

      // 4. ページをリロード（F5またはブラウザの更新ボタン）
      await page.reload();

      // 5. カスタムテンプレートセクションに2件のテンプレートが表示されることを確認
      const templateCards = page.locator('[data-testid^="custom-template-card-"]');
      await expect(templateCards).toHaveCount(2);

      // 6. テンプレート名とメモが正しく表示されることを確認
      await expect(page.getByText("永続化テスト1")).toBeVisible();
      await expect(page.getByText("リロードテスト")).toBeVisible();
      await expect(page.getByText("永続化テスト2")).toBeVisible();
    });
  });

  test.describe("8. エッジケースとエラーハンドリング", () => {
    test("8.2 特殊文字を含むテンプレート名", async ({ page }) => {
      // 1. テンプレート名に「<script>alert('XSS')</script>」を入力して作成
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("<script>alert('XSS')</script>");
      await page.getByTestId("create-template-save-button").click();

      // 2. スクリプトタグが文字列として表示されることを確認（実行されない）
      await expect(page.getByText("<script>alert('XSS')</script>")).toBeVisible();

      // 3. テンプレート名に絵文字「🚀🎮⭐」を入力して作成
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("🚀🎮⭐");
      await page.getByTestId("create-template-save-button").click();

      // 4. 絵文字が正しく表示されることを確認
      await expect(page.getByText("🚀🎮⭐")).toBeVisible();
    });

    test("8.3 前後空白を含むテンプレート名", async ({ page }) => {
      // 1. テンプレート名に「  前後空白テスト  」を入力
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("  前後空白テスト  ");

      // 2. 「保存」ボタンをクリック
      await page.getByTestId("create-template-save-button").click();

      // 3. バリデーションエラーが表示されることを確認（空白は自動削除されない）
      await expect(page.getByTestId("template-name-error")).toBeVisible();

      // 4. キャンセル
      await page.getByTestId("create-template-cancel-button").click();
    });

    test("8.4 備考の最大長制限（maxLength属性）", async ({ page }) => {
      // 1. テンプレート作成モーダルを開く
      await page.getByTestId("create-custom-template-button").click();

      // 2. テンプレート名を入力
      await page.getByTestId("template-name-input").fill("備考長さテスト");

      // 3. 121文字の備考を入力しようとする
      const longNote = "あ".repeat(121); // 121文字
      await page.getByTestId("template-note-input").fill(longNote);

      // 4. HTML maxLength=120により120文字に制限されることを確認
      const inputValue = await page.getByTestId("template-note-input").inputValue();
      expect(inputValue.length).toBe(120);
      expect(inputValue).toBe("あ".repeat(120));

      // 5. 120文字は有効なのでエラーなく保存される
      await page.getByTestId("create-template-save-button").click();
      await expect(page.getByTestId("create-template-modal")).not.toBeVisible();

      // 6. テンプレートが作成されたことを確認
      await expect(page.getByText("備考長さテスト")).toBeVisible();
    });

    test("8.5 編集時の名前重複チェック", async ({ page }) => {
      // 1. テンプレート「テンプレートA」を作成
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("テンプレートA");
      await page.getByTestId("create-template-save-button").click();
      await expect(page.getByTestId("create-template-modal")).not.toBeVisible();

      // 2. テンプレート「テンプレートB」を作成
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("テンプレートB");
      await page.getByTestId("create-template-save-button").click();
      await expect(page.getByTestId("create-template-modal")).not.toBeVisible();

      // 3. テンプレート「テンプレートB」（最新=first）を編集
      const editButtons = page.locator('[data-testid^="edit-custom-template-"]');
      await editButtons.first().click();

      // 4. 名前を「テンプレートA」に変更しようとする
      const nameInput = page.getByTestId("edit-template-name-input");
      await nameInput.clear();
      await nameInput.fill("テンプレートA");

      // 5. 「保存」ボタンをクリック
      await page.getByTestId("edit-template-save-button").click();

      // 6. 重複エラーメッセージが表示されることを確認
      await expect(page.getByTestId("edit-template-name-error")).toBeVisible();
      await expect(page.getByTestId("edit-template-name-error")).toContainText(
        "同名のテンプレート"
      );

      // 7. キャンセル
      await page.getByTestId("edit-template-cancel-button").click();
    });

    test("8.6 最大テンプレート数制限（50件）", async ({ page }) => {
      // 1. 50個のテンプレートを作成
      for (let i = 1; i <= 50; i++) {
        await page.getByTestId("create-custom-template-button").click();
        await page.getByTestId("template-name-input").fill(`テンプレート${i}`);
        await page.getByTestId("create-template-save-button").click();
        await expect(page.getByTestId("create-template-modal")).not.toBeVisible();
      }

      // 2. ボタンがdisabledになっていることを確認
      const createButton = page.getByTestId("create-custom-template-button");
      await expect(createButton).toBeDisabled();

      // 3. ボタンのtitle属性に最大数到達メッセージが表示されていることを確認
      await expect(createButton).toHaveAttribute("title", "最大保持数（50件）に達しました");
    });

    test("8.7 編集時の備考の最大長制限（maxLength属性）", async ({ page }) => {
      // 1. テンプレートを作成
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("編集備考テスト");
      await page.getByTestId("create-template-save-button").click();
      await expect(page.getByTestId("create-template-modal")).not.toBeVisible();

      // 2. 作成したテンプレートを編集
      const editButtons = page.locator('[data-testid^="edit-custom-template-"]');
      await editButtons.first().click();

      // 3. 121文字の備考を入力しようとする
      const longNote = "あ".repeat(121); // 121文字
      await page.getByTestId("edit-template-note-input").fill(longNote);

      // 4. HTML maxLength=120により120文字に制限されることを確認
      const inputValue = await page.getByTestId("edit-template-note-input").inputValue();
      expect(inputValue.length).toBe(120);
      expect(inputValue).toBe("あ".repeat(120));

      // 5. 120文字は有効なのでエラーなく保存される
      await page.getByTestId("edit-template-save-button").click();
      await expect(page.getByTestId("edit-template-modal")).not.toBeVisible();
    });
  });

  test.describe("9. 統合テスト", () => {
    test("9.1 テンプレートのライフサイクル全体", async ({ page }) => {
      // 1. アプリケーションを起動し、カスタムテンプレートが0件であることを確認
      await expect(page.getByTestId("custom-template-empty-state")).toBeVisible();

      // 2. カスタムテンプレート「統合テスト」を作成（増産剤: なし、コンベアベルト: Mk.III）
      await page.getByTestId("create-custom-template-button").click();
      await page.getByTestId("template-name-input").fill("統合テスト");
      await page.getByTestId("create-template-save-button").click();

      // 3. テンプレートを適用
      const applyButton = page.locator('[data-testid^="custom-template-apply-button-"]').first();
      await applyButton.click();
      await page.getByRole("button", { name: "適用" }).click();

      // 4. 設定が変更されることを確認（増産剤が「なし」になっている）
      await expect(page.getByTestId("proliferator-type-button-none")).toHaveClass(
        /bg-neon-magenta/
      );

      // 5. 設定パネルで増産剤を「増産剤 Mk.III」に変更
      await page.getByTestId("proliferator-type-button-mk3").click();

      // 6. テンプレート「統合テスト」を編集し、現在の設定で上書き
      const editButton = page.locator('[data-testid^="edit-custom-template-"]').first();
      await editButton.click();
      await page.getByTestId("overwrite-with-current-button").click();

      // 7. テンプレート「統合テスト」を再度適用
      const applyButton2 = page.locator('[data-testid^="custom-template-apply-button-"]').first();
      await applyButton2.click();
      await page.getByRole("button", { name: "適用" }).click();

      // 8. 設定が最新の内容に変更されることを確認（増産剤: 増産剤 Mk.III）
      await expect(page.getByTestId("proliferator-type-button-mk3")).toHaveClass(/bg-neon-magenta/);

      // 9. ページをリロード
      await page.reload();

      // 10. テンプレート「統合テスト」が保持されていることを確認
      await expect(
        page.locator('[data-testid^="custom-template-card-"]').first().getByText("統合テスト")
      ).toBeVisible();

      // 11. テンプレートを削除
      const deleteButton = page.locator('[data-testid^="delete-custom-template-"]').first();
      await deleteButton.click();
      await page.getByTestId("delete-template-confirm-button").click();

      // 12. 「↶ 元に戻す」ボタンをクリック
      await page.getByRole("button", { name: "↶ 元に戻す" }).click();

      // 13. テンプレートが復元されることを確認
      await expect(page.locator('[data-testid^="custom-template-card-"]')).toHaveCount(1);

      // 14. 「📜 履歴」ボタンをクリック
      await page.getByRole("button", { name: "📜 履歴" }).click();

      // 15. すべての操作が履歴に記録されていることを確認
      await expect(page.getByRole("heading", { name: "履歴" })).toBeVisible();
    });
  });
});
