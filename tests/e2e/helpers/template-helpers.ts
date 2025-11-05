import type { Page } from "@playwright/test";

/**
 * カスタムテンプレート操作用のヘルパー関数集
 *
 * このファイルは、11-custom-template.spec.ts で頻繁に使用される
 * テンプレート関連のセレクタとアクションをヘルパー関数として提供します。
 *
 * 目的:
 * - `locator('[data-testid^="custom-template-..."]').first()` の削減
 * - テストコードの可読性向上
 * - セレクタロジックの一元管理
 */

/**
 * 最初のカスタムテンプレートカードを取得
 * NOTE: テンプレートが複数存在する場合、最初のものを返します
 *
 * @param page - Playwrightページオブジェクト
 * @returns 最初のテンプレートカードのLocator
 */
export function getFirstTemplateCard(page: Page) {
  return page.locator('[data-testid^="custom-template-card-"]').first();
}

/**
 * 特定のテンプレートカードを名前で取得
 *
 * @param page - Playwrightページオブジェクト
 * @param templateName - テンプレート名
 * @returns 指定された名前のテンプレートカードのLocator
 */
export function getTemplateCardByName(page: Page, templateName: string) {
  return page.locator(`[data-testid^="custom-template-card-"]`, {
    has: page.getByText(templateName, { exact: true }),
  });
}

/**
 * 最初のカスタムテンプレートの「適用」ボタンを取得
 * NOTE: 意図的に.first()を使用 - 最初のテンプレートカードの適用ボタンを取得するため
 *
 * @param page - Playwrightページオブジェクト
 * @returns 最初のテンプレートの適用ボタンのLocator
 */
export function getFirstTemplateApplyButton(page: Page) {
  return page.locator('[data-testid^="custom-template-apply-button-"]').first();
}

/**
 * 特定のテンプレートの「適用」ボタンを名前で取得
 *
 * @param page - Playwrightページオブジェクト
 * @param templateName - テンプレート名
 * @returns 指定された名前のテンプレートの適用ボタンのLocator
 */
export function getTemplateApplyButtonByName(page: Page, templateName: string) {
  const card = getTemplateCardByName(page, templateName);
  return card.locator('[data-testid^="custom-template-apply-button-"]');
}

/**
 * 最初のカスタムテンプレートの「編集」ボタンを取得
 * NOTE: 意図的に.first()を使用 - 最初のテンプレートカードの編集ボタンを取得するため
 *
 * @param page - Playwrightページオブジェクト
 * @returns 最初のテンプレートの編集ボタンのLocator
 */
export function getFirstTemplateEditButton(page: Page) {
  return page.locator('[data-testid^="edit-custom-template-"]').first();
}

/**
 * 特定のテンプレートの「編集」ボタンを名前で取得
 *
 * @param page - Playwrightページオブジェクト
 * @param templateName - テンプレート名
 * @returns 指定された名前のテンプレートの編集ボタンのLocator
 */
export function getTemplateEditButtonByName(page: Page, templateName: string) {
  const card = getTemplateCardByName(page, templateName);
  return card.locator('[data-testid^="edit-custom-template-"]');
}

/**
 * 最初のカスタムテンプレートの「削除」ボタンを取得
 * NOTE: 意図的に.first()を使用 - 最初のテンプレートカードの削除ボタンを取得するため
 *
 * @param page - Playwrightページオブジェクト
 * @returns 最初のテンプレートの削除ボタンのLocator
 */
export function getFirstTemplateDeleteButton(page: Page) {
  return page.locator('[data-testid^="delete-custom-template-"]').first();
}

/**
 * 特定のテンプレートの「削除」ボタンを名前で取得
 *
 * @param page - Playwrightページオブジェクト
 * @param templateName - テンプレート名
 * @returns 指定された名前のテンプレートの削除ボタンのLocator
 */
export function getTemplateDeleteButtonByName(page: Page, templateName: string) {
  const card = getTemplateCardByName(page, templateName);
  return card.locator('[data-testid^="delete-custom-template-"]');
}

/**
 * 全てのカスタムテンプレートカードを取得
 *
 * @param page - Playwrightページオブジェクト
 * @returns 全てのテンプレートカードのLocator
 */
export function getAllTemplateCards(page: Page) {
  return page.locator('[data-testid^="custom-template-card-"]');
}

/**
 * カスタムテンプレート作成ダイアログを開く
 *
 * @param page - Playwrightページオブジェクト
 */
export async function openCreateTemplateDialog(page: Page) {
  await page.getByTestId("create-custom-template-button").click();
}

/**
 * テンプレート作成/編集ダイアログで名前とメモを入力
 *
 * @param page - Playwrightページオブジェクト
 * @param name - テンプレート名
 * @param note - メモ（オプション）
 */
export async function fillTemplateForm(page: Page, name: string, note?: string) {
  await page.getByTestId("template-name-input").fill(name);
  if (note !== undefined) {
    await page.getByTestId("template-note-input").fill(note);
  }
}

/**
 * テンプレート作成/編集ダイアログで保存ボタンをクリック
 *
 * @param page - Playwrightページオブジェクト
 */
export async function saveTemplate(page: Page) {
  await page.getByTestId("create-template-save-button").click();
}

/**
 * カスタムテンプレートを作成（一連の操作をまとめたヘルパー）
 *
 * @param page - Playwrightページオブジェクト
 * @param name - テンプレート名
 * @param note - メモ（オプション）
 * @param handleOverwrite - 上書き確認が出た場合に上書きするか（デフォルト: true）
 */
export async function createTemplate(
  page: Page,
  name: string,
  note?: string,
  handleOverwrite = true
) {
  await openCreateTemplateDialog(page);
  await fillTemplateForm(page, name, note);
  await saveTemplate(page);

  // 上書き確認モーダルが表示された場合の処理
  const overwriteButton = page.getByRole("button", { name: "上書き" });
  const isOverwriteDialogVisible = await overwriteButton
    .isVisible({ timeout: 1000 })
    .catch(() => false);

  if (isOverwriteDialogVisible && handleOverwrite) {
    await overwriteButton.click();
  }
}

/**
 * テンプレート適用確認モーダルで「適用」ボタンをクリック
 *
 * @param page - Playwrightページオブジェクト
 */
export async function confirmApplyTemplate(page: Page) {
  await page.getByRole("button", { name: "適用" }).click();
}

/**
 * テンプレート削除確認モーダルで「削除」ボタンをクリック
 *
 * @param page - Playwrightページオブジェクト
 */
export async function confirmDeleteTemplate(page: Page) {
  await page.getByTestId("delete-template-confirm-button").click();
}
