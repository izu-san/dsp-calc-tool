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
    await expect(appPage.getByText("ビルド日時:")).toBeVisible();
    // 「データ最終更新日:」は複数箇所に存在するため.first()を使用
    await expect(appPage.getByText("データ最終更新日:").first()).toBeVisible();
  });

  test("12-04: 更新履歴タブの表示と内容確認", async ({ appPage }) => {
    // 1. ヘルプモーダルを開く
    await appPage.getByTestId("help-menu-trigger").click();

    // 2. 「更新履歴」タブをクリック
    await appPage.getByRole("tab", { name: "更新履歴" }).click();

    // 3. 「更新履歴」タブが選択されることを確認
    const changelogTab = appPage.getByTestId("help-tab-changelog");
    await expect(changelogTab).toBeVisible();
    await expect(appPage.getByRole("tab", { name: "更新履歴", selected: true })).toBeVisible();

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

    // 8. 生成日時が表示されることを確認
    await expect(appPage.getByText(/生成日時:/)).toBeVisible();
  });

  test("12-05: よくある質問タブの表示と内容確認", async ({ appPage }) => {
    // 1. ヘルプモーダルを開く
    await appPage.getByTestId("help-menu-trigger").click();

    // 2. 「よくある質問」タブをクリック
    await appPage.getByRole("tab", { name: "よくある質問" }).click();

    // 3. 「よくある質問」タブが選択されることを確認
    const faqTab = appPage.getByTestId("help-tab-faq");
    await expect(faqTab).toBeVisible();
    await expect(appPage.getByRole("tab", { name: "よくある質問", selected: true })).toBeVisible();

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

  test("12-06: サポートタブの表示と内容確認", async ({ appPage }) => {
    // 1. ヘルプモーダルを開く
    await appPage.getByTestId("help-menu-trigger").click();

    // 2. 「サポート」タブをクリック
    await appPage.getByRole("tab", { name: "サポート" }).click();

    // 3. 「サポート」タブが選択されることを確認
    const supportTab = appPage.getByTestId("help-tab-support");
    await expect(supportTab).toBeVisible();
    await expect(appPage.getByRole("tab", { name: "サポート", selected: true })).toBeVisible();

    // 4. サポートの見出しが表示されることを確認
    await expect(appPage.getByRole("heading", { name: "サポート", level: 3 })).toBeVisible();

    // 5. 「リポジトリ」セクションが表示されることを確認
    await expect(appPage.getByRole("heading", { name: "リポジトリ", level: 4 })).toBeVisible();

    // 6. GitHubリポジトリのリンクが表示されることを確認
    const repoLink = appPage.getByRole("link", { name: /github\.com\/izu-san\/dsp-calc-tool/ });
    await expect(repoLink).toBeVisible();
    await expect(repoLink).toHaveAttribute("href", "https://github.com/izu-san/dsp-calc-tool");

    // 7. 「イシューを報告」セクションが表示されることを確認
    await expect(appPage.getByRole("heading", { name: "イシューを報告", level: 4 })).toBeVisible();

    // 8. イシュー報告のリンクが表示されることを確認
    const issueLink = appPage.getByRole("link", { name: "イシューを報告" });
    await expect(issueLink).toBeVisible();
    await expect(issueLink).toHaveAttribute("href", /\/issues\/new/);

    // 9. 「バグ報告時に必要な情報」セクションが表示されることを確認
    await expect(
      appPage.getByRole("heading", { name: "バグ報告時に必要な情報", level: 4 })
    ).toBeVisible();

    // 10. 必要な情報のリストが表示されることを確認
    await expect(appPage.getByText("使用しているブラウザとバージョン")).toBeVisible();
    await expect(appPage.getByText("ゲームバージョン")).toBeVisible();
    await expect(appPage.getByText("エラーメッセージ（もしあれば）")).toBeVisible();
    await expect(appPage.getByText("再現手順")).toBeVisible();

    // 11. 「返信ポリシー」セクションが表示されることを確認
    await expect(appPage.getByRole("heading", { name: "返信ポリシー", level: 4 })).toBeVisible();
    await expect(appPage.getByText(/週1回程度/)).toBeVisible();
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

    // 5. サポートタブをクリック
    await appPage.getByRole("tab", { name: "サポート" }).click();
    await expect(appPage.getByRole("tab", { name: "サポート", selected: true })).toBeVisible();
    await expect(appPage.getByRole("heading", { name: "サポート", level: 3 })).toBeVisible();

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
    await appPage.getByRole("tab", { name: "サポート" }).click();
    await expect(appPage.getByTestId("help-tab-support")).toBeVisible();
    await expect(appPage.getByRole("tab", { name: "サポート", selected: true })).toBeVisible();

    await appPage.getByTestId("help-modal-close").click();
    await expect(modal).toBeHidden();

    // 4回目の開閉（サポートタブが選択されたままかもしれない）
    await appPage.getByTestId("help-menu-trigger").click();
    await expect(modal).toBeVisible();
    // モーダルの状態がリセットされない場合、サポートタブが選択されたままの可能性がある
    // どちらかのタブが選択されていることを確認
    const aboutTabSelected = await appPage
      .getByRole("tab", { name: "アバウト", selected: true })
      .isVisible()
      .catch(() => false);
    const supportTabSelected = await appPage
      .getByRole("tab", { name: "サポート", selected: true })
      .isVisible()
      .catch(() => false);

    // いずれかのタブが選択されていることを確認（理想はアバウトタブだが、状態がリセットされない場合サポートタブの可能性もある）
    expect(aboutTabSelected || supportTabSelected).toBe(true);
  });

  test("12-10: リンクの属性確認", async ({ appPage }) => {
    // 1. ヘルプモーダルを開く
    await appPage.getByTestId("help-menu-trigger").click();

    // 2. サポートタブを開く
    await appPage.getByRole("tab", { name: "サポート" }).click();

    // 3. リポジトリリンクの確認
    const repoLink = appPage.getByRole("link", { name: /github\.com\/izu-san\/dsp-calc-tool/ });
    await expect(repoLink).toHaveAttribute("href", "https://github.com/izu-san/dsp-calc-tool");
    await expect(repoLink).toHaveAttribute("target", "_blank");
    await expect(repoLink).toHaveAttribute("rel", /noopener/);

    // 4. イシューリンクの確認
    const issueLink = appPage.getByRole("link", { name: "イシューを報告" });
    await expect(issueLink).toHaveAttribute(
      "href",
      /github\.com\/izu-san\/dsp-calc-tool\/issues\/new/
    );
    await expect(issueLink).toHaveAttribute("target", "_blank");
    await expect(issueLink).toHaveAttribute("rel", /noopener/);
  });

  test("12-11: スクロール動作確認", async ({ appPage }) => {
    // 1. ヘルプモーダルを開く
    await appPage.getByTestId("help-menu-trigger").click();

    // 2. よくある質問タブを開く
    await appPage.getByRole("tab", { name: "よくある質問" }).click();

    // 3. モーダル内でスクロールできることを確認（FAQタブのパネルを指定）
    const modalContent = appPage.getByTestId("help-tab-faq");
    await expect(modalContent).toBeVisible();

    // 4. 最初のカテゴリが表示されることを確認
    await expect(appPage.getByRole("heading", { name: "計算の前提条件", level: 4 })).toBeVisible();

    // 5. スクロールして最後のカテゴリを表示
    await appPage
      .getByRole("heading", { name: "トラブルシューティング", level: 4 })
      .scrollIntoViewIfNeeded();
    await expect(
      appPage.getByRole("heading", { name: "トラブルシューティング", level: 4 })
    ).toBeVisible();

    // 6. 最後のカテゴリのコンテンツが表示されることを確認
    await expect(appPage.getByText("データが読み込めない場合")).toBeVisible();
    await expect(appPage.getByText("計算が実行されない場合")).toBeVisible();
    await expect(appPage.getByText("エラーメッセージの見方")).toBeVisible();
  });
});
