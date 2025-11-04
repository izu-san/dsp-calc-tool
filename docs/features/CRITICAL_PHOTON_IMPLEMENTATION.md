# 臨界光子生成機能の実装計画

**Issue**: [#73 臨界光子を計算できるようにする](https://github.com/izu-san/dsp-calc-tool/issues/73)  
**作成日**: 2025-10-26  
**ステータス**: 計画中

## 概要

Ray Receiver（γ線レシーバー）による臨界光子生成機能を実装する。臨界光子は特殊な生成方法を持ち、ダイソンスフィアからの電力受信が必要となる。

## 仕様要件

### 確認済み要件

1. **臨界光子の扱い**: 臨界光子用の特殊な「Ray Receiver（光子生成モード）」レシピを作成し、通常の生産チェーンに組み込む
2. **重力子レンズの増産剤**: 別途専用の設定UIを用意する
3. **ダイソンスフィア電力の表示**: 通常の電力消費とは別項目として表示する
4. **連続受信率**: 固定で100%として扱う（Issue記載通り）
5. **発電機能**: 無視し、光子生成機能のみを扱う
6. **Recipe Type**: 新しい Type として 'PhotonGeneration' を追加
7. **重力子レンズの消費**: 生産チェーンに組み込む（1機あたり毎分0.1個消費）
8. **データファイル**: XMLファイルは変更せず、コード内で定数として定義する

## 実装仕様

### 1. データ構造の拡張

#### 1.1 Recipe Type に 'PhotonGeneration' を追加

**ファイル**: `src/types/game-data.ts`

```typescript
export interface Recipe {
  SID: number;
  name: string;
  Type: "Smelt" | "Assemble" | "Chemical" | "Research" | "Refine" | "Particle" | "PhotonGeneration";
  // ... 他のプロパティ
}
```

#### 1.2 臨界光子レシピの定数定義

**ファイル**: `src/constants/photonGeneration.ts`（新規作成）

臨界光子生成のレシピと機械データを定義する：

- **Ray Receiver（光子生成モード）のレシピ**
  - SID: -9001（既存レシピと被らない番号、ゲーム側が負の値は使用しないと仮定）
  - Type: 'PhotonGeneration'
  - 出力: 臨界光子（ID: 1208）
  - productive: true（増産剤を適用可能）
- **Ray Receiver（機械データ）**
  - id: 2208
  - assemblerSpeed: 10000（基準値100%）
  - workEnergyPerTick: 0（ダイソンスフィア電力を別計算するため）
  - idleEnergyPerTick: 0
  - exchangeEnergyPerTick: 0
  - isPowerConsumer: false（通常電力は消費しない）
  - isPowerExchanger: true（ダイソンスフィアと電力交換）

**重力子レンズ消費**:

- 0.1個/分（Ray Receiver 1機あたり固定）
- 重力子レンズ ID: 1209

#### 1.3 グローバル設定の拡張

**ファイル**: `src/types/settings/photonGeneration.ts`（新規作成）

```typescript
import type { ProliferatorConfig } from "./proliferator";

export interface PhotonGenerationSettings {
  useGravitonLens: boolean; // 重力子レンズを使用するか
  gravitonLensProliferator: ProliferatorConfig; // 重力子レンズへの増産剤
  solarEnergyLossResearch: number; // 太陽光線エネルギー損失の研究レベル (0-10000)
  continuousReception: number; // 連続受信率（固定100%）
}

// デフォルト設定
export const DEFAULT_PHOTON_GENERATION_SETTINGS: PhotonGenerationSettings = {
  useGravitonLens: false,
  gravitonLensProliferator: {
    type: "none",
    mode: "speed",
    speedBonus: 0,
    productionBonus: 0,
    powerMultiplier: 1,
  },
  solarEnergyLossResearch: 0,
  continuousReception: 100, // 固定100%
};
```

**ファイル**: `src/types/settings/index.ts`

```typescript
export interface GlobalSettings {
  // ... 既存のプロパティ
  photonGeneration: PhotonGenerationSettings;
}
```

#### 1.4 電力計算の拡張

**ファイル**: `src/types/calculation.ts`

```typescript
export interface PowerConsumption {
  machines: number; // 通常の機械電力 (kW)
  sorters: number; // ソーター電力 (kW)
  dysonSphere: number; // ダイソンスフィア電力 (kW) - 新規追加
  total: number; // 合計（dysonSphere含む）
}
```

### 2. 計算ロジックの実装

#### 2.1 臨界光子生成の電力計算

**ファイル**: `src/lib/photonGenerationCalculation.ts`（新規作成）

##### 太陽光線エネルギー損失の計算

```typescript
/**
 * 太陽光線エネルギー損失(基礎)を計算する
 * @param researchLevel 研究レベル (0-10000)
 * @returns 損失率 (0-1の範囲)
 */
export function calculateSolarEnergyLoss(researchLevel: number): number {
  const LOSS_TABLE = [
    70.0, // Lv 0
    63.0, // Lv 1
    56.7, // Lv 2
    51.03, // Lv 3
    45.93, // Lv 4
    41.33, // Lv 5
    37.2, // Lv 6
    31.62, // Lv 7
  ];

  if (researchLevel <= 6) {
    return LOSS_TABLE[researchLevel] / 100;
  }

  // Lv 7以降: 31.62 * 0.85^(Lv-7) %
  const loss = 31.62 * Math.pow(0.85, researchLevel - 7);
  return loss / 100;
}
```

##### 受信効率の計算

```typescript
/**
 * 受信効率を計算する
 * @param solarEnergyLoss 太陽光線エネルギー損失(基礎) (0-1)
 * @param continuousReception 連続受信率 (0-100)
 * @returns 受信効率 (0-1の範囲)
 */
export function calculateReceptionEfficiency(
  solarEnergyLoss: number,
  continuousReception: number
): number {
  // 受信効率 = 100% - 太陽光線エネルギー損失(基礎) × (1 - 0.4 × 連続受信)
  return 1 - solarEnergyLoss * (1 - 0.4 * (continuousReception / 100));
}
```

##### 理論電力と生成量のテーブル

```typescript
export interface PhotonGenerationRate {
  theoreticalPower: number; // MW (理論値)
  productionRate: number; // 個/秒
}

/**
 * 臨界光子生成の理論電力と生成量を取得する
 * @param useGravitonLens 重力子レンズを使用するか
 * @param continuousReception 連続受信率 (0-100)
 * @param proliferatorSpeedBonus 増産剤の速度ボーナス (0-1)
 * @returns 理論電力と生成量
 */
export function getPhotonGenerationRate(
  useGravitonLens: boolean,
  continuousReception: number,
  proliferatorSpeedBonus: number
): PhotonGenerationRate {
  const isHighReception = continuousReception >= 100;

  let theoreticalPower: number;
  let baseProductionRate: number;

  if (!useGravitonLens) {
    theoreticalPower = isHighReception ? 120 : 48.0; // MW
    baseProductionRate = isHighReception ? 0.1 : 0.04; // 個/秒
  } else {
    theoreticalPower = isHighReception ? 240 : 96.0; // MW
    baseProductionRate = isHighReception ? 0.2 : 0.08; // 個/秒
  }

  // 増産剤の効果を適用（速度上昇）
  const speedMultiplier = 1 + proliferatorSpeedBonus;
  theoreticalPower *= speedMultiplier;
  baseProductionRate *= speedMultiplier;

  return { theoreticalPower, productionRate: baseProductionRate };
}
```

##### 実際の要求電力の計算

```typescript
/**
 * ダイソンスフィアから必要な電力を計算する
 * @param theoreticalPower 理論電力 (MW)
 * @param receptionEfficiency 受信効率 (0-1)
 * @returns 要求電力 (kW)
 */
export function calculateRequiredPower(
  theoreticalPower: number,
  receptionEfficiency: number
): number {
  // 要求電力 = 理論電力 / 受信効率
  const requiredPowerMW = theoreticalPower / receptionEfficiency;
  return requiredPowerMW * 1000; // MW -> kW
}
```

#### 2.2 機械配置マッピングの拡張

**ファイル**: `src/constants/machines.ts`

```typescript
export const MACHINE_IDS_BY_RECIPE_TYPE: Record<Recipe["Type"], number[]> = {
  // ... 既存の設定
  PhotonGeneration: [2208], // Ray Receiver
};
```

#### 2.3 Calculator の拡張

**ファイル**: `src/lib/calculator/tree-builder.ts`

PhotonGeneration レシピの処理を追加：

1. Ray Receiver ノードの場合、ダイソンスフィア電力を計算
2. 重力子レンズを使用する場合、インプットに追加（0.1個/分 × 機械数）

```typescript
// buildRecipeTree 関数内に追加
if (recipe.Type === "PhotonGeneration") {
  // 光子生成の電力計算
  const photonSettings = settings.photonGeneration;

  // 重力子レンズを使用する場合、インプットに追加
  if (photonSettings.useGravitonLens) {
    const gravitonLensRate = (0.1 / 60) * machineCount; // 0.1個/分 -> 個/秒
    inputs.push({
      itemId: 1209, // 重力子レンズ
      itemName: "Graviton Lens", // ローカライズ後に取得
      requiredRate: gravitonLensRate,
    });
  }
}
```

**ファイル**: `src/lib/calculator/power-calculation.ts`

`calculateMachinePower` を修正し、PhotonGeneration の場合にダイソンスフィア電力を計算：

```typescript
export function calculateMachinePower(
  machine: Machine,
  machineCount: number,
  proliferator: ProliferatorConfig,
  proliferatorMultiplier: { production: number; speed: number },
  recipeType?: Recipe["Type"],
  photonSettings?: PhotonGenerationSettings
): { normal: number; dysonSphere: number } {
  // PhotonGeneration の場合
  if (recipeType === "PhotonGeneration" && photonSettings) {
    const solarLoss = calculateSolarEnergyLoss(photonSettings.solarEnergyLossResearch);
    const efficiency = calculateReceptionEfficiency(solarLoss, photonSettings.continuousReception);

    const speedBonus = proliferator.speedBonus * proliferatorMultiplier.speed;
    const rateData = getPhotonGenerationRate(
      photonSettings.useGravitonLens,
      photonSettings.continuousReception,
      speedBonus
    );

    const requiredPower = calculateRequiredPower(rateData.theoreticalPower, efficiency);

    return {
      normal: 0, // 通常電力は消費しない
      dysonSphere: requiredPower * machineCount,
    };
  }

  // 既存の処理
  // ...
}
```

#### 2.4 集計処理の拡張

**ファイル**: `src/lib/calculator/aggregations.ts`

`calculateTotalPower` を修正し、ダイソンスフィア電力を集計：

```typescript
export function calculateTotalPower(rootNode: RecipeTreeNode): PowerConsumption {
  let totalMachines = 0;
  let totalSorters = 0;
  let totalDysonSphere = 0;

  function traverse(node: RecipeTreeNode) {
    totalMachines += node.power.machines;
    totalSorters += node.power.sorters;
    totalDysonSphere += node.power.dysonSphere || 0; // 新規追加

    node.children.forEach(child => traverse(child));
  }

  traverse(rootNode);

  return {
    machines: totalMachines,
    sorters: totalSorters,
    dysonSphere: totalDysonSphere,
    total: totalMachines + totalSorters + totalDysonSphere,
  };
}
```

### 3. UI の実装

#### 3.1 設定パネルへの追加

**ファイル**: `src/components/SettingsPanel/PhotonGenerationSettings.tsx`（新規作成）

```tsx
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../stores/settingsStore";
import { PROLIFERATOR_DATA } from "../../types/settings";

export function PhotonGenerationSettings() {
  const { t } = useTranslation();
  const { settings, setPhotonGenerationSetting } = useSettingsStore();
  const { photonGeneration } = settings;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("photonGeneration")}</h3>

      {/* 重力子レンズの使用 */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={photonGeneration.useGravitonLens}
          onChange={e => setPhotonGenerationSetting("useGravitonLens", e.target.checked)}
        />
        <span>{t("useGravitonLens")}</span>
      </label>

      {/* 重力子レンズへの増産剤 */}
      {photonGeneration.useGravitonLens && (
        <div>
          <label className="text-sm font-medium">{t("gravitonLensProliferator")}</label>
          {/* ProliferatorSelector コンポーネントを使用 */}
        </div>
      )}

      {/* 太陽光線エネルギー損失研究レベル */}
      <div>
        <label className="text-sm font-medium">
          {t("solarEnergyLossResearch")}: Lv {photonGeneration.solarEnergyLossResearch}
        </label>
        <input
          type="range"
          min="0"
          max="10000"
          value={photonGeneration.solarEnergyLossResearch}
          onChange={e =>
            setPhotonGenerationSetting("solarEnergyLossResearch", Number(e.target.value))
          }
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          {t("solarEnergyLoss")}:{" "}
          {(calculateSolarEnergyLoss(photonGeneration.solarEnergyLossResearch) * 100).toFixed(2)}%
        </p>
      </div>

      {/* 注意事項 */}
      <p className="text-xs text-yellow-600">{t("continuousReception")}: 100% (固定)</p>
    </div>
  );
}
```

**ファイル**: `src/components/SettingsPanel/index.tsx`

PhotonGenerationSettings を追加：

```tsx
import { PhotonGenerationSettings } from "./PhotonGenerationSettings";

export function SettingsPanel() {
  // ...
  return (
    <div className="space-y-4">
      {/* ... 既存の設定 */}

      {/* 光子生成設定 */}
      <PhotonGenerationSettings />
    </div>
  );
}
```

#### 3.2 電力表示の拡張

**ファイル**: `src/components/StatisticsView/index.tsx`

通常電力とダイソンスフィア電力を分けて表示：

```tsx
<div className="space-y-2">
  <div>
    <span className="font-semibold">{t("normalPower")}:</span>
    <span>{formatNumber(totalPower.machines + totalPower.sorters)} kW</span>
  </div>

  {totalPower.dysonSphere > 0 && (
    <div className="text-yellow-600">
      <span className="font-semibold">{t("dysonSpherePower")}:</span>
      <span>{formatNumber(totalPower.dysonSphere)} kW</span>
      <p className="text-xs">{t("dysonSpherePowerNote")}</p>
    </div>
  )}

  <div className="border-t pt-2">
    <span className="font-semibold">{t("totalPower")}:</span>
    <span>{formatNumber(totalPower.total)} kW</span>
  </div>
</div>
```

**ファイル**: `src/components/PowerGraphView/index.tsx`

グラフにダイソンスフィア電力を追加：

```tsx
const chartData = [
  // ... 既存のデータ
  {
    name: t("dysonSpherePower"),
    value: totalPower.dysonSphere,
    color: "#eab308", // yellow-500
  },
];
```

#### 3.3 生産ツリー表示の拡張

**ファイル**: `src/components/ResultTree/TreeNode.tsx`

Ray Receiver ノードの特別表示：

```tsx
{
  node.recipe?.Type === "PhotonGeneration" && node.power.dysonSphere > 0 && (
    <div className="text-xs text-yellow-600">
      ⚡ {t("dysonSpherePower")}: {formatNumber(node.power.dysonSphere)} kW
    </div>
  );
}
```

### 4. 多言語対応

**ファイル**: `src/i18n/locales/ja.json`

```json
{
  "photonGeneration": "光子生成",
  "rayReceiver": "γ線レシーバー",
  "criticalPhoton": "臨界光子",
  "gravitonLens": "重力子レンズ",
  "useGravitonLens": "重力子レンズを使用",
  "gravitonLensProliferator": "重力子レンズへの増産剤",
  "solarEnergyLossResearch": "太陽光線エネルギー損失研究",
  "solarEnergyLoss": "太陽光線エネルギー損失",
  "dysonSpherePower": "ダイソンスフィア電力",
  "dysonSpherePowerNote": "ダイソンスフィアからの電力受信が必要です",
  "continuousReception": "連続受信",
  "researchLevel": "研究レベル",
  "normalPower": "通常電力",
  "categoryPhotonGeneration": "光子生成"
}
```

**ファイル**: `src/i18n/locales/en.json`

```json
{
  "photonGeneration": "Photon Generation",
  "rayReceiver": "Ray Receiver",
  "criticalPhoton": "Critical Photon",
  "gravitonLens": "Graviton Lens",
  "useGravitonLens": "Use Graviton Lens",
  "gravitonLensProliferator": "Graviton Lens Proliferator",
  "solarEnergyLossResearch": "Solar Energy Loss Research",
  "solarEnergyLoss": "Solar Energy Loss",
  "dysonSpherePower": "Dyson Sphere Power",
  "dysonSpherePowerNote": "Requires power reception from Dyson Sphere",
  "continuousReception": "Continuous Reception",
  "researchLevel": "Research Level",
  "normalPower": "Normal Power",
  "categoryPhotonGeneration": "Photon Generation"
}
```

### 5. テスト

#### 5.1 ユニットテスト

**ファイル**: `src/lib/__tests__/photonGenerationCalculation.test.ts`（新規作成）

```typescript
import { describe, it, expect } from "vitest";
import {
  calculateSolarEnergyLoss,
  calculateReceptionEfficiency,
  getPhotonGenerationRate,
  calculateRequiredPower,
} from "../photonGenerationCalculation";

describe("photonGenerationCalculation", () => {
  describe("calculateSolarEnergyLoss", () => {
    it("研究Lv 0-6 のテーブル値を返す", () => {
      expect(calculateSolarEnergyLoss(0)).toBeCloseTo(0.7);
      expect(calculateSolarEnergyLoss(6)).toBeCloseTo(0.372);
    });

    it("研究Lv 7以降の計算式を使用する", () => {
      expect(calculateSolarEnergyLoss(7)).toBeCloseTo(0.3162);
      expect(calculateSolarEnergyLoss(8)).toBeCloseTo(0.26877);
    });
  });

  describe("calculateReceptionEfficiency", () => {
    it("連続受信100%の場合の受信効率を計算する", () => {
      const loss = 0.7; // 70%
      const efficiency = calculateReceptionEfficiency(loss, 100);
      expect(efficiency).toBeCloseTo(0.58); // 100% - 70% * (1 - 0.4)
    });
  });

  describe("getPhotonGenerationRate", () => {
    it("重力子レンズなし、連続受信100%の場合", () => {
      const rate = getPhotonGenerationRate(false, 100, 0);
      expect(rate.theoreticalPower).toBe(120);
      expect(rate.productionRate).toBeCloseTo(0.1);
    });

    it("重力子レンズあり、増産剤Mk.III使用の場合", () => {
      const rate = getPhotonGenerationRate(true, 100, 1.0); // +100%速度
      expect(rate.theoreticalPower).toBe(480);
      expect(rate.productionRate).toBeCloseTo(0.4);
    });
  });

  describe("calculateRequiredPower", () => {
    it("理論電力と受信効率から要求電力を計算する", () => {
      const power = calculateRequiredPower(120, 0.58); // 120MW / 0.58
      expect(power).toBeCloseTo(206896.55); // kW
    });
  });
});
```

**ファイル**: `src/lib/calculator/__tests__/tree-builder.test.ts`

PhotonGeneration レシピのテストを追加：

```typescript
describe("buildRecipeTree with PhotonGeneration", () => {
  it("重力子レンズを使用する場合、インプットに追加される", () => {
    // テスト実装
  });

  it("ダイソンスフィア電力が正しく計算される", () => {
    // テスト実装
  });
});
```

#### 5.2 E2Eテスト

**ファイル**: `tests/e2e/photon-generation.spec.ts`（新規作成）

```typescript
import { test, expect } from "@playwright/test";

test.describe("臨界光子生成機能", () => {
  test("臨界光子を含むレシピを選択できる", async ({ page }) => {
    await page.goto("/");
    // テスト実装
  });

  test("光子生成設定を変更できる", async ({ page }) => {
    await page.goto("/");
    // 重力子レンズの使用切り替え
    // 研究レベルの調整
    // テスト実装
  });

  test("ダイソンスフィア電力が表示される", async ({ page }) => {
    await page.goto("/");
    // 統計ビューでダイソンスフィア電力を確認
    // テスト実装
  });
});
```

### 6. ドキュメント

**ファイル**: `README.md`

「機能」セクションに臨界光子生成機能を追加：

```markdown
### 臨界光子生成

Ray Receiver（γ線レシーバー）による臨界光子の生成を計算できます。

- **重力子レンズの使用**: 光子生成量を2倍に増加
- **重力子レンズへの増産剤**: 生産速度上昇効果を適用
- **太陽光線エネルギー損失研究**: 研究レベルに応じて受信効率が向上
- **ダイソンスフィア電力**: 通常の電力とは別に、ダイソンスフィアからの電力受信が必要

#### 注意事項

- 連続受信率は100%固定で計算されます
- 重力子レンズは Ray Receiver 1機あたり 0.1個/分 消費します
- ダイソンスフィア電力は通常の発電設備では供給できません
```

## 実装の注意事項

1. **XMLファイルは変更しない** - 全てコード内定数で定義
2. **連続受信は固定100%** - UI に注釈を追加し、ユーザーに明示
3. **重力子レンズ消費は固定0.1個/分** - 機械数に比例して計算
4. **増産剤の効果** - 重力子レンズへの増産剤は生産速度上昇と同じ効果
5. **電力表示の分離** - ダイソンスフィア電力は通常電力と明確に区別して表示

## 実装タスク

### Phase 1: データ構造とロジック

- [ ] データ構造の拡張（Recipe Type、GlobalSettings、PowerConsumption）
- [ ] 臨界光子レシピと Ray Receiver の定数定義（photonGeneration.ts）
- [ ] 光子生成の電力計算ロジック実装（photonGenerationCalculation.ts）
- [ ] Calculator への統合（tree-builder.ts、power-calculation.ts、aggregations.ts）

### Phase 2: UI実装

- [ ] 光子生成設定UIの実装（PhotonGenerationSettings.tsx）
- [ ] 電力表示の拡張（StatisticsView、PowerGraphView）
- [ ] 生産ツリー表示の拡張（TreeNode.tsx）
- [ ] 多言語対応の追加（ja.json、en.json）

### Phase 3: テストとドキュメント

- [ ] ユニットテストの実装（photonGenerationCalculation.test.ts、tree-builder.test.ts）
- [ ] E2Eテストの実装（photon-generation.spec.ts）
- [ ] ドキュメントの更新（README.md）

## 参考資料

- [Issue #73: 臨界光子を計算できるようにする](https://github.com/izu-san/dsp-calc-tool/issues/73)
- [DSP Wiki: Ray Receiver](https://dsp-wiki.com/Ray_Receiver)
