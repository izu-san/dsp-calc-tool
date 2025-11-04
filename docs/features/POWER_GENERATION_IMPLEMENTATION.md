# 発電設備計算機能追加 - 実装仕様書

## 概要

Dyson Sphere Program 生産チェーン計算機に発電設備計算機能を追加する。生産統計の総電力から必要な発電設備の台数と燃料消費量を算出し、テンプレートごとに使用可能な発電設備と燃料を制限する機能を実装する。

## 機能要件

### 基本機能

- 生産統計の総電力から必要な発電設備の台数を自動計算
- 燃料を使用する発電設備の燃料消費量を算出
- テンプレート（序盤・中盤・後半・終盤）ごとに使用可能な発電設備と燃料を制限
- 複数の燃料種別を使用できる発電設備では、最もエネルギー効率が良い燃料を自動選択

### UI要件

- 独立したタブとして表示（ProductionResultsPanel内）
- 必要電力、発電設備台数、燃料消費量を分かりやすく表示
- Solar Panel等の出力変動設備については注意書きを表示

## 技術仕様

### 1. 型定義

#### 発電設備の種類

```typescript
export type PowerGeneratorType =
  | "windTurbine" // 風力タービン (id: 2203)
  | "thermalPlant" // 火力発電所 (id: 2204)
  | "solarPanel" // ソーラーパネル (id: 2205)
  | "geothermal" // 地熱発電所 (id: 2213)
  | "miniFusion" // ミニ核融合発電所 (id: 2211)
  | "artificialStar"; // 人工恒星 (id: 2210)
```

#### 燃料の種類

```typescript
export type FuelType = "chemical" | "nuclear" | "mass";
```

#### データ構造

```typescript
// 燃料アイテム情報
export interface FuelItem {
  itemId: number;
  itemName: string;
  fuelType: FuelType;
  heatValue: number; // J (ジュール)
  energyPerItem: number; // MJ (メガジュール)
}

// 発電設備情報
export interface PowerGeneratorInfo {
  machineId: number;
  machineName: string;
  type: PowerGeneratorType;
  baseOutput: number; // kW
  efficiency: number; // 0-1 (1 = 100%)
  acceptedFuelTypes: FuelType[];
  isVariableOutput: boolean; // 出力変動するか
  operatingRate: number; // 稼働率 (0-1, Solar Panelなど)
}

// 発電計算結果
export interface PowerGenerationResult {
  requiredPower: number; // kW (必要電力)
  generators: GeneratorAllocation[];
  totalGenerators: number;
  totalFuelConsumption: Map<number, number>; // itemId -> 個/秒
}

// 発電設備の割り当て
export interface GeneratorAllocation {
  generator: PowerGeneratorInfo;
  fuel: FuelItem | null; // 燃料不要の場合はnull
  count: number; // 必要台数
  totalOutput: number; // kW
  fuelConsumptionRate: number; // 個/秒 (燃料不要の場合は0)
}
```

### 2. 発電設備データ

#### 発電設備一覧（XMLデータベース）

| 名称                      | ID   | 出力    | 効率 | 燃料タイプ     | 出力変動 | 稼働率   |
| ------------------------- | ---- | ------- | ---- | -------------- | -------- | -------- |
| Wind turbine              | 2203 | 300 kW  | -    | なし           | あり     | 100%固定 |
| Thermal power station     | 2204 | 2.16 MW | 80%  | Chemical       | なし     | 100%     |
| Geothermal power station  | 2213 | 4.80 MW | -    | なし           | あり     | 100%固定 |
| Solar panel               | 2205 | 360 kW  | -    | なし           | あり     | 70.3%    |
| Mini fusion power station | 2211 | 15.0 MW | 100% | Nuclear energy | なし     | 100%     |
| Artificial star           | 2210 | 72.0 MW | 100% | Mass energy    | なし     | 100%     |

#### 燃料データ（HeatValueベース）

| 名称                          | ID   | 燃料タイプ     | エネルギー/個 |
| ----------------------------- | ---- | -------------- | ------------- |
| Coal                          | 1006 | Chemical       | 2.70 MJ       |
| Crude oil                     | 1007 | Chemical       | 4.05 MJ       |
| Refined oil                   | 1114 | Chemical       | 4.50 MJ       |
| Energetic graphite            | 1109 | Chemical       | 6.75 MJ       |
| Hydrogen                      | 1120 | Chemical       | 9.00 MJ       |
| Combustible Unit              | 1128 | Chemical       | 9.72 MJ       |
| Explosive Unit                | 1129 | Chemical       | 21.6 MJ       |
| Crystal Explosive Unit        | 1130 | Chemical       | 54.0 MJ       |
| Hydrogen fuel rod             | 1801 | Chemical       | 54.0 MJ       |
| Deuteron fuel rod             | 1802 | Nuclear energy | 600 MJ        |
| Antimatter fuel rod           | 1803 | Mass energy    | 7.20 GJ       |
| Strange Annihilation Fuel Rod | 1804 | Mass energy    | 72.0 GJ       |

### 3. テンプレート別制限

#### 序盤 (Early Game)

- **発電設備**: Wind turbine, Thermal power station, Geothermal power station, Solar panel
- **燃料**: Coal, Crude oil, Refined oil, Energetic graphite, Hydrogen, Combustible Unit

#### 中盤 (Mid Game)

- **発電設備**: 序盤と同じ
- **燃料**: 序盤 + Explosive Unit, Hydrogen fuel rod

#### 後半 (Late Game)

- **発電設備**: 中盤 + Mini fusion power station
- **燃料**: 中盤 + Crystal Explosive Unit, Deuteron fuel rod

#### 終盤 (End Game)

- **発電設備**: 全て
- **燃料**: 全て

### 4. 計算ロジック

#### 発電設備選択アルゴリズム

1. 使用可能な発電設備のうち、最も高出力のものを1種類選択
2. 燃料を使用する場合、最もエネルギー効率が良い燃料を自動選択
3. 必要台数 = `Math.ceil(requiredPower / (baseOutput * operatingRate))`
4. 燃料消費速度 = `(useFuelPerTick * 60 / 1000) / (heatValue / 1000000)` 個/秒

#### 発電効率の計算

- `efficiency = genEnergyPerTick / useFuelPerTick`
- `useFuelPerTick = 0` の場合は燃料不要（Wind Turbine, Solar Panel等）

#### 特殊ケース

- **Solar Panel**: 稼働率70.3%（54.9%～85.7%の中央値）
- **Artificial Star**: 燃料によって出力が変動
  - Antimatter Fuel Rod: 72.0 MW
  - Strange Annihilation Fuel Rod: 144 MW

## 実装計画

### Phase 1: 基盤構築

1. **型定義** (`src/types/power-generation.ts`) - 基礎となるデータ構造
2. **定数定義** (`src/constants/powerGeneration.ts`) - 発電設備・燃料データ
3. **計算ロジック** (`src/lib/powerGenerationCalculation.ts`) - コア機能

### Phase 2: 設定統合

4. **テンプレート拡張** (`src/types/settings/templates.ts`) - テンプレート対応
5. **設定ストア更新** (`src/stores/settingsStore.ts`) - 発電設備設定の永続化

### Phase 3: UI実装

6. **UIコンポーネント** (`src/components/PowerGenerationView/`) - ユーザー向け表示
7. **レイアウト統合** (`src/components/Layout/ProductionResultsPanel.tsx`) - タブ追加

### Phase 4: 国際化・テスト

8. **i18n対応** (`src/i18n/locales/`) - 多言語対応
9. **テスト作成** - 品質保証

## ファイル構成

```
src/
├── types/
│   └── power-generation.ts          # 発電設備関連の型定義
├── constants/
│   └── powerGeneration.ts           # 発電設備・燃料の定数データ
├── lib/
│   └── powerGenerationCalculation.ts # 発電設備計算ロジック
├── components/
│   └── PowerGenerationView/
│       ├── index.tsx                # メインコンポーネント
│       └── __tests__/
│           └── PowerGenerationView.test.tsx
├── stores/
│   └── settingsStore.ts            # 設定ストア（拡張）
└── i18n/
    └── locales/
        ├── ja.json                 # 日本語翻訳
        └── en.json                 # 英語翻訳
```

## 技術的考慮事項

### XMLデータの活用

- `Machine.genEnergyPerTick` → 基本出力 (tick \* 60 / 1000 = kW)
- `Machine.useFuelPerTick` → 燃料消費速度
- `Item.HeatValue` → 燃料のエネルギー量 (J)

### パフォーマンス

- 計算結果のキャッシュ化
- テンプレート変更時の再計算最適化

### 拡張性

- 将来的な複数発電設備組み合わせ対応
- 惑星環境データ（風力・太陽光）の考慮
- ユーザーカスタム発電設備設定

## テスト戦略

### 単体テスト

- 発電設備計算ロジックの各関数
- 燃料選択アルゴリズム
- テンプレート制限の適用

### 統合テスト

- UIコンポーネントの表示
- 設定変更時の再計算
- タブ切り替え機能

### E2Eテスト

- エンドツーエンドの発電設備計算フロー
- テンプレート変更による発電設備制限

## 参考資料

- [GitHub Issue #75](https://github.com/izu-san/dsp-calc-tool/issues/75) - 機能要件
- `public/data/Machines/Machines_ja.xml` - 発電設備データ
- `public/data/Items/Items_en.xml` - 燃料データ（HeatValue）
