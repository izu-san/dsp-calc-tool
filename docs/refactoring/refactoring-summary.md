# 単体テストリファクタリング調査結果

## 修正完了

### 1. `power`オブジェクトに`dysonSphere`を追加

以下のファイルで`power`オブジェクトに`dysonSphere: 0`を追加しました：

- ✅ `src/lib/calculator/__tests__/aggregations.test.ts` - 7箇所修正
- ✅ `src/components/PowerGraphView/__tests__/PowerGraphView.test.tsx` - 1箇所修正
- ✅ `src/components/ResultTree/__tests__/ResultTree.test.tsx` - 3箇所修正
- ✅ `src/components/MiningCalculator/__tests__/MiningCalculator.test.tsx` - 1箇所修正

## 保留（要確認）

### 1. `src/lib/__tests__/buildingCost.test.ts`

- `power`オブジェクトが`{ total: 720 }`のような簡略形式で、`machines`や`sorters`が含まれていない
- `calculateBuildingCost`関数が`power.total`のみを参照している可能性があるため、現状のままでも動作する可能性が高い
- ただし、型安全性のためには`PowerConsumption`型に準拠させるべき

### 2. `src/lib/__tests__/calculator.test.ts`

- `createMockGameData`関数が手動で定義されている
- `createMockGameData()`ビルダーを使用すべきだが、大きな変更になるため今回は保留

## 推奨事項

1. **`buildingCost.test.ts`**: `calculateBuildingCost`関数の実装を確認し、`power`オブジェクトの使用箇所を調査。必要に応じて完全な`PowerConsumption`型に統一する。

2. **`calculator.test.ts`**: 将来的に`createMockGameData()`ビルダーを使用するようリファクタリングすることを推奨。

3. **その他のテストファイル**: 手動で`RecipeTreeNode`を作成している箇所は、可能な範囲でビルダーを使用することを推奨。
