# リファクタリングパターン集

## テストリファクタリングパターン

### 1. Recipe の置き換えパターン

#### パターンA: プリセットを使用（推奨）

```typescript
import { recipePresets } from "../../test/factories/testDataFactory";

const mockRecipe = recipePresets.ironIngot();
```

#### パターンB: 単一出力レシピを作成

```typescript
import { createSingleOutputRecipe } from "../../test/factories/testDataFactory";

const mockRecipe = createSingleOutputRecipe({
  SID: 1,
  name: "Iron Ingot",
  type: "Smelt",
  timeSpend: 60,
  inputId: 1001,
  inputName: "Iron Ore",
  inputCount: 1,
  isRawInput: true,
  outputId: 1101,
  outputName: "Iron Ingot",
  outputCount: 1,
  gridIndex: "1101",
});
```

#### パターンC: 複数出力レシピを作成

```typescript
import { createMultiOutputRecipe } from "../../test/factories/testDataFactory";

const mockRecipe = createMultiOutputRecipe({
  SID: 100,
  name: "Refined Oil",
  type: "Chemical",
  timeSpend: 240,
  inputs: [{ id: 1007, name: "Crude Oil", count: 2, isRaw: true }],
  outputs: [
    { id: 1114, name: "Refined Oil", count: 2 },
    { id: 1120, name: "Hydrogen", count: 1 },
  ],
  explicit: true,
  gridIndex: "5001",
});
```

### 2. Machine の置き換えパターン

#### パターンA: プリセットを使用（推奨）

```typescript
import { machinePresets } from "../../test/factories/testDataFactory";

const mockMachine = machinePresets.arcSmelter();
```

#### パターンB: タイプ別機械を作成

```typescript
import { createMachineByType } from "../../test/factories/testDataFactory";

const mockMachine = createMachineByType({
  id: 2302,
  name: "Arc Smelter",
  type: "Smelt",
  assemblerSpeed: 10000,
  workEnergyPerTick: 360000,
  idleEnergyPerTick: 18000,
});
```

#### パターンC: 完全カスタム機械を作成

```typescript
import { createMachine } from "../../test/factories/testDataFactory";

const mockMachine = createMachine(2302, "Arc Smelter", {
  Type: "Smelt",
  assemblerSpeed: 10000,
  workEnergyPerTick: 360000,
  idleEnergyPerTick: 18000,
  isPowerConsumer: true,
  isPowerExchanger: false,
});
```

### 3. RecipeTreeNode の置き換えパターン

#### パターンA: レシピノードを作成

```typescript
import {
  createRecipeNode,
  machinePresets,
  recipePresets,
} from "../../test/factories/testDataFactory";
import { PROLIFERATOR_DATA } from "../../types/settings";

const node = createRecipeNode({
  recipe: recipePresets.ironIngot(),
  machine: machinePresets.arcSmelter(),
  targetOutputRate: 30,
  machineCount: 5,
  proliferator: { ...PROLIFERATOR_DATA.none, mode: "production" },
  power: { machines: 540, sorters: 0, dysonSphere: 0, total: 540 },
  inputs: [{ itemId: 1001, itemName: "Iron Ore", requiredRate: 30 }],
  children: [],
  conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
  nodeId: "root",
});
```

#### パターンB: 原材料ノードを作成

```typescript
import { createRawMaterialNode } from "../../test/factories/testDataFactory";

const rawNode = createRawMaterialNode({
  itemId: 1001,
  itemName: "Iron Ore",
  targetOutputRate: 30,
  nodeId: "raw-1001",
  miningFrom: "Iron Veins",
});
```

#### パターンC: 循環依存ノードを作成

```typescript
import { createCircularDependencyNode, recipePresets } from "../../test/factories/testDataFactory";

const circularNode = createCircularDependencyNode({
  itemId: 1120,
  itemName: "Hydrogen",
  targetOutputRate: 10,
  sourceRecipe: recipePresets.refinedOil(),
  nodeId: "circular-1120",
});
```

### 4. PowerConsumption の作成パターン

```typescript
import { createDefaultPowerConsumption } from "../../test/factories/testDataFactory";

// 方法1: ヘルパー関数を使用
const power = createDefaultPowerConsumption({
  machines: 540,
  sorters: 0,
  dysonSphere: 0,
  total: 540,
});

// 方法2: 直接作成（簡単な場合）
const power = {
  machines: 540,
  sorters: 0,
  dysonSphere: 0,
  total: 540,
};
```

### 5. ConveyorBeltRequirement の作成パターン

```typescript
import { createDefaultConveyorBelts } from "../../test/factories/testDataFactory";

// 方法1: ヘルパー関数を使用
const belts = createDefaultConveyorBelts({
  inputs: 1,
  outputs: 1,
  total: 2,
});

// 方法2: 直接作成（簡単な場合）
const belts = {
  inputs: 1,
  outputs: 1,
  total: 2,
};
```

---

## サービス層パターン

### 1. サービスファイルの構造

```typescript
// src/services/example/exampleService.ts

import { createLogger } from "../../utils/logger";

const logger = createLogger("ExampleService");

export interface ExampleServiceParams {
  // パラメータの型定義
}

export interface ExampleServiceResult {
  // 結果の型定義
}

export function exampleServiceFunction(params: ExampleServiceParams): ExampleServiceResult {
  // ビジネスロジック
  logger.info("Processing example");

  // 処理...

  return {
    // 結果
  };
}
```

### 2. カスタムフックの構造

```typescript
// src/hooks/useExample.ts

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { exampleServiceFunction } from "../services/example/exampleService";

export interface UseExampleParams {
  // フックのパラメータ
}

export function useExample(params: UseExampleParams) {
  const { t } = useTranslation();
  const [message, setMessage] = useState<string>("");

  const handleAction = useCallback(async () => {
    try {
      const result = exampleServiceFunction({
        // パラメータ
      });
      setMessage(t("success"));
    } catch (error) {
      setMessage(t("error"));
    }
  }, [params, t]);

  return {
    message,
    handleAction,
    setMessage,
  };
}
```

---

## 履歴記録パターン

### 1. 設定変更の履歴記録

```typescript
import { recordSettingsHistory } from "../services/history-recording";

set(state => {
  const before = { settings: state.settings };
  const after = { settings: { ...state.settings /* 変更 */ } };

  recordSettingsHistory({
    description: "設定を変更",
    before,
    after,
  });

  return after;
});
```

### 2. プラン変更の履歴記録

```typescript
import { recordPlanHistory } from "../services/history-recording";

set(state => {
  const before = { selectedRecipe: state.selectedRecipe };
  const after = { selectedRecipe: newRecipe };

  recordPlanHistory({
    description: "レシピを変更",
    before,
    after,
    planSnapshot: {
      // プランスナップショット
    },
  });

  return after;
});
```

### 3. ノードオーバーライドの履歴記録

```typescript
import { recordNodeOverrideHistory } from "../services/history-recording";

set(state => {
  const before = { [`nodeOverrides.${nodeId}`]: state.nodeOverrides.get(nodeId) };
  const after = { [`nodeOverrides.${nodeId}`]: newOverride };

  recordNodeOverrideHistory({
    description: "ノードオーバーライドを変更",
    before,
    after,
    affectedNodes: [nodeId],
  });

  return {
    /* 新しい状態 */
  };
});
```

---

## 列挙型パターン

### 1. UIタブ状態の定義

```typescript
// src/types/ui-tabs.ts

export enum ProductionResultsTab {
  ProductionTree = "production-tree",
  Statistics = "statistics",
  BuildingCost = "building-cost",
  PowerGeneration = "power-generation",
  MiningCalculator = "mining-calculator",
  Roadmap = "roadmap",
}
```

### 2. 列挙型の使用

```typescript
import { ProductionResultsTab } from "../../types/ui-tabs";

const [activeTab, setActiveTab] = useState<ProductionResultsTab>(
  ProductionResultsTab.ProductionTree
);

// 条件分岐
{activeTab === ProductionResultsTab.Statistics && (
  <StatisticsView />
)}
```

---

## よくあるエラーと対処法

### 1. `PROLIFERATOR_DATA` が見つからない

**エラー**: `Cannot read properties of undefined (reading 'none')`

**原因**: `testDataFactory` から再エクスポートしていない

**対処法**:

```typescript
// ❌ 間違い
import { PROLIFERATOR_DATA } from "../../test/factories/testDataFactory";

// ✅ 正しい
import { PROLIFERATOR_DATA } from "../../types/settings";
```

### 2. `power` オブジェクトの型エラー

**エラー**: `Property 'dysonSphere' is missing`

**原因**: `dysonSphere` プロパティが含まれていない

**対処法**:

```typescript
// ❌ 間違い
power: { machines: 540, sorters: 0, total: 540 }

// ✅ 正しい
power: { machines: 540, sorters: 0, dysonSphere: 0, total: 540 }
```

### 3. `machines` の型エラー

**エラー**: `Type 'Map<string, Machine>' is not assignable to type 'Map<number, Machine>'`

**原因**: `GameData` の `machines` は `Map<number, Machine>` 形式

**対処法**: `testDataFactory.ts` で修正済み。新しいコードでは `Map<number, Machine>` を使用すること。

---

## ベストプラクティス

### 1. テストデータの作成

- **プリセットを優先**: よく使われるデータはプリセットを使用
- **ビルダーで拡張**: 特殊なケースはビルダーで作成
- **一貫性を保つ**: 同じデータは同じ方法で作成

### 2. サービス層の設計

- **単一責任**: 1つのサービスは1つの責務を持つ
- **純粋関数**: 可能な限り純粋関数として実装
- **エラーハンドリング**: 適切なエラーハンドリングを実装

### 3. カスタムフックの設計

- **関心の分離**: UIロジックとビジネスロジックを分離
- **再利用性**: 複数のコンポーネントで使用可能にする
- **テスト容易性**: テストしやすい設計にする

---

**最終更新**: 2025-01-28
