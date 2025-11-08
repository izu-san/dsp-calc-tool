// spec: docs/testing/TEST_PLAN.md
import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { expectNumberChange, expectOneOfNumbersChange } from "./helpers/numeric-asserts";
// このファイルのいくつかのテストは多数のループや短い待機を含むため、
// デフォルトの 30s を超える可能性があります。安定化のためタイムアウトを延長します。
test.setTimeout(120000);

test.describe("メイン機能の確認", () => {
  test("03-01: Itemsタブのレシピを選択して計算結果が表示される", async ({ appPage }) => {
    // 1. `超磁性リング` を選択する
    await appPage.getByTestId("recipe-button-1502").click();

    // 2. 目標のテキストフィールドに `2` を入力する
    await appPage.getByTestId("target-quantity-input").fill("2");

    // 3. 生産チェーンタブを確認する（パネル内の主要 testid を確認）
    await appPage.getByTestId("production-chain-tab").click();
    // レシピノードと出力/電力表示があること
    await expect(appPage.getByTestId("recipe-node-1502")).toBeVisible();
    await expect(appPage.getByTestId("recipe-output-rate-1502")).toBeVisible();
    await expect(appPage.getByTestId("recipe-power-1502")).toBeVisible();

    // 4. 統計タブを確認する（主要統計カードが存在すること）
    await appPage.getByTestId("statistics-tab").click();
    await expect(appPage.getByTestId("statistics-total-machines")).toBeVisible();
    await expect(appPage.getByTestId("statistics-total-power")).toBeVisible();
    await expect(appPage.getByTestId("statistics-items-produced")).toBeVisible();

    // 5. 建設コストタブを確認する（建設コストのセクションが存在すること）
    await appPage.getByTestId("building-cost-tab").click();
    await expect(appPage.getByTestId("building-cost-production-machines")).toBeVisible();
    await expect(appPage.getByTestId("building-cost-logistics")).toBeVisible();

    // 6. 発電設備タブを確認する（発電設備の要素が存在すること）
    await appPage.getByTestId("power-generation-tab").click();
    await expect(appPage.getByTestId("power-generation-required-power")).toBeVisible();
    await expect(appPage.getByTestId("power-generation-summary")).toBeVisible();

    // 7. 採掘計算機タブを確認する（採掘計算機領域が表示されること）
    await appPage.getByTestId("mining-calculator-tab").click();
    await expect(appPage.getByTestId("miningCalculator")).toBeVisible();
    await expect(appPage.getByTestId("mining-calculator-material-breakdown")).toBeVisible();
  });

  test("03-02: Buildingsタブのレシピを選択して計算結果が表示される", async ({ appPage }) => {
    // 1. Buildingsタブを選択する
    await appPage.getByTestId("buildings-tab").click();

    // 2. `星間物流ステーション` を選択する
    await appPage.getByTestId("recipe-button-2213").click();

    // 3. 目標のテキストフィールドに `1` を入力する
    await appPage.getByTestId("target-quantity-input").fill("1");

    // 4-7. 各タブを確認（パネル内の主要 testid を確認）
    await appPage.getByTestId("production-chain-tab").click();
    // レシピノードと出力/電力表示
    await expect(appPage.getByTestId("recipe-node-2213")).toBeVisible();
    await expect(appPage.getByTestId("recipe-output-rate-2213")).toBeVisible();
    await expect(appPage.getByTestId("recipe-power-2213")).toBeVisible();

    await appPage.getByTestId("statistics-tab").click();
    await expect(appPage.getByTestId("statistics-total-machines")).toBeVisible();
    await expect(appPage.getByTestId("statistics-total-power")).toBeVisible();

    await appPage.getByTestId("building-cost-tab").click();
    await expect(appPage.getByTestId("building-cost-production-machines")).toBeVisible();

    await appPage.getByTestId("power-generation-tab").click();
    await expect(appPage.getByTestId("power-generation-required-power")).toBeVisible();

    // 採掘計算機も確認
    await appPage.getByTestId("mining-calculator-tab").click();
    await expect(appPage.getByTestId("miningCalculator")).toBeVisible();
  });

  test("03-03: 極大値の動作確認", async ({ appPage }) => {
    // 1. `宇宙マトリックス` を選択する
    await appPage.getByTestId("recipe-button-1806").click();

    // 2. 目標のテキストフィールドに `9999999` を入力する
    await appPage.getByTestId("target-quantity-input").fill("9999999");

    // 3-6. 各タブを確認し、異常値がないこと
    await appPage.getByTestId("statistics-tab").click();
    // 統計の主要カードからテキストを取得して異常値がないことを確認
    await expect(appPage.getByTestId("statistics-total-machines")).toBeVisible();

    await expect(appPage.getByTestId("statistics-total-power")).toBeVisible();

    const machinesText = await appPage.getByTestId("statistics-total-machines").innerText();
    const powerText = await appPage.getByTestId("statistics-total-power").innerText();
    const combinedStats = `${machinesText}\n${powerText}`;
    expect(combinedStats).not.toMatch(/NaN|Infinity/);
  });

  test("03-04: 最小値の動作確認", async ({ appPage }) => {
    // 1. `宇宙マトリックス` を選択する
    await appPage.getByTestId("recipe-button-1806").click();

    // 2. 目標のテキストフィールドに `0.1` を入力する
    await appPage.getByTestId("target-quantity-input").fill("0.1");

    // 3-6. 各タブを確認し、異常値がないこと
    await appPage.getByTestId("statistics-tab").click();
    // 統計の主要カードからテキストを取得して異常値がないことを確認
    await expect(appPage.getByTestId("statistics-total-machines")).toBeVisible();

    await expect(appPage.getByTestId("statistics-total-power")).toBeVisible();

    const machinesText2 = await appPage.getByTestId("statistics-total-machines").innerText();
    const powerText2 = await appPage.getByTestId("statistics-total-power").innerText();
    const combinedStats2 = `${machinesText2}\n${powerText2}`;
    expect(combinedStats2).not.toMatch(/NaN|Infinity/);
  });

  test("03-04b: 範囲外の値の動作確認 (0.0001 -> 0.1 に丸められること)", async ({ appPage }) => {
    // 1. `宇宙マトリックス` を選択する
    await appPage.getByTestId("recipe-button-1806").click();

    // 2. 目標のテキストフィールドに `0.0001` を入力する
    await appPage.getByTestId("target-quantity-input").fill("0.0001");

    // 期待値: 目標の値が `0.1` になっていること
    const val = await appPage.getByTestId("target-quantity-input").inputValue();
    expect(parseFloat(val)).toBeGreaterThanOrEqual(0.1);
  });

  test("03-05: 増産剤の設定（追加生産が使えるアイテム）", async ({ appPage }) => {
    // 1. `量子チップ` を選択する
    await appPage.getByTestId("recipe-button-1604").click();

    // 2. 目標のテキストフィールドに `5` を入力する
    await appPage.getByTestId("target-quantity-input").fill("5");

    // 事前: 統計タブを開いて主要要素が見えることを確認
    await appPage.getByTestId("statistics-tab").click();
    await expect(appPage.getByTestId("statistics-total-power")).toBeVisible();

    await expect(appPage.getByTestId("statistics-total-machines")).toBeVisible();

    // 3. 増産剤ランク/モードの全パターンを確認
    // 確認する組み合わせ: mk1/mk2/mk3 x production/speed
    const types = ["mk1", "mk2", "mk3"];
    const modes = ["production", "speed"];

    for (const t of types) {
      for (const m of modes) {
        // 安定化: まず 'none' を選択して基準状態を作る
        await appPage.getByTestId("proliferator-type-button-none").click();

        await appPage.waitForTimeout(150);

        // 期待: 統計（総電力）が UI 更新で変化すること
        // アクション: 目的の type/mode に設定する（これが変更トリガー）
        await expectOneOfNumbersChange(
          appPage,
          ["statistics-total-machines", "statistics-total-power"],
          async () => {
            await appPage.getByTestId(`proliferator-type-button-${t}`).click();
            await appPage.getByTestId(`proliferator-mode-button-${m}`).click();
          },
          "changed",
          { timeout: 2000 }
        );
      }
    }
  });

  test("03-06: 増産剤の設定（追加生産が使えないアイテム）", async ({ appPage }) => {
    // 1. `ストレンジ物質対消滅燃料棒` を選択する
    await appPage.getByTestId("recipe-button-1612").click();

    // 2. 目標のテキストフィールドに `2` を入力する
    await appPage.getByTestId("target-quantity-input").fill("2");
    // 期待値: 「追加生産モードは使用できません」的な表示が出る
    // ここでは増産剤ランクごとに一旦 'none' にしてから speed モードを選ぶことで
    // UI が再計算されることを確認する
    const typesForDisabled = ["mk1", "mk2", "mk3"];
    for (const t of typesForDisabled) {
      // baseline
      await appPage.getByTestId("proliferator-type-button-none").click();

      await appPage.waitForTimeout(150);

      // 選択: タイプ -> モード(speedのみ)
      await appPage.getByTestId(`proliferator-type-button-${t}`).click();

      await appPage.getByTestId("proliferator-mode-button-speed").click();

      // メッセージが表示されること（production が許可されないケースの注意表示）
      await expect(appPage.getByTestId("overclock-not-available-message")).toBeVisible();
    }
  });

  test("03-07: 精錬設備の設定 (鉄インゴット)", async ({ appPage }) => {
    await appPage.getByTestId("recipe-button-1101").click();
    await appPage.getByTestId("target-quantity-input").fill("20");

    // 事前: 統計タブを開いて主要要素が見えることを確認
    await appPage.getByTestId("statistics-tab").click();
    await expect(appPage.getByTestId("statistics-total-power")).toBeVisible();

    await expect(appPage.getByTestId("statistics-total-machines")).toBeVisible();

    // 検証: 各製錬設備ランク（arc / plane / negentropy）を切り替えて再計算が走ることを確認
    const smelterRanks = ["arc", "plane", "negentropy"];
    for (const rank of smelterRanks) {
      // baseline: 別のランクを一旦選択してから目的のランクに切り替えることで確実に再計算させる
      const baseline = smelterRanks.find(r => r !== rank) as string;
      await appPage.getByTestId(`machine-rank-button-smelt-${baseline}`).click();

      await appPage.waitForTimeout(150);

      // アクション: 目的のランクに切り替え
      await expectNumberChange(
        appPage,
        "statistics-total-power",
        async () => {
          await appPage.getByTestId(`machine-rank-button-smelt-${rank}`).click();
        },
        "changed",
        { timeout: 1500 }
      );
    }
  });

  test("03-08: 組立機の設定 (磁気コイル)", async ({ appPage }) => {
    await appPage.getByTestId("recipe-button-1202").click();
    await appPage.getByTestId("target-quantity-input").fill("20");

    // 事前: 統計タブを開いて主要要素が見えることを確認
    await appPage.getByTestId("statistics-tab").click();
    await expect(appPage.getByTestId("statistics-total-power")).toBeVisible();

    await expect(appPage.getByTestId("statistics-total-machines")).toBeVisible();

    // 検証: 各組立機ランク（mk1 / mk2 / mk3 / recomposing）を切り替えて再計算が走ることを確認
    const assemblerRanks = ["mk1", "mk2", "mk3", "recomposing"];
    for (const rank of assemblerRanks) {
      // baseline: 別のランクを一旦選択してから目的のランクに切り替えることで確実に再計算させる
      const baseline = assemblerRanks.find(r => r !== rank) as string;
      await appPage.getByTestId(`machine-rank-button-assemble-${baseline}`).click();

      await appPage.waitForTimeout(150);

      // アクション: 目的のランクに切り替え
      await expectNumberChange(
        appPage,
        "statistics-total-power",
        async () => {
          await appPage.getByTestId(`machine-rank-button-assemble-${rank}`).click();
        },
        "changed",
        { timeout: 1500 }
      );
    }
  });

  test("03-09: 化学プラントの設定 (プラスチック)", async ({ appPage }) => {
    await appPage.getByTestId("recipe-button-1109").click();
    await appPage.getByTestId("target-quantity-input").fill("20");

    // 事前: 統計タブを開いて主要要素が見えることを確認
    await appPage.getByTestId("statistics-tab").click();
    await expect(appPage.getByTestId("statistics-total-power")).toBeVisible();

    await expect(appPage.getByTestId("statistics-total-machines")).toBeVisible();

    // 検証: 化学プラントのランク（standard / quantum）を切り替えて再計算が走ることを確認
    const chemicalRanks = ["standard", "quantum"];
    for (const rank of chemicalRanks) {
      // baseline: 別のランクを一旦選択してから目的のランクに切り替えることで確実に再計算させる
      const baseline = chemicalRanks.find(r => r !== rank) as string;
      await appPage.getByTestId(`machine-rank-button-chemical-${baseline}`).click();

      await appPage.waitForTimeout(150);

      // アクション: 目的のランクに切り替え
      await expectNumberChange(
        appPage,
        "statistics-total-power",
        async () => {
          await appPage.getByTestId(`machine-rank-button-chemical-${rank}`).click();
        },
        "changed",
        { timeout: 1500 }
      );
    }
  });

  test("03-10: マトリックスラボの設定 (情報マトリックス)", async ({ appPage }) => {
    await appPage.getByTestId("recipe-button-1804").click();
    await appPage.getByTestId("target-quantity-input").fill("10");

    // 事前: 統計タブを開いて主要要素が見えることを確認
    await appPage.getByTestId("statistics-tab").click();
    await expect(appPage.getByTestId("statistics-total-power")).toBeVisible();

    await expect(appPage.getByTestId("statistics-total-machines")).toBeVisible();

    // 検証: マトリックスラボのランク（standard / self-evolution）を切り替えて再計算が走ることを確認
    const researchRanks = ["standard", "self-evolution"];
    for (const rank of researchRanks) {
      // baseline: 別のランクを一旦選択してから目的のランクに切り替えることで確実に再計算させる
      const baseline = researchRanks.find(r => r !== rank) as string;
      await appPage.getByTestId(`machine-rank-button-research-${baseline}`).click();

      await appPage.waitForTimeout(150);

      // アクション: 目的のランクに切り替え
      await expectNumberChange(
        appPage,
        "statistics-total-machines",
        async () => {
          await appPage.getByTestId(`machine-rank-button-research-${rank}`).click();
        },
        "changed",
        { timeout: 1500 }
      );
    }
  });

  test("03-11: コンベアベルトの設定 (重力マトリックス)", async ({ appPage }) => {
    await appPage.getByTestId("recipe-button-1805").click();
    await appPage.getByTestId("target-quantity-input").fill("30");

    // 生産チェーンを開いてレシピノードを確認
    await appPage.getByTestId("production-chain-tab").click();
    await expect(appPage.getByTestId("recipe-node-1805")).toBeVisible();

    // テストするベルト設定の組み合わせ
    const combos = [
      { tier: "mk1", stack: "1" },
      { tier: "mk2", stack: "1" },
      { tier: "mk3", stack: "1" },
      { tier: "mk3", stack: "2" },
      { tier: "mk3", stack: "3" },
      { tier: "mk3", stack: "4" },
    ];

    for (const combo of combos) {
      // baseline: 別の組み合わせを先に選んでから目的の組み合わせを選択して確実に差分を作る
      const baseline = combos.find(
        c => c.tier !== combo.tier || c.stack !== combo.stack
      ) as typeof combo;
      await appPage.getByTestId(`conveyor-belt-button-${baseline.tier}`).click();

      await appPage.getByTestId(`conveyor-belt-stack-button-${baseline.stack}`).click();

      await appPage.waitForTimeout(150);

      // 期待: レシピノードのベルト合計数が変化すること
      await expectNumberChange(
        appPage,
        `recipe-belts-total-1805`,
        async () => {
          await appPage.getByTestId(`conveyor-belt-button-${combo.tier}`).click();
          await appPage.getByTestId(`conveyor-belt-stack-button-${combo.stack}`).click();
        },
        "changed",
        { timeout: 1500 }
      );
    }
  });

  test("03-12: Production Tree の展開/折り畳み", async ({ appPage }) => {
    await appPage.getByTestId("recipe-button-1405").click();
    await appPage.getByTestId("target-quantity-input").fill("3");

    // 期待: デフォルトのボタンテキストは「すべて展開」であること
    const toggle = appPage.getByTestId("expand-collapse-all-button");
    await expect(toggle).toHaveText("▼すべて展開");

    // クリック -> テキストが「すべて折りたたむ」に切り替わる
    await toggle.click();
    await expect(toggle).toHaveText("▼すべて折りたたむ");

    // 再クリック -> 元の「すべて展開」に戻る
    await toggle.click();
    await expect(toggle).toHaveText("▼すべて展開");
  });

  test("03-13: Production Tree の展開/折り畳み状態の維持", async ({ appPage }) => {
    await appPage.getByTestId("recipe-button-1405").click();
    await appPage.getByTestId("target-quantity-input").fill("3");

    // NOTE: 意図的に.first()を使用 - 同じアイテムが複数の階層に表示されるため
    await expect(appPage.getByTestId("raw-material-node-1006").first()).toBeHidden();
    await appPage.getByTestId("expand-collapse-all-button").click();
    await expect(appPage.getByTestId("raw-material-node-1006").first()).toBeVisible();

    // 設備の設定を変更
    await appPage.getByTestId("proliferator-type-button-mk2").click();
    await appPage.getByTestId("machine-rank-button-smelt-plane").click();
    await appPage.getByTestId("machine-rank-button-assemble-mk2").click();
    await appPage.getByTestId("machine-rank-button-chemical-quantum").click();
    await appPage.getByTestId("machine-rank-button-research-self-evolution").click();

    // 期待: 展開状態が維持されている
    await expect(appPage.getByTestId("raw-material-node-1006").first()).toBeVisible();
  });

  test("03-14: 代替レシピの表示 (粒子ブロードバンド)", async ({ appPage }) => {
    await appPage.getByTestId("recipe-button-1503").click();
    // 期待: 代替レシピが表示される
    await expect(appPage.getByTestId("alternative-recipe-selector")).toBeVisible();
  });

  test("03-15: 代替レシピが存在しないレシピの確認 (鉄インゴット)", async ({ appPage }) => {
    await appPage.getByTestId("recipe-button-1101").click();
    await expect(appPage.getByTestId("alternative-recipe-selector")).toBeHidden();
  });

  test("03-16: 代替レシピの比較 (ダイソンスフィアの部品 / グラフェン)", async ({ appPage }) => {
    await appPage.getByTestId("recipe-button-1511").click();

    // 現在のグラフェンは通常レシピであること
    await appPage.getByTestId("expand-collapse-all-button").click();
    // NOTE: 意図的に.first()を使用 - 同じレシピノードが複数表示される可能性があるため
    await expect(appPage.getByTestId("recipe-node-1108").first()).toBeVisible();

    // 比較ボタンを開く
    await appPage.getByTestId("alternative-recipe-compare-button-1123").click();
    await appPage.getByTestId("recipe-comparison-select-button-1208").click();

    // 期待: 生産チェーンに反映される
    await appPage.getByTestId("expand-collapse-all-button").click();
    // NOTE: 意図的に.first()を使用 - 同じレシピノードが複数表示される可能性があるため
    await expect(appPage.getByTestId("recipe-node-1208").first()).toBeVisible();
  });

  test("03-17: レシピ検索機能 (鉄 -> 鋼鉄)", async ({ appPage }) => {
    await appPage.getByTestId("recipe-search-input").fill("鉄");
    // 追加: 検索結果の件数表示は data-testid 'recipe-search-results-count' を使用
    // 期待: 件数テキストに「49 レシピ 見つかりました」が含まれること
    await expect(appPage.getByTestId("recipe-search-results-count")).toHaveText(
      /49 レシピ 見つかりました/
    );

    await appPage.getByTestId("recipe-button-1301").click();
    await expect(appPage.getByTestId("recipe-node-1301")).toBeVisible();
  });

  test("03-18: お気に入り機能 (チタンインゴット)", async ({ appPage }) => {
    await appPage.getByTestId("favorite-button-1104").click();

    // お気に入りカテゴリで確認
    await appPage.getByTestId("favorites-toggle-button").click();
    await expect(appPage.getByTestId("favorites-toggle-button")).toHaveText(/1/);

    // リロードして永続性を確認
    await appPage.reload();
    await expect(appPage.getByTestId("favorites-toggle-button")).toHaveText(/1/);
  });

  test("03-19: 生産チェーンの電力表示 (エネルギーマトリックス)", async ({ appPage }) => {
    await appPage.getByTestId("recipe-button-1802").click();
    await appPage.getByTestId("target-quantity-input").fill("10");
    await appPage.getByTestId("statistics-tab").click();

    // 電力グラフの確認
    await appPage.getByTestId("statistics-show-power-graph-button").click();
    await expect(appPage.getByTestId("power-graph-total-consumption")).toBeVisible();

    // 統計タブの電力を取得
    const totalPowerText = await appPage
      .getByTestId("statistics-production-overview-total-power")
      .innerText();
    const totalPowerTextInGraph = await appPage
      .getByTestId("power-graph-total-consumption-value")
      .innerText();

    // 発電タブの電力を取得
    await appPage.getByTestId("power-generation-tab").click();
    const requiredPowerText = await appPage
      .getByTestId("power-generation-required-power-value")
      .innerText();

    // 期待: 統計タブと発電タブの電力が一致すること
    expect(totalPowerText).toBe(requiredPowerText);

    // 期待: 統計タブと電力グラフの電力が一致すること
    expect(totalPowerText).toBe(totalPowerTextInGraph);
  });

  test("03-20: 生産チェーンの電力表示：増産剤あり", async ({ appPage }) => {
    await appPage.getByTestId("recipe-button-1802").click();
    await appPage.getByTestId("target-quantity-input").fill("10");
    await appPage.getByTestId("proliferator-type-button-mk3").click();

    await appPage.getByTestId("statistics-tab").click();

    // 電力グラフの確認
    await appPage.getByTestId("statistics-show-power-graph-button").click();
    await expect(appPage.getByTestId("power-graph-total-consumption")).toBeVisible();

    // 統計タブの電力を取得
    const totalPowerText = await appPage
      .getByTestId("statistics-production-overview-total-power")
      .innerText();
    const totalPowerTextInGraph = await appPage
      .getByTestId("power-graph-total-consumption-value")
      .innerText();

    // 発電タブの電力を取得
    await appPage.getByTestId("power-generation-tab").click();
    const requiredPowerText = await appPage
      .getByTestId("power-generation-required-power-value")
      .innerText();

    // 期待: 統計タブと発電タブの電力が一致すること
    expect(totalPowerText).toBe(requiredPowerText);

    // 期待: 統計タブと電力グラフの電力が一致すること
    expect(totalPowerText).toBe(totalPowerTextInGraph);
  });

  test("03-21: 採掘計算機の設定 (チタンインゴット)", async ({ appPage }) => {
    // チタンインゴットを選択して採掘計算機を開く
    await appPage.getByTestId("recipe-button-1104").click();
    await appPage.getByTestId("target-quantity-input").fill("6");
    await appPage.getByTestId("mining-calculator-tab").click();

    // 採掘速度研究(%) の操作確認（input の値が変わること）
    const researchInput = appPage.getByTestId("mining-speed-bonus-input");
    const beforeResearch = await researchInput.inputValue();
    // increase ボタンで値を上げる
    await appPage.getByTestId("mining-speed-bonus-increase-button").click();
    // small wait for UI update
    await appPage.waitForTimeout(150);
    const afterResearch = await researchInput.inputValue();
    expect(afterResearch).not.toBe(beforeResearch);

    // decrease ボタンで値が下がることを確認
    const beforeIncVal = parseFloat(afterResearch);
    await appPage.getByTestId("mining-speed-bonus-decrease-button").click();
    await appPage.waitForTimeout(150);
    const afterDecrease = await researchInput.inputValue();
    expect(parseFloat(afterDecrease)).toBeLessThan(beforeIncVal);

    // input に直接入力できること
    await researchInput.fill("150");
    // blur を発生させて UI 側で反映されるようにする
    await appPage.getByTestId("miningCalculator").click();
    await appPage.waitForTimeout(150);
    const afterFill = await researchInput.inputValue();
    expect(parseFloat(afterFill)).toBe(150);

    // 作業速度スライダーの操作確認
    // まず "採掘機" を選んだ場合は無効であることを確認
    await appPage.getByTestId("mining-machine-type-select").selectOption({ label: "採掘機" });
    await expect(appPage.getByTestId("mining-work-speed-slider")).toBeDisabled();

    // 次に "高度採掘機" を選んでスライダーが有効になり操作できることを確認
    await appPage.getByTestId("mining-machine-type-select").selectOption({ label: "高度採掘機" });
    const slider = appPage.getByTestId("mining-work-speed-slider");
    await expect(slider).toBeEnabled();

    // 現在値を読み取り、異なる値に変更して反映を確認する
    const currentSliderVal = await slider.evaluate((el: HTMLInputElement) => el.value);
    // choose a new value that is different (if 200 -> set 210, else set 200)
    const newVal = currentSliderVal === "200" ? "210" : "200";
    await slider.evaluate((el: HTMLInputElement, v: string) => {
      el.value = v;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, newVal);
    await appPage.waitForTimeout(200);
    const changedSliderVal = await slider.evaluate((el: HTMLInputElement) => el.value);
    expect(changedSliderVal).toBe(newVal);
  });

  test("03-22: ノード個別設定のオーバーライド (電磁タービン)", async ({ appPage }) => {
    await appPage.getByTestId("recipe-button-1402").click();
    await appPage.getByTestId("target-quantity-input").fill("6");

    // 任意のノードでオーバーライド
    // NOTE: 意図的に.first()を使用 - ツリー内の最初のカスタム設定トグルを操作
    await appPage.getByTestId("custom-settings-toggle").first().click();
    await appPage.getByTestId("proliferator-type-select").selectOption({ label: "Mk.II" });
    await appPage.getByTestId("proliferator-mode-production").click();
    await appPage.getByTestId("machine-rank-select").selectOption({ label: "組立機 Mk.II" });

    // 期待: 該当ノードのみがオーバーライドされる
    await expect(appPage.getByTestId("machine-badge-1402")).toHaveText("🏭 組立機 Mk.II");
    await expect(appPage.getByTestId("proliferator-badge-1402")).toHaveText("🧪 MK2 · 生産");
  });

  test("03-23: 臨界光子生成機能が必要なレシピ (宇宙マトリックス)", async ({ appPage }) => {
    await appPage.getByTestId("recipe-button-1806").click();
    await appPage.getByTestId("expand-collapse-all-button").click();

    // 重力子レンズノードの数が1であること
    const gravityLensNodes = appPage.getByTestId("recipe-node-1405");
    await expect(gravityLensNodes).toHaveCount(1);

    // 期待: 光子生成設定エリアが表示される
    await expect(appPage.getByTestId("photon-generation-settings-section")).toBeVisible();

    // 設定画面で重力子レンズや増産剤を変える
    await appPage.getByTestId("photon-generation-graviton-lens-checkbox").check();
    await appPage.getByTestId("photon-generation-proliferator-button-mk3").click();
    await appPage
      .getByTestId("photon-generation-ray-transmission-efficiency-slider")
      .evaluate((el: HTMLInputElement) => {
        el.value = "45";
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });

    // 重力子レンズのノード数が2であること
    await expect(gravityLensNodes).toHaveCount(2);
  });

  test("03-24: 臨界光子生成機能が不要なレシピ (電磁タービン)", async ({ appPage }) => {
    await appPage.getByTestId("recipe-button-1402").click();
    await expect(appPage.getByTestId("photon-generation-settings-section")).toBeHidden();
  });

  test("03-25: 複数出力レシピの表示 (X線クラッキング)", async ({ appPage }) => {
    await appPage.getByTestId("recipe-button-1207").click();

    await expect(appPage.getByTestId("multiple-output-items-section")).toBeVisible();
    await expect(appPage.getByTestId("output-item-1120")).toBeVisible();
    await expect(appPage.getByTestId("output-item-1109")).toBeVisible();

    await appPage.getByTestId("statistics-tab").click();
    await expect(appPage.getByTestId("statistics-final-products-table")).toBeVisible();
    // final products table の行数が 2 つであることを確認
    const finalRows = appPage.getByTestId("statistics-final-products-table").locator("tbody tr");
    await expect(finalRows).toHaveCount(2);
  });

  test("03-26: レシピ再選択時の生産チェーン維持 (銅インゴット)", async ({ appPage }) => {
    await appPage.getByTestId("recipe-button-1102").click();
    await expect(appPage.getByTestId("recipe-node-1102")).toBeVisible();
    // 再選択
    await appPage.getByTestId("recipe-button-1102").click();
    await expect(appPage.getByTestId("recipe-node-1102")).toBeVisible();
  });

  test("03-27: テンプレート機能 (電磁タービン)", async ({ appPage }) => {
    await appPage.getByTestId("recipe-button-1402").click();
    // テンプレートを順に適用
    const templates = ["earlyGame", "midGame", "lateGame", "endGame", "powerSaver"];
    for (const t of templates) {
      await appPage.getByTestId(`template-button-${t}`).click();
      await appPage.getByTestId("template-confirm-apply-button").click();
    }
    await expect(appPage.getByTestId("recipe-node-1402")).toBeVisible();
  });

  test("03-28: ソーターのランク設定", async ({ appPage }) => {
    await appPage.getByTestId("recipe-button-1402").click();
    // ソーターのランクごとに生産チェーン内と統計の電力が再計算されることを検証
    const sorterRanks = ["mk1", "mk2", "mk3", "pile"];

    for (const rank of sorterRanks) {
      // baseline: 別のランクを一旦選択してから目的のランクを選択して確実に差分を作る
      const baseline = sorterRanks.find(r => r !== rank) as string;
      await appPage.getByTestId(`sorter-button-${baseline}`).click();
      await appPage.waitForTimeout(150);

      // アクション: 目的のランクに切り替え
      await expectNumberChange(
        appPage,
        "recipe-power-sorters-1402",
        async () => {
          await appPage.getByTestId(`sorter-button-${rank}`).click();
        },
        "changed",
        { timeout: 1500 }
      );
    }
  });
});
