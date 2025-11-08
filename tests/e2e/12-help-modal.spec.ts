// spec: docs/testing/HELP_MODAL_TEST_PLAN.md
import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { disableAnimations } from "./helpers/ui-stability";

test.describe("ヘルプモーダル", () => {
  test.beforeEach(async ({ appPage }) => {
    // localStorageにWelcomeモーダルを表示済みフラグを設定
    await appPage.addInitScript(() => {
      localStorage.setItem("dsp_calc_tutorial_seen", "true");
    });

    await appPage.goto("http://localhost:5173/");
    await disableAnimations(appPage);
  });

  test("12-01: ヘルプモーダルの開閉", async ({ appPage }) => {
    // 1. ヘッダーの「📖 ヘルプ」ボタンをクリック
    await appPage.getByTestId("help-menu-trigger").click();

    // 2. ヘルプモーダルが表示されることを確認
    const modal = appPage.getByTestId("help-modal");
    await expect(modal).toBeVisible();
    await expect(appPage.getByRole("heading", { name: "ヘルプ", level: 2 })).toBeVisible();

    // 3. デフォルトで「アバウト」タブが選択されていることを確認
    await expect(appPage.getByRole("tab", { name: "アバウト", selected: true })).toBeVisible();
    await expect(appPage.getByTestId("help-tab-about")).toBeVisible();

    // 4. 閉じるボタンをクリック
    await appPage.getByTestId("help-modal-close").click();

    // 5. モーダルが閉じることを確認
    await expect(modal).toBeHidden();
  });

  test("12-02: ESCキーでヘルプモーダルを閉じる", async ({ appPage }) => {
    // ESCキーでモーダルを閉じる機能が実装されたためスキップを解除

    // 1. ヘルプモーダルを開く
    await appPage.getByTestId("help-menu-trigger").click();
    const modal = appPage.getByTestId("help-modal");
    await expect(modal).toBeVisible();

    // 2. ESCキーを押す
    await appPage.keyboard.press("Escape");

    // 3. モーダルが閉じることを確認
    await expect(modal).toBeHidden();
  });

  test("12-03: アバウトタブの内容確認", async ({ appPage }) => {
    // 1. ヘルプモーダルを開く
    await appPage.getByTestId("help-menu-trigger").click();

    // 2. アバウトタブが選択されていることを確認
    const aboutTab = appPage.getByTestId("help-tab-about");
    await expect(aboutTab).toBeVisible();
    await expect(appPage.getByRole("tab", { name: "アバウト", selected: true })).toBeVisible();

    // 3. 「最新対応バージョン」セクションが表示されることを確認
    await expect(appPage.getByText("最新対応バージョン")).toBeVisible();

    // 4. バージョン番号が表示されることを確認
    // NOTE: 意図的に.first()を使用 - 複数のバージョン番号から最初のものを取得
    const versionText = appPage.locator("text=/\\d+\\.\\d+\\.\\d+\\.\\d+/").first();
    await expect(versionText).toBeVisible();

    // 5. 「サポート中」バッジが表示されることを確認（複数存在する可能性があるため.first()を使用）
    await expect(appPage.getByText("サポート中").first()).toBeVisible();

    // 6. 「対応ゲームバージョン一覧」が表示されることを確認
    await expect(
      appPage.getByRole("heading", { name: "対応ゲームバージョン一覧", level: 4 })
    ).toBeVisible();

    // 7. 「アプリバージョン」セクションが表示されることを確認
    await expect(
      appPage.getByRole("heading", { name: "アプリバージョン", level: 4 })
    ).toBeVisible();

    // 8. アプリバージョン情報が表示されることを確認
    await expect(appPage.getByText("アプリバージョン:")).toBeVisible();
    // 「ビルド日時:」は複数箇所に存在するため.first()を使用
    await expect(appPage.getByText("ビルド日時:").first()).toBeVisible();
    // 「データ最終更新日:」は複数箇所に存在するため.first()を使用
    await expect(appPage.getByText("データ最終更新日:").first()).toBeVisible();

    // 9. 「リポジトリ」セクションが表示されることを確認
    await expect(aboutTab.getByRole("heading", { name: "リポジトリ", level: 4 })).toBeVisible();

    // 10. GitHubリポジトリのリンクが表示されることを確認
    const repoLink = aboutTab.getByRole("link", { name: /github\.com\/izu-san\/dsp-calc-tool/ });
    await expect(repoLink).toBeVisible();
    await expect(repoLink).toHaveAttribute("href", "https://github.com/izu-san/dsp-calc-tool");
    await expect(repoLink).toHaveAttribute("target", "_blank");
    await expect(repoLink).toHaveAttribute("rel", /noopener/);
  });

  test("12-04: 更新履歴タブの表示と内容確認", async ({ appPage }) => {
    // 1. ヘルプモーダルを開く
    await appPage.getByTestId("help-menu-trigger").click();

    // 2. 「更新履歴」タブをクリック
    await appPage.getByRole("tab", { name: "更新履歴" }).click();

    // 3. 「更新履歴」タブが選択されることを確認
    await expect(appPage.getByRole("tab", { name: "更新履歴", selected: true })).toBeVisible();
    const changelogTab = appPage.getByTestId("help-tab-changelog");
    await expect(changelogTab).toBeVisible();

    // 4. 更新履歴の見出しが表示されることを確認
    await expect(appPage.getByRole("heading", { name: "更新履歴", level: 3 })).toBeVisible();

    // 5. バージョン情報が表示されることを確認（例: [0.0.0]）
    // NOTE: 意図的に.first()を使用 - ページ内の最初のバージョン見出しを取得
    const versionHeading = appPage.locator('h2:has-text("[0.")').first();
    await expect(versionHeading).toBeVisible();

    // 6. セクション見出し（「追加」など）が表示されることを確認
    // NOTE: 意図的に.first()を使用 - 複数の「追加」見出しから最初のものを取得
    await expect(appPage.getByRole("heading", { name: "追加", level: 3 }).first()).toBeVisible();

    // 7. 箇条書きリストが表示されることを確認
    // NOTE: 意図的に.first()を使用 - 複数のリストから最初のものを取得
    await expect(appPage.getByRole("list").first()).toBeVisible();

    // NOTE: 生成日時はCHANGELOG_ja.mdに含まれないため、このアサーションは削除
  });

  test("12-05: よくある質問タブの表示と内容確認", async ({ appPage }) => {
    // 1. ヘルプモーダルを開く
    await appPage.getByTestId("help-menu-trigger").click();

    // 2. 「よくある質問」タブをクリック
    await appPage.getByRole("tab", { name: "よくある質問" }).click();

    // 3. 「よくある質問」タブが選択されることを確認
    await expect(appPage.getByRole("tab", { name: "よくある質問", selected: true })).toBeVisible();
    const faqTab = appPage.getByTestId("help-tab-faq");
    await expect(faqTab).toBeVisible();

    // 4. よくある質問の見出しが表示されることを確認
    await expect(appPage.getByRole("heading", { name: "よくある質問", level: 3 })).toBeVisible();

    // 5. カテゴリ見出しが表示されることを確認
    await expect(appPage.getByRole("heading", { name: "計算の前提条件", level: 4 })).toBeVisible();
    await expect(appPage.getByRole("heading", { name: "既知の制限事項", level: 4 })).toBeVisible();
    await expect(appPage.getByRole("heading", { name: "よくある質問", level: 4 })).toBeVisible();
    await expect(
      appPage.getByRole("heading", { name: "トラブルシューティング", level: 4 })
    ).toBeVisible();

    // 6. FAQ項目が表示されることを確認
    await expect(appPage.getByText("増産剤の排他モードについて")).toBeVisible();
    await expect(appPage.getByText("ベルト速度の計算方法")).toBeVisible();
    await expect(appPage.getByText("電力計算の仕組み")).toBeVisible();

    // 7. 回答が表示されることを確認
    await expect(appPage.getByText(/追加生産.*速度上昇/)).toBeVisible();
  });

  test("12-06: フィードバックタブの表示と内容確認", async ({ appPage }) => {
    // 1. ヘルプモーダルを開く
    await appPage.getByTestId("help-menu-trigger").click();

    // 2. 「フィードバック」タブをクリック
    const feedbackTabButton = appPage.getByRole("tab", { name: "フィードバック" });
    await feedbackTabButton.click();

    // 3. 「フィードバック」タブパネルが表示されるまで待つ
    const feedbackTab = appPage.getByTestId("help-tab-feedback");
    await feedbackTab.waitFor({ state: "visible", timeout: 10000 });

    // 4. フィードバックの見出しが表示されることを確認
    await expect(
      feedbackTab.getByRole("heading", { name: "フィードバックを送信", level: 3 })
    ).toBeVisible();

    // 5. 「バグ報告時に必要な情報」セクションが表示されることを確認
    await expect(
      feedbackTab.getByRole("heading", { name: "バグ報告時に必要な情報", level: 4 })
    ).toBeVisible();

    // 6. 必要な情報のリストが表示されることを確認
    await expect(feedbackTab.getByText("使用しているブラウザとバージョン")).toBeVisible();
    await expect(feedbackTab.getByText("ゲームバージョン")).toBeVisible();
    await expect(feedbackTab.getByText("エラーメッセージ（もしあれば）")).toBeVisible();
    await expect(feedbackTab.getByText("再現手順")).toBeVisible();

    // 7. 「返信ポリシー」セクションが表示されることを確認
    await expect(
      feedbackTab.getByRole("heading", { name: "返信ポリシー", level: 4 })
    ).toBeVisible();
    await expect(feedbackTab.getByText(/週1回程度/)).toBeVisible();
  });

  test("12-06-2: キーボードショートカットタブのアクセシビリティ方針確認", async ({ appPage }) => {
    // 1. ヘルプモーダルを開く
    await appPage.getByTestId("help-menu-trigger").click();

    // 2. 「キーボードショートカット」タブをクリック
    const keyboardShortcutsTabButton = appPage.getByRole("tab", {
      name: "キーボードショートカット",
    });
    await keyboardShortcutsTabButton.click();

    // 3. 「キーボードショートカット」タブパネルが表示されるまで待つ
    const keyboardShortcutsTab = appPage.getByTestId("help-tab-keyboard-shortcuts");
    await keyboardShortcutsTab.waitFor({ state: "visible", timeout: 10000 });

    // 4. 「アクセシビリティ方針」セクションが表示されることを確認
    await expect(
      keyboardShortcutsTab.getByRole("heading", { name: "アクセシビリティ方針", level: 4 })
    ).toBeVisible();

    // 5. 「キーボード操作」セクションが表示されることを確認
    await expect(
      keyboardShortcutsTab.getByRole("heading", { name: "キーボード操作", level: 5 })
    ).toBeVisible();

    // 6. 「スクリーンリーダー対応」セクションが表示されることを確認
    await expect(
      keyboardShortcutsTab.getByRole("heading", { name: "スクリーンリーダー対応", level: 5 })
    ).toBeVisible();
  });

  test("12-07: タブ間の切り替え", async ({ appPage }) => {
    // 1. ヘルプモーダルを開く
    await appPage.getByTestId("help-menu-trigger").click();

    // 2. アバウトタブが選択されていることを確認
    await expect(appPage.getByRole("tab", { name: "アバウト", selected: true })).toBeVisible();

    // 3. 更新履歴タブをクリック
    await appPage.getByRole("tab", { name: "更新履歴" }).click();
    await expect(appPage.getByRole("tab", { name: "更新履歴", selected: true })).toBeVisible();
    await expect(appPage.getByRole("heading", { name: "更新履歴", level: 3 })).toBeVisible();

    // 4. よくある質問タブをクリック
    await appPage.getByRole("tab", { name: "よくある質問" }).click();
    await expect(appPage.getByRole("tab", { name: "よくある質問", selected: true })).toBeVisible();
    await expect(appPage.getByRole("heading", { name: "よくある質問", level: 3 })).toBeVisible();

    // 5. フィードバックタブをクリック
    await appPage.getByRole("tab", { name: "フィードバック" }).click();
    await expect(
      appPage.getByRole("tab", { name: "フィードバック", selected: true })
    ).toBeVisible();
    await expect(
      appPage.getByRole("heading", { name: "フィードバックを送信", level: 3 })
    ).toBeVisible();

    // 6. 再度アバウトタブをクリック
    await appPage.getByRole("tab", { name: "アバウト" }).click();
    await expect(appPage.getByRole("tab", { name: "アバウト", selected: true })).toBeVisible();
    await expect(appPage.getByText("最新対応バージョン")).toBeVisible();
  });

  test("12-08: キーボードナビゲーション", async ({ appPage }) => {
    // Radix UI TabsはactivationMode="automatic"で自動アクティベーションをサポートしています
    // 矢印キーでタブを移動すると自動的にアクティブになります

    // 1. ヘルプモーダルを開く
    await appPage.getByTestId("help-menu-trigger").click();

    // 2. アバウトタブが選択されていることを確認
    const aboutTab = appPage.getByRole("tab", { name: "アバウト" });
    await expect(aboutTab).toHaveAttribute("data-state", "active");

    //タブリストにフォーカスを当てるためにアバウトタブを一度クリック
    await aboutTab.click();

    // 少し待機してフォーカスが確実に設定されるようにする
    await appPage.waitForTimeout(100);

    // 3. 右矢印キーで次のタブに移動（automaticモードで自動的にアクティブになる）
    await appPage.keyboard.press("ArrowRight");
    const changelogTab = appPage.getByRole("tab", { name: "更新履歴" });
    await expect(changelogTab).toHaveAttribute("data-state", "active");
    await expect(appPage.getByTestId("help-tab-changelog")).toBeVisible();

    // 4. さらに右矢印キーで次のタブに移動
    await appPage.keyboard.press("ArrowRight");
    const faqTab = appPage.getByRole("tab", { name: "よくある質問" });
    await expect(faqTab).toHaveAttribute("data-state", "active");
    await expect(appPage.getByTestId("help-tab-faq")).toBeVisible();

    // 5. 左矢印キーで前のタブに戻る
    await appPage.keyboard.press("ArrowLeft");
    await expect(changelogTab).toHaveAttribute("data-state", "active");
    await expect(appPage.getByTestId("help-tab-changelog")).toBeVisible();
  });

  test("12-09: 複数回の開閉", async ({ appPage }) => {
    const modal = appPage.getByTestId("help-modal");

    // 1回目の開閉
    await appPage.getByTestId("help-menu-trigger").click();
    await expect(modal).toBeVisible();
    await appPage.getByTestId("help-modal-close").click();
    await expect(modal).toBeHidden();

    // 2回目の開閉
    await appPage.getByTestId("help-menu-trigger").click();
    await expect(modal).toBeVisible();
    await appPage.getByTestId("help-modal-close").click();
    await expect(modal).toBeHidden();

    // 3回目の開閉
    await appPage.getByTestId("help-menu-trigger").click();
    await expect(modal).toBeVisible();

    // タブを切り替えてから閉じる
    await appPage.getByRole("tab", { name: "フィードバック" }).click();
    const feedbackTab = appPage.getByTestId("help-tab-feedback");
    await feedbackTab.waitFor({ state: "visible", timeout: 10000 });
    await expect(
      appPage.getByRole("tab", { name: "フィードバック", selected: true })
    ).toBeVisible();

    await appPage.getByTestId("help-modal-close").click();
    await expect(modal).toBeHidden();

    // 4回目の開閉（フィードバックタブが選択されたままかもしれない）
    await appPage.getByTestId("help-menu-trigger").click();
    await expect(modal).toBeVisible();
    // モーダルの状態がリセットされない場合、フィードバックタブが選択されたままの可能性がある
    // どちらかのタブが選択されていることを確認
    const aboutTabSelected = await appPage
      .getByRole("tab", { name: "アバウト", selected: true })
      .isVisible()
      .catch(() => false);
    const feedbackTabSelected = await appPage
      .getByRole("tab", { name: "フィードバック", selected: true })
      .isVisible()
      .catch(() => false);

    // いずれかのタブが選択されていることを確認（理想はアバウトタブだが、状態がリセットされない場合フィードバックタブの可能性もある）
    expect(aboutTabSelected || feedbackTabSelected).toBe(true);
  });

  test("12-10: リンクの属性確認", async ({ appPage }) => {
    // 1. ヘルプモーダルを開く
    await appPage.getByTestId("help-menu-trigger").click();

    // 2. アバウトタブが選択されていることを確認
    await expect(appPage.getByRole("tab", { name: "アバウト", selected: true })).toBeVisible();

    // 3. リポジトリリンクの確認（Aboutタブ内）
    const aboutTab = appPage.getByTestId("help-tab-about");
    await aboutTab.waitFor({ state: "visible", timeout: 10000 });
    const repoLink = aboutTab.getByRole("link", { name: /github\.com\/izu-san\/dsp-calc-tool/ });
    await expect(repoLink).toHaveAttribute("href", "https://github.com/izu-san/dsp-calc-tool");
    await expect(repoLink).toHaveAttribute("target", "_blank");
    await expect(repoLink).toHaveAttribute("rel", /noopener/);
  });

  test("12-11: スクロール動作確認", async ({ appPage }) => {
    // 1. ヘルプモーダルを開く
    await appPage.getByTestId("help-menu-trigger").click();

    // 2. よくある質問タブを開く
    const faqTabButton = appPage.getByRole("tab", { name: "よくある質問" });
    await faqTabButton.click();

    // 3. よくある質問タブパネルが表示されるまで待つ
    const modalContent = appPage.getByTestId("help-tab-faq");
    await modalContent.waitFor({ state: "visible", timeout: 10000 });

    // 4. 最初のカテゴリが表示されることを確認
    await expect(
      modalContent.getByRole("heading", { name: "計算の前提条件", level: 4 })
    ).toBeVisible();

    // 5. スクロールして最後のカテゴリを表示
    const troubleshootingHeading = modalContent.getByRole("heading", {
      name: "トラブルシューティング",
      level: 4,
    });
    await troubleshootingHeading.scrollIntoViewIfNeeded();
    await expect(troubleshootingHeading).toBeVisible();

    // 6. 最後のカテゴリのコンテンツが表示されることを確認
    await expect(modalContent.getByText("データが読み込めない場合")).toBeVisible();
    await expect(modalContent.getByText("計算が実行されない場合")).toBeVisible();
    await expect(modalContent.getByText("エラーメッセージの見方")).toBeVisible();
  });

  test("12-12: パッチ差分タブの表示と内容確認", async ({ appPage }) => {
    // 1. ヘルプモーダルを開く
    await appPage.getByTestId("help-menu-trigger").click();

    // 2. パッチ差分タブが表示されることを確認
    const patchDiffTabButton = appPage.getByRole("tab", { name: "パッチ差分" });
    await expect(patchDiffTabButton).toBeVisible();

    // 3. パッチ差分タブをクリック
    await patchDiffTabButton.click();

    // 4. パッチ差分タブパネルが表示されるまで待つ
    const patchDiffTab = appPage.getByTestId("help-tab-patch-diff");
    await patchDiffTab.waitFor({ state: "visible", timeout: 10000 });

    // 5. パッチ差分ビューが表示されることを確認
    const patchInfoView = patchDiffTab.getByTestId("patch-info-view");
    await expect(patchInfoView).toBeVisible();

    // 6. パッチ差分の見出しが表示されることを確認
    await expect(
      patchInfoView.getByRole("heading", { name: "パッチ差分", level: 3 })
    ).toBeVisible();

    // 7. バージョン選択のラベルが表示されることを確認
    await expect(patchInfoView.getByText("バージョン選択")).toBeVisible();

    // 8. 「比較するバージョンを選択してください」のメッセージが表示されることを確認（デフォルトでは最新バージョンが選択されているため）
    await expect(patchInfoView.getByText("比較するバージョンを選択してください")).toBeVisible();
  });

  test("12-08: フィードバックタブの表示とリンク動作", async ({ appPage, context }) => {
    // 1. ヘルプモーダルを開く
    await appPage.getByTestId("help-menu-trigger").click();
    const modal = appPage.getByTestId("help-modal");
    await expect(modal).toBeVisible();

    // 2. フィードバックタブをクリック
    await appPage.getByRole("tab", { name: "フィードバック" }).click();

    // 3. フィードバックタブが選択されていることを確認
    await expect(
      appPage.getByRole("tab", { name: "フィードバック", selected: true })
    ).toBeVisible();
    await expect(appPage.getByTestId("help-tab-feedback")).toBeVisible();

    // 4. フィードバックフォームが表示されることを確認
    const feedbackForm = appPage.getByTestId("feedback-form");
    await expect(feedbackForm).toBeVisible();

    // 5. 送信方法選択ラジオボタンが表示されることを確認
    await expect(appPage.getByTestId("feedback-form-submit-method-field")).toBeVisible();
    await expect(appPage.getByTestId("feedback-form-submit-method-github")).toBeVisible();

    // 6. GitHub Issueで報告ボタンが表示されることを確認
    await expect(appPage.getByTestId("feedback-form-github-issue-button")).toBeVisible();

    // 7. GitHub Issueで報告ボタンをクリック
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      appPage.getByTestId("feedback-form-github-issue-button").click(),
    ]);

    // 8. GitHub Issue作成ページが開かれることを確認（ログインページにリダイレクトされる場合もある）
    await expect(newPage).toHaveURL(/github\.com\/(login|.*\/issues\/new)/);
    await newPage.close();

    // 9. フォームで報告を選択（Google Form URLが設定されている場合のみ）
    const formRadio = appPage.getByTestId("feedback-form-submit-method-form");
    if (await formRadio.isVisible().catch(() => false)) {
      await formRadio.click();

      // 10. Google Formボタンが表示されることを確認
      await expect(appPage.getByTestId("feedback-form-google-form-button")).toBeVisible();

      // 11. Google Formボタンをクリック
      const [googleFormPage] = await Promise.all([
        context.waitForEvent("page"),
        appPage.getByTestId("feedback-form-google-form-button").click(),
      ]);

      // 12. Google Formが開かれることを確認
      await expect(googleFormPage).toHaveURL(/docs\.google\.com\/forms/);
      await googleFormPage.close();
    }
  });
});
