// spec: docs/testing/TEST_PLAN.md
import { expect, test } from "@playwright/test";
import { expectNumberChange } from "./helpers/numeric-asserts";

test.describe("発電設備機能", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/");
    await page.getByTestId("welcome-skip-button").click();
  });

  test("04-01: 発電テンプレートの設備と燃料確認", async ({ page }) => {
    // 電磁タービンを選択して発電タブを開く
    await page.getByTestId("recipe-button-1402").click();
    await page.getByTestId("target-quantity-input").fill("6");
    await page.getByTestId("power-generation-tab").click();

    const mapping: Record<string, { generator: string; fuel: string | null }> = {
      default: { generator: "人工恒星", fuel: "反物質燃料棒" },
      earlyGame: { generator: "地熱発電所", fuel: null },
      midGame: { generator: "地熱発電所", fuel: null },
      lateGame: { generator: "ミニ核融合発電所", fuel: "重水素燃料棒" },
      endGame: { generator: "人工恒星", fuel: "ストレンジ物質対消滅燃料棒" },
    };

    const select = page.getByTestId("power-generation-template-select");

    for (const [tpl, expected] of Object.entries(mapping)) {
      // apply template
      await select.selectOption({ value: tpl });
      // wait for UI to update
      await page.waitForTimeout(200);

      const genName = await page.getByTestId("power-generator-name").innerText();
      expect(genName).toContain(expected.generator);

      const fuelLocator = page.getByTestId("power-fuel-name");
      if (expected.fuel === null) {
        // fuel should not be shown
        expect(await fuelLocator.count()).toBe(0);
      } else {
        // fuel should be shown and match expected text
        await expect(fuelLocator).toBeVisible();
        const fuelName = await fuelLocator.innerText();
        expect(fuelName).toContain(expected.fuel);
      }
    }
  });

  test("04-02: 設備を手動で設定", async ({ page }) => {
    // 1-2. デストロイヤー選択と発電設備タブ
    await page.getByTestId("recipe-button-1705").click();
    await page.getByTestId("power-generation-tab").click();

    const thermalFuels: Record<string, string> = {
      coal: "石炭",
      crudeOil: "原油",
      refinedOil: "精製油",
      energeticGraphite: "高エネルギーグラファイト",
      hydrogen: "水素",
      combustibleUnit: "燃焼ユニット",
      explosiveUnit: "爆発ユニット",
      hydrogenFuelRod: "水素燃料棒",
      crystalExplosiveUnit: "結晶性爆発ユニット",
    };
    const starFuels: Record<string, string> = {
      antimatterFuelRod: "反物質燃料棒",
      strangeAnnihilationFuelRod: "ストレンジ物質対消滅燃料棒",
    };
    const mapping: Record<string, { name: string; fuels: Record<string, string> | null }> = {
      windTurbine: { name: "風力タービン", fuels: null },
      thermalPlant: { name: "火力発電所", fuels: thermalFuels },
      geothermal: { name: "地熱発電所", fuels: null },
      solarPanel: { name: "ソーラーパネル", fuels: null },
      miniFusion: { name: "ミニ核融合発電所", fuels: null },
      artificialStar: { name: "人工恒星", fuels: starFuels },
    };

    // mappingをforループで回して、設備と燃料の組み合わせをテスト
    for (const [plant, { name, fuels }] of Object.entries(mapping)) {
      // 発電設備を選択
      await page.getByTestId(`power-generation-generator-button-${plant}`).click();

      const genName = await page.getByTestId("power-generator-name").innerText();
      expect(genName).toContain(name);

      const fuelLocator = page.getByTestId("power-fuel-name");
      if (fuels === null) {
        if (plant === "miniFusion") {
          const selectedFuelName = await fuelLocator.innerText();
          expect(selectedFuelName).toContain("重水素燃料棒");
        } else {
          expect(await fuelLocator.count()).toBe(0);
        }
      } else {
        // 燃料を順番に選択して確認
        for (const [fuel, fuelName] of Object.entries(fuels)) {
          await page.getByTestId(`power-generation-fuel-button-${fuel}`).click();

          await expect(fuelLocator).toBeVisible();
          const selectedFuelName = await fuelLocator.innerText();
          expect(selectedFuelName).toContain(fuelName);
        }
      }
    }
  });

  test("04-03: 増産剤を設定（火力発電所）", async ({ page }) => {
    // 1-2. デストロイヤー選択/タブ
    await page.getByTestId("recipe-search-input").fill("デストロイヤー");
    await page.getByTestId("recipe-button-1705").click();
    await page.getByTestId("power-generation-tab").click();

    // 3. 火力発電所を選択
    await page.getByTestId("power-generation-generator-button-thermalPlant").click();

    // 4. 燃料を選択
    await page.getByTestId("power-generation-fuel-button-hydrogenFuelRod").click();

    // 5. 増産剤の設定を切り替える
    // 数値チェック: 発電所の出力や消費が変化すること
    const proliferators = ["mk1", "mk2", "mk3"];
    for (const p of proliferators) {
      await expectNumberChange(
        page,
        "power-fuel-consumption",
        async () => {
          await page.getByTestId(`power-generation-proliferator-button-${p}`).click();
        },
        "changed",
        { timeout: 800 }
      );
    }
  });

  test("04-04: 増産剤を設定（人工恒星）", async ({ page }) => {
    // 1-2. デストロイヤー選択/タブ
    await page.getByTestId("recipe-search-input").fill("デストロイヤー");
    await page.getByTestId("recipe-button-1705").click();
    await page.getByTestId("power-generation-tab").click();

    // 3. 人工恒星を選択
    await page.getByTestId("power-generation-generator-button-artificialStar").click();

    // 4. 反物質燃料棒を選択
    await page.getByTestId("power-generation-fuel-button-antimatterFuelRod").click();

    // 数値チェック: 人工恒星の台数や消費が変化することを簡易検証
    const proliferators = ["mk1", "mk2", "mk3"];
    for (const p of proliferators) {
      await expectNumberChange(
        page,
        "power-generator-count",
        async () => {
          await page.getByTestId(`power-generation-proliferator-button-${p}`).click();
        },
        "changed",
        { timeout: 800 }
      );
    }
  });
});
