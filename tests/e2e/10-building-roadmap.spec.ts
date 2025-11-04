// spec: docs/testing/TEST_PLAN_BUILDING_ROADMAP.md
import { expect } from "@playwright/test";
import { test } from "./fixtures";

test.setTimeout(120000);

test.describe("建設ロードマップ機能", () => {
  test.describe("1. 基本表示とナビゲーション", () => {
    test("1.1 初回アクセス時の表示", async ({ appPage }) => {
      // 電磁マトリックスを選択
      await appPage.getByTestId("recipe-button-1801").click();

      // 建設ロードマップタブをクリック
      await appPage.getByTestId("roadmap-tab").click();

      // ビューが表示されることを確認
      await expect(appPage.getByRole("heading", { name: "建設ロードマップ" })).toBeVisible();

      // 全体進捗が0%で表示される
      await expect(appPage.getByText(/全体進捗:\s*0%/)).toBeVisible();

      // 原材料採掘フェーズが展開されている
      const rawMaterialsPhase = appPage.getByRole("button", { name: /▼\s*原材料採掘/ });
      await expect(rawMaterialsPhase).toBeVisible();

      // Phase 2以降が折りたたまれている
      const phase2 = appPage.getByRole("button", { name: /▶\s*Phase 2:/ });
      await expect(phase2).toBeVisible();

      // すべてリセットボタンが表示される
      await expect(appPage.getByRole("button", { name: "すべてリセット" })).toBeVisible();
    });

    test("1.2 タブ間の切り替え", async ({ appPage }) => {
      // 電磁マトリックスを選択
      await appPage.getByTestId("recipe-button-1801").click();

      // 建設ロードマップタブを開く
      await appPage.getByTestId("roadmap-tab").click();
      await expect(appPage.getByRole("heading", { name: "建設ロードマップ" })).toBeVisible();

      // 統計タブに切り替え
      await appPage.getByTestId("statistics-tab").click();
      await expect(appPage.getByTestId("statistics-total-machines")).toBeVisible();

      // 建設ロードマップタブに戻る
      await appPage.getByTestId("roadmap-tab").click();
      await expect(appPage.getByRole("heading", { name: "建設ロードマップ" })).toBeVisible();

      // 生産チェーンタブに切り替え
      await appPage.getByTestId("production-chain-tab").click();
      await expect(appPage.getByTestId("recipe-node-1801")).toBeVisible();

      // 再度建設ロードマップタブに戻る
      await appPage.getByTestId("roadmap-tab").click();
      await expect(appPage.getByRole("heading", { name: "建設ロードマップ" })).toBeVisible();
    });

    test("1.3 異なるレシピでの表示", async ({ appPage }) => {
      // 鉄インゴット（シンプル）を選択
      await appPage.getByTestId("recipe-button-1101").click();
      await appPage.getByTestId("roadmap-tab").click();

      // フェーズが少ないことを確認（2-3フェーズ程度）
      const ironPhases = await appPage.getByRole("button", { name: /Phase \d+:/ }).count();
      expect(ironPhases).toBeLessThanOrEqual(3);

      // 構造マトリックス（複雑）に切り替え
      await appPage.getByTestId("recipe-button-1803").click();
      await appPage.getByTestId("roadmap-tab").click();

      // フェーズが多いことを確認（4フェーズ以上）
      const structurePhases = await appPage.getByRole("button", { name: /Phase \d+:/ }).count();
      expect(structurePhases).toBeGreaterThanOrEqual(4);
    });
  });

  test.describe("2. フェーズ管理機能", () => {
    test.beforeEach(async ({ appPage }) => {
      // 電磁マトリックスを選択して建設ロードマップを開く
      await appPage.getByTestId("recipe-button-1801").click();
      await appPage.getByTestId("roadmap-tab").click();
    });

    test("2.1 フェーズの展開と折りたたみ", async ({ appPage }) => {
      // Phase 2が折りたたまれていることを確認
      const phase2Button = appPage.getByRole("button", { name: /▶.*Phase 2:/ });
      await expect(phase2Button).toBeVisible();

      // Phase 2をクリックして展開
      await phase2Button.click();

      // 展開アイコンが変わることを確認
      await expect(appPage.getByRole("button", { name: /▼.*Phase 2:/ })).toBeVisible();

      // ノードが表示されることを確認（磁石、銅インゴット、鉄インゴットのいずれか）
      const magnetNode = appPage.getByRole("button", { name: /☐.*磁石/ });
      await expect(magnetNode).toBeVisible();

      // 再度クリックして折りたたむ
      await appPage.getByRole("button", { name: /▼.*Phase 2:/ }).click();

      // 折りたたみアイコンに戻ることを確認
      await expect(appPage.getByRole("button", { name: /▶.*Phase 2:/ })).toBeVisible();
    });

    test("2.2 複数フェーズの同時展開", async ({ appPage }) => {
      // Phase 2, 3, 4を順次展開
      await appPage.getByRole("button", { name: /▶.*Phase 2:/ }).click();
      await appPage.getByRole("button", { name: /▶.*Phase 3:/ }).click();
      await appPage.getByRole("button", { name: /▶.*Phase 4:/ }).click();

      // すべて展開されていることを確認
      await expect(appPage.getByRole("button", { name: /▼.*Phase 2:/ })).toBeVisible();
      await expect(appPage.getByRole("button", { name: /▼.*Phase 3:/ })).toBeVisible();
      await expect(appPage.getByRole("button", { name: /▼.*Phase 4:/ })).toBeVisible();

      // ページがスクロール可能であることを確認
      const bodyHeight = await appPage.evaluate(() => document.body.scrollHeight);
      const windowHeight = await appPage.evaluate(() => window.innerHeight);
      expect(bodyHeight).toBeGreaterThan(windowHeight);
    });

    test("2.3 フェーズタイトルの適切性", async ({ appPage }) => {
      // Phase 1が原材料採掘であることを確認
      await expect(appPage.getByText(/原材料採掘/)).toBeVisible();

      // Phase 2のタイトルに生産物名が含まれることを確認
      await expect(appPage.getByText(/Phase 2:.*1次加工/)).toBeVisible();

      // Phase 3のタイトルに中間製品名が含まれることを確認
      await expect(appPage.getByText(/Phase 3:.*2次加工/)).toBeVisible();

      // 最終フェーズに「最終完成品」が含まれることを確認
      await expect(appPage.getByText(/最終完成品/)).toBeVisible();
    });
  });

  test.describe("3. チェックリスト機能", () => {
    test.beforeEach(async ({ appPage }) => {
      await appPage.getByTestId("recipe-button-1801").click();
      await appPage.getByTestId("roadmap-tab").click();
    });

    test("3.1 個別ノードのチェック/アンチェック", async ({ appPage }) => {
      // 初期状態で全体進捗が0%
      await expect(appPage.getByText(/全体進捗:\s*0%/)).toBeVisible();

      // 鉄鉱石ノードをクリック
      const ironOreNode = appPage.getByRole("button", { name: /☐\s*鉄鉱石/ });
      await ironOreNode.click();

      // チェックマークが表示される
      await expect(appPage.getByRole("button", { name: /☑\s*鉄鉱石/ })).toBeVisible();

      // 全体進捗が更新される（0%より大きい）
      const progressText = await appPage.getByText(/全体進捗:\s*\d+%/).innerText();
      const progressMatch = progressText.match(/(\d+)%/);
      expect(progressMatch).toBeTruthy();
      const progress = parseInt(progressMatch![1]);
      expect(progress).toBeGreaterThan(0);

      // フェーズ進捗が更新される
      await expect(appPage.getByText(/1\/2\s*完了/)).toBeVisible();

      // 再度クリックしてチェックを外す
      await appPage.getByRole("button", { name: /☑\s*鉄鉱石/ }).click();

      // チェックマークが消える
      await expect(appPage.getByRole("button", { name: /☐\s*鉄鉱石/ })).toBeVisible();

      // 全体進捗が0%に戻る
      await expect(appPage.getByText(/全体進捗:\s*0%/)).toBeVisible();
    });

    test("3.2 複数ノードの連続チェック", async ({ appPage }) => {
      // 鉄鉱石をチェック
      await appPage.getByRole("button", { name: /☐\s*鉄鉱石/ }).click();

      // 銅鉱石をチェック
      await appPage.getByRole("button", { name: /☐\s*銅鉱石/ }).click();

      // Phase 2を展開
      await appPage.getByRole("button", { name: /▶\s*Phase 2:/ }).click();

      // 磁石をチェック
      await appPage.getByRole("button", { name: /☐\s*磁石/ }).click();

      // 銅インゴットをチェック
      await appPage.getByRole("button", { name: /☐\s*銅インゴット/ }).click();

      // 全体進捗が増加していることを確認
      const progressText = await appPage.getByText(/全体進捗:\s*\d+%/).innerText();
      const progressMatch = progressText.match(/(\d+)%/);
      const progress = parseInt(progressMatch![1]);
      expect(progress).toBeGreaterThanOrEqual(40); // 4/8 = 50%程度

      // Phase 2の進捗を確認
      await expect(appPage.getByText(/2\/3\s*完了/)).toBeVisible();
    });

    test("3.3 フェーズ完了時の動作", async ({ appPage }) => {
      // 原材料採掘フェーズのすべてのノードをチェック
      await appPage.getByRole("button", { name: /☐\s*鉄鉱石/ }).click();
      await appPage.getByRole("button", { name: /☐\s*銅鉱石/ }).click();

      // フェーズ進捗が完了状態になる
      await expect(appPage.getByText(/2\/2\s*完了/)).toBeVisible();

      // 全体進捗が更新されている
      const progressText = await appPage.getByText(/全体進捗:\s*\d+%/).innerText();
      const progressMatch = progressText.match(/(\d+)%/);
      const progress = parseInt(progressMatch![1]);
      expect(progress).toBeGreaterThan(0);
    });

    test("3.4 ノード表示内容の確認", async ({ appPage }) => {
      // 原材料ノードの確認（鉄鉱石）
      const ironOreNode = appPage.getByRole("button", { name: /☐.*鉄鉱石/ }).first();
      const ironOreText = await ironOreNode.innerText();

      // アイテム名、施設タイプ、施設数、採掘速度が含まれる
      expect(ironOreText).toContain("鉄鉱石");
      expect(ironOreText).toContain("高度採掘機");
      expect(ironOreText).toMatch(/×\s*[\d.]+/);
      expect(ironOreText).toMatch(/採掘速度:|[\d.]+\/s/);

      // Phase 2を展開して製造ノードを確認
      await appPage.getByRole("button", { name: /▶.*Phase 2:/ }).click();

      // 磁石ノードを確認（展開されたPhase 2の中から）
      const magnetNode = appPage.getByRole("button", { name: /☐.*磁石.*アーク製錬所/ }).first();
      const magnetText = await magnetNode.innerText();

      // アイテム名、施設タイプ、施設数が含まれる
      expect(magnetText).toContain("磁石");
      expect(magnetText).toMatch(/アーク製錬所|製錬所/);
      expect(magnetText).toMatch(/×\s*[\d.]+/);
    });
  });

  test.describe("4. フェーズ一括操作", () => {
    test.beforeEach(async ({ appPage }) => {
      await appPage.getByTestId("recipe-button-1801").click();
      await appPage.getByTestId("roadmap-tab").click();
    });

    test("4.1 フェーズ内全ノードの一括チェック", async ({ appPage }) => {
      // Phase 2を展開
      await appPage.getByTestId("phase-header-2").click();

      // すべて切替ボタンをクリック（data-testidを使用）
      const toggleAllButton = appPage.getByTestId("phase-toggle-all-2");
      await toggleAllButton.click();

      // 全体進捗が更新される
      const progressText = await appPage.getByText(/全体進捗/).innerText();
      const progressMatch = progressText.match(/(\d+)%/);
      expect(progressMatch).toBeTruthy();
      const progress = parseInt(progressMatch![1]);
      expect(progress).toBeGreaterThan(0);

      // 再度クリックしてすべて外す
      await toggleAllButton.click();

      // 全体進捗が下がることを確認
      const newProgressText = await appPage.getByText(/全体進捗/).innerText();
      const newProgressMatch = newProgressText.match(/(\d+)%/);
      const newProgress = parseInt(newProgressMatch![1]);
      expect(newProgress).toBeLessThan(progress);
    });

    test("4.2 複数フェーズでの一括操作", async ({ appPage }) => {
      // 原材料採掘の一括チェック（data-testidを使用）
      const rawMaterialsToggle = appPage.getByTestId("phase-toggle-all-1");
      await rawMaterialsToggle.click();

      // Phase 2を展開して一括チェック
      await appPage.getByTestId("phase-header-2").click();
      const phase2Toggle = appPage.getByTestId("phase-toggle-all-2");
      await phase2Toggle.click();

      // 全体進捗が更新される
      const progressText = await appPage.getByText(/全体進捗/).innerText();
      const progressMatch = progressText.match(/(\d+)%/);
      const progress = parseInt(progressMatch![1]);
      expect(progress).toBeGreaterThanOrEqual(50); // 複数フェーズチェック済み

      // 各フェーズで一括解除
      await rawMaterialsToggle.click();
      await phase2Toggle.click();

      // 進捗が0に戻る
      const newProgressText = await appPage.getByText(/全体進捗/).innerText();
      expect(newProgressText).toContain("0%");
    });
  });

  test.describe("5. 進捗表示機能", () => {
    test.beforeEach(async ({ appPage }) => {
      await appPage.getByTestId("recipe-button-1801").click();
      await appPage.getByTestId("roadmap-tab").click();
    });

    test("5.1 全体進捗の表示", async ({ appPage }) => {
      // 初期状態: 0%
      await expect(appPage.getByText(/全体進捗:\s*0%/)).toBeVisible();

      // 1ノードチェック
      await appPage.getByRole("button", { name: /☐\s*鉄鉱石/ }).click();

      let progressText = await appPage.getByText(/全体進捗:\s*\d+%/).innerText();
      let progressMatch = progressText.match(/(\d+)%/);
      let progress = parseInt(progressMatch![1]);
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThan(20); // 1/8は約13%

      // さらに3ノードチェック（合計4ノード）
      await appPage.getByRole("button", { name: /☐\s*銅鉱石/ }).click();
      await appPage.getByRole("button", { name: /▶\s*Phase 2:/ }).click();
      await appPage.getByRole("button", { name: /☐\s*磁石/ }).click();
      await appPage.getByRole("button", { name: /☐\s*銅インゴット/ }).click();

      progressText = await appPage.getByText(/全体進捗:\s*\d+%/).innerText();
      progressMatch = progressText.match(/(\d+)%/);
      progress = parseInt(progressMatch![1]);
      expect(progress).toBeGreaterThanOrEqual(40); // 4/8は50%
      expect(progress).toBeLessThanOrEqual(60);
    });

    test("5.2 フェーズ別進捗の表示", async ({ appPage }) => {
      // 原材料採掘フェーズのヘッダーを取得
      const rawMaterialsHeader = appPage.getByRole("button", { name: /▼.*原材料採掘/ });

      // 初期状態（0/X 完了）
      await expect(rawMaterialsHeader).toContainText(/0\/\d+\s*完了/);

      // 1つチェック
      await appPage.getByRole("button", { name: /☐.*鉄鉱石/ }).click();
      await expect(rawMaterialsHeader).toContainText(/1\/\d+\s*完了/);

      // もう1つチェック
      await appPage.getByRole("button", { name: /☐.*銅鉱石/ }).click();
      await expect(rawMaterialsHeader).toContainText(/2\/\d+\s*完了/);

      // Phase 2の進捗を確認
      const phase2Header = appPage.getByRole("button", { name: /▶.*Phase 2:/ });
      await expect(phase2Header).toContainText(/0\/\d+\s*完了/);
    });
  });

  test.describe("6. リセット機能", () => {
    test.beforeEach(async ({ appPage }) => {
      await appPage.getByTestId("recipe-button-1801").click();
      await appPage.getByTestId("roadmap-tab").click();
    });

    test("6.1 全体リセット", async ({ appPage }) => {
      // いくつかのノードをチェック
      await appPage.getByRole("button", { name: /☐.*鉄鉱石/ }).click();
      await appPage.getByRole("button", { name: /☐.*銅鉱石/ }).click();
      await appPage.getByRole("button", { name: /▶.*Phase 2:/ }).click();
      await appPage
        .getByRole("button", { name: /☐.*磁石/ })
        .first()
        .click();

      // 進捗が0%でないことを確認
      let progressText = await appPage.getByText(/全体進捗/).innerText();
      const progressMatch = progressText.match(/(\d+)%/);
      const progress = parseInt(progressMatch![1]);
      expect(progress).toBeGreaterThan(0);

      // 確認ダイアログを自動承認するハンドラーを設定
      appPage.on("dialog", dialog => dialog.accept());

      // すべてリセットボタンをクリック
      const resetButton = appPage.getByRole("button", { name: "すべてリセット" });
      await resetButton.click();

      // 少し待機してリセットが完了するのを待つ
      await appPage.waitForTimeout(100);

      // 進捗が0%に戻る
      progressText = await appPage.getByText(/全体進捗/).innerText();
      expect(progressText).toContain("0%");

      // すべてのノードがチェック解除されている
      await expect(appPage.getByRole("button", { name: /☐.*鉄鉱石/ })).toBeVisible();
      await expect(appPage.getByRole("button", { name: /☐.*銅鉱石/ })).toBeVisible();
    });

    test("6.2 リセット後の再チェック", async ({ appPage }) => {
      // チェック → リセット
      await appPage.getByRole("button", { name: /☐.*鉄鉱石/ }).click();

      // 確認ダイアログを自動承認
      appPage.on("dialog", dialog => dialog.accept());
      await appPage.getByRole("button", { name: "すべてリセット" }).click();
      await appPage.waitForTimeout(100);

      // 再度チェック
      await appPage.getByRole("button", { name: /☐.*鉄鉱石/ }).click();

      // 正常に動作することを確認
      await expect(appPage.getByRole("button", { name: /☑.*鉄鉱石/ })).toBeVisible();

      const progressText = await appPage.getByText(/全体進捗/).innerText();
      const progressMatch = progressText.match(/(\d+)%/);
      const progress = parseInt(progressMatch![1]);
      expect(progress).toBeGreaterThan(0);
    });
  });

  test.describe("7. データ永続化", () => {
    test("7.1 ローカルストレージへの保存とページリロード後の復元", async ({
      appPage,
      reloadPage,
    }) => {
      // 電磁マトリックスを選択
      await appPage.getByTestId("recipe-button-1801").click();
      await appPage.getByTestId("roadmap-tab").click();

      // ロードマップの生成を待つ
      await expect(appPage.getByRole("button", { name: /☐.*鉄鉱石/ })).toBeVisible();

      // ノードをチェック
      await appPage.getByRole("button", { name: /☐.*鉄鉱石/ }).click();
      await appPage.getByRole("button", { name: /☐.*銅鉱石/ }).click();
      await appPage.getByRole("button", { name: /▶.*Phase 2:/ }).click();
      await appPage
        .getByRole("button", { name: /☐.*磁石/ })
        .first()
        .click();

      // 全体進捗を記録
      const beforeReloadProgress = await appPage.getByText(/全体進捗/).innerText();
      const progressMatch = beforeReloadProgress.match(/(\d+)%/);
      const progress = parseInt(progressMatch![1]);

      // 保存のための少し待機 (debounce 500ms)
      await appPage.waitForTimeout(600);

      // ページをリロード
      await reloadPage();

      // ウェルカムモーダルは表示されない（localStorageに保存されているため）
      await expect(appPage.getByTestId("welcome-skip-button")).not.toBeVisible();

      // 電磁マトリックスを再選択
      await appPage.getByTestId("recipe-button-1801").click();
      await appPage.getByTestId("roadmap-tab").click();

      // ロードマップの読み込みと復元を待つ
      await expect(appPage.getByRole("button", { name: /☑.*鉄鉱石/ })).toBeVisible();

      // チェック状態が復元される
      await expect(appPage.getByRole("button", { name: /☑.*銅鉱石/ })).toBeVisible();

      // Phase 2を展開して確認
      await appPage.getByRole("button", { name: /▶.*Phase 2:/ }).click();
      await expect(appPage.getByRole("button", { name: /☑.*磁石/ }).first()).toBeVisible();

      // 全体進捗が同じ
      const afterReloadProgress = await appPage.getByText(/全体進捗/).innerText();
      expect(afterReloadProgress).toContain(`${progress}%`);
    });

    test("7.2 異なるレシピ間でのデータ独立性", async ({ appPage }) => {
      // 電磁マトリックスでチェック
      await appPage.getByTestId("recipe-button-1801").click();
      await appPage.getByTestId("roadmap-tab").click();

      // ロードマップの生成を待つ
      await expect(appPage.getByRole("button", { name: /☐.*鉄鉱石/ })).toBeVisible();
      await appPage.getByRole("button", { name: /☐.*鉄鉱石/ }).click();

      // 保存のための少し待機 (debounce 500ms)
      await appPage.waitForTimeout(600);

      // 構造マトリックスに切り替え
      await appPage.getByTestId("recipe-button-1803").click();
      await appPage.getByTestId("roadmap-tab").click();

      // ロードマップの生成を待つ（構造マトリックス用）
      await appPage.waitForTimeout(100);

      // 構造マトリックスで別のノードをチェック（最初のチェックボックスノード）
      const firstNode = appPage.getByRole("button", { name: /☐/ }).first();
      await firstNode.click();

      // 保存のための少し待機
      await appPage.waitForTimeout(600);

      // 電磁マトリックスに戻る
      await appPage.getByTestId("recipe-button-1801").click();
      await appPage.getByTestId("roadmap-tab").click();

      // ロードマップの復元を待つ
      await expect(appPage.getByRole("button", { name: /☑.*鉄鉱石/ })).toBeVisible();

      // 構造マトリックスに戻る
      await appPage.getByTestId("recipe-button-1803").click();
      await appPage.getByTestId("roadmap-tab").click();

      // 構造マトリックスのチェック状態も保持されている（最低1つはチェック済み）
      await appPage.waitForTimeout(100);
      const checkedNodes = await appPage.getByRole("button", { name: /☑/ }).count();
      expect(checkedNodes).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe("8. UI/UXテスト", () => {
    test.beforeEach(async ({ appPage }) => {
      await appPage.getByTestId("recipe-button-1801").click();
      await appPage.getByTestId("roadmap-tab").click();
    });

    test("8.1 レスポンシブデザイン - デスクトップ", async ({ appPage, setViewport }) => {
      // デスクトップサイズに設定
      await setViewport(1920, 1080);

      // ビューが正しく表示される
      await expect(appPage.getByRole("heading", { name: "建設ロードマップ" })).toBeVisible();

      // すべてのフェーズが表示される
      await expect(appPage.getByText(/原材料採掘/)).toBeVisible();
      await expect(appPage.getByText(/Phase 2:/)).toBeVisible();
    });

    test("8.2 レスポンシブデザイン - タブレット", async ({ appPage, setViewport }) => {
      // タブレットサイズに設定
      await setViewport(768, 1024);

      // ビューが正しく表示される
      await expect(appPage.getByRole("heading", { name: "建設ロードマップ" })).toBeVisible();

      // コンテンツが適切に表示される
      await expect(appPage.getByText(/全体進捗/)).toBeVisible();

      // ボタンがクリック可能
      const ironOreNode = appPage.getByRole("button", { name: /鉄鉱石/ });
      await ironOreNode.click();
      await expect(appPage.getByRole("button", { name: /☑\s*鉄鉱石/ })).toBeVisible();
    });

    test("8.3 視覚的フィードバック", async ({ appPage }) => {
      // ノードをホバー（視覚的変化の確認）
      const ironOreNode = appPage.getByRole("button", { name: /鉄鉱石/ });
      await ironOreNode.hover();

      // クリック時のフィードバック
      await ironOreNode.click();
      await expect(appPage.getByRole("button", { name: /☑\s*鉄鉱石/ })).toBeVisible();

      // フェーズの展開/折りたたみのアニメーション
      const phase2Button = appPage.getByRole("button", { name: /▶\s*Phase 2:/ });
      await phase2Button.click();
      await expect(appPage.getByRole("button", { name: /▼\s*Phase 2:/ })).toBeVisible();
    });
  });

  test.describe("9. エッジケースとエラーハンドリング", () => {
    test("9.1 非常にシンプルなレシピ", async ({ appPage }) => {
      // 鉄インゴット（シンプルなレシピ）を選択
      await appPage.getByTestId("recipe-button-1101").click();
      await appPage.getByTestId("roadmap-tab").click();

      // エラーなく表示される
      await expect(appPage.getByRole("heading", { name: /建設ロードマップ/i })).toBeVisible();

      // シンプルなレシピなのでフェーズ数が少ない（2-3フェーズ程度）
      const phaseButtons = await appPage.getByRole("button", { name: /▶|▼/ }).all();
      // フェーズヘッダーのみをカウント（すべて切替ボタンを除外）
      const phaseHeaders = phaseButtons.filter(async btn => {
        const text = await btn.innerText();
        return text.includes("Phase") || text.includes("原材料採掘");
      });
      expect((await Promise.all(phaseHeaders)).length).toBeLessThanOrEqual(3);

      // 全体進捗が表示される
      await expect(appPage.getByText(/全体進捗/)).toBeVisible();
    });

    test("9.2 非常に複雑なレシピ", async ({ appPage }) => {
      // 宇宙マトリックス（最も複雑）を選択
      await appPage.getByTestId("recipe-button-1806").click();
      await appPage.getByTestId("roadmap-tab").click();

      // エラーなく表示される
      await expect(appPage.getByRole("heading", { name: /建設ロードマップ/i })).toBeVisible();

      // data-testidを使ってフェーズ数を確認（Phase 1は初期展開されている）
      // Phase 2以降のヘッダーをカウント
      let phaseCount = 1; // Phase 1 (原材料採掘) は常に存在
      for (let i = 2; i <= 20; i++) {
        const header = appPage.getByTestId(`phase-header-${i}`);
        if ((await header.count()) > 0) {
          phaseCount++;
        } else {
          break; // フェーズが見つからなくなったら終了
        }
      }
      expect(phaseCount).toBeGreaterThanOrEqual(5);

      // すべてのフェーズを展開してもパフォーマンスが良好
      for (let i = 2; i <= phaseCount; i++) {
        const header = appPage.getByTestId(`phase-header-${i}`);
        if ((await header.count()) > 0) {
          await header.click();
          await appPage.waitForTimeout(100); // 少し待機
        }
      }

      // ビューがスクロール可能であることを確認
      await expect(appPage.getByRole("heading", { name: /建設ロードマップ/i })).toBeVisible();

      // ページが十分な高さを持つことを確認
      const bodyHeight = await appPage.evaluate(() => document.body.scrollHeight);
      const windowHeight = await appPage.evaluate(() => window.innerHeight);
      expect(bodyHeight).toBeGreaterThan(windowHeight);
    });
  });
  test.describe("10. 多言語対応", () => {
    test("10.1 日本語表示", async ({ appPage }) => {
      // 言語が日本語であることを確認
      await appPage.getByTestId("recipe-button-1801").click();
      await appPage.getByTestId("roadmap-tab").click();

      // 日本語のUIテキストが表示される
      await expect(appPage.getByRole("heading", { name: "建設ロードマップ" })).toBeVisible();
      await expect(appPage.getByText(/全体進捗/)).toBeVisible();
      await expect(appPage.getByText(/原材料採掘/)).toBeVisible();
      await expect(appPage.getByRole("button", { name: "すべてリセット" })).toBeVisible();
    });

    test("10.2 英語表示", async ({ appPage }) => {
      // 言語を英語に切り替え
      await appPage.getByTestId("language-menu-trigger").click();
      await appPage.getByTestId("language-menu-item-en").click();

      // レシピを選択して建設ロードマップを開く
      await appPage.getByTestId("recipe-button-1801").click();
      await appPage.getByTestId("roadmap-tab").click();

      // 英語のUIテキストが表示される
      await expect(appPage.getByRole("heading", { name: /Building Roadmap/i })).toBeVisible();
      await expect(appPage.getByText(/Overall Progress/i)).toBeVisible();

      // 日本語に戻す
      await appPage.getByTestId("language-menu-trigger").click();
      await appPage.getByTestId("language-menu-item-ja").click();

      // ロードマップタブを再度開いて確認
      await appPage.getByTestId("roadmap-tab").click();
      await expect(appPage.getByRole("heading", { name: "建設ロードマップ" })).toBeVisible();
    });
  });

  test.describe("11. 統合テスト", () => {
    test("11.1 計算設定変更時の動作", async ({ appPage }) => {
      await appPage.getByTestId("recipe-button-1801").click();
      await appPage.getByTestId("roadmap-tab").click();

      // ノードをチェック
      await appPage.getByRole("button", { name: /☐\s*鉄鉱石/ }).click();

      // 設定を変更（増産剤を変更）
      const proliferatorButtons = await appPage.locator('[data-testid^="proliferator-"]').all();
      if (proliferatorButtons.length > 0) {
        await proliferatorButtons[1].click(); // Mk.I を選択
      }

      // ロードマップを確認
      await appPage.getByTestId("roadmap-tab").click();

      // 破綻していないことを確認
      await expect(appPage.getByRole("heading", { name: "建設ロードマップ" })).toBeVisible();
      await expect(appPage.getByText(/全体進捗/)).toBeVisible();
    });

    test("11.2 タブ切り替え後の状態保持", async ({ appPage }) => {
      await appPage.getByTestId("recipe-button-1801").click();
      await appPage.getByTestId("roadmap-tab").click();

      // ロードマップの生成を待つ
      await expect(appPage.getByRole("button", { name: /☐.*鉄鉱石/ })).toBeVisible();

      // ノードをチェック
      await appPage.getByRole("button", { name: /☐.*鉄鉱石/ }).click();
      await appPage.getByRole("button", { name: /☐.*銅鉱石/ }).click();

      // 保存のための少し待機 (debounce 500ms)
      await appPage.waitForTimeout(600);

      // 他のタブに移動
      await appPage.getByTestId("statistics-tab").click();
      await appPage.getByTestId("production-chain-tab").click();

      // ロードマップタブに戻る
      await appPage.getByTestId("roadmap-tab").click();

      // チェック状態が保持されている
      await expect(appPage.getByRole("button", { name: /☑.*鉄鉱石/ })).toBeVisible();
      await expect(appPage.getByRole("button", { name: /☑.*銅鉱石/ })).toBeVisible();

      // 進捗が保持されている
      const progressText = await appPage.getByText(/全体進捗/).innerText();
      const progressMatch = progressText.match(/(\d+)%/);
      const progress = parseInt(progressMatch![1]);
      expect(progress).toBeGreaterThan(0);
    });
  });
});
