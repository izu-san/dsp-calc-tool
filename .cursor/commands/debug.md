# デバッグ支援コマンド

このコマンドは、デバッグ作業を支援するコマンドです。

## 使用方法

```
/debug <ファイルパスまたはエラーメッセージ>
```

**例**:
- `/debug src/lib/calculator.ts` - ファイルのデバッグ支援
- `/debug "TypeError: Cannot read property 'length' of undefined"` - エラーの調査
- `/debug src/components/ResultTree/ResultTree.tsx:120` - 特定の行のデバッグ
- `/debug` - 現在開いているファイルのデバッグ

## 実行内容

### パターン1: ファイルのデバッグ支援

ファイルパスが指定された場合、以下の分析を実施：

#### 1. ファイルの解析

- **コードの読み込み**: 指定されたファイルを読み込む
- **構造の分析**: 関数、クラス、export/importを分析
- **複雑度の評価**: 循環的複雑度を計算

#### 2. 潜在的な問題の検出

以下の観点で潜在的な問題を検出：

**Null/Undefined参照の可能性**:
```typescript
// 検出される問題
function processData(data: Data | null) {
  return data.items.length; // ❌ data がnullの可能性
}

// 推奨される修正
function processData(data: Data | null) {
  return data?.items.length ?? 0; // ✅ オプショナルチェイニング
}
```

**配列の範囲外アクセス**:
```typescript
// 検出される問題
const first = array[0]; // ❌ 配列が空の可能性
const last = array[array.length - 1]; // ❌ 配列が空の可能性

// 推奨される修正
const first = array.at(0); // ✅ undefined を返す
const last = array.at(-1); // ✅ 配列の末尾を安全に取得
```

**型キャストの不適切な使用**:
```typescript
// 検出される問題
const value = data as string; // ❌ 型アサーションが安全でない

// 推奨される修正
const value = typeof data === 'string' ? data : String(data); // ✅ 型ガード
```

**非同期処理のエラーハンドリング不足**:
```typescript
// 検出される問題
async function fetchData() {
  const response = await fetch(url); // ❌ エラーハンドリングがない
  return response.json();
}

// 推奨される修正
async function fetchData() {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
}
```

**無限ループの可能性**:
```typescript
// 検出される問題
while (condition) {
  // conditionが常にtrueの可能性
  doSomething();
}

// 推奨される修正
let maxIterations = 100;
while (condition && maxIterations-- > 0) {
  doSomething();
}
```

**メモリリークの可能性**:
```typescript
// 検出される問題
useEffect(() => {
  const interval = setInterval(fetchData, 1000);
  // ❌ クリーンアップがない
}, []);

// 推奨される修正
useEffect(() => {
  const interval = setInterval(fetchData, 1000);
  return () => clearInterval(interval); // ✅ クリーンアップ
}, []);
```

#### 3. デバッグ用のログ追加箇所を提案

効果的なデバッグログの追加位置を提案：

```typescript
function calculateProductionChain(recipe: Recipe, targetRate: number) {
  // 🔍 提案: 入力パラメータをログ出力
  console.log('[DEBUG] calculateProductionChain - inputs:', { recipe, targetRate });
  
  const result = performCalculation(recipe, targetRate);
  
  // 🔍 提案: 中間結果をログ出力
  console.log('[DEBUG] calculateProductionChain - intermediate:', result);
  
  if (!result.valid) {
    // 🔍 提案: エラー条件をログ出力
    console.error('[DEBUG] calculateProductionChain - validation failed:', result.error);
    throw new Error('Invalid calculation result');
  }
  
  // 🔍 提案: 戻り値をログ出力
  console.log('[DEBUG] calculateProductionChain - output:', result);
  return result;
}
```

#### 4. 修正方針を提案

検出された問題に対する具体的な修正方針：

1. **型安全性の向上**: オプショナルチェイニング、型ガードの追加
2. **エラーハンドリング**: try-catch、エラーメッセージの改善
3. **バリデーション**: 入力値の検証を追加
4. **防御的プログラミング**: エッジケースへの対応

#### 5. テストケースを提案

エラーを再現するテストケースを提案：

```typescript
describe('calculateProductionChain', () => {
  it('should handle null recipe gracefully', () => {
    // 🔍 提案: nullケースのテスト
    expect(() => calculateProductionChain(null, 10)).not.toThrow();
  });
  
  it('should handle zero target rate', () => {
    // 🔍 提案: ゼロケースのテスト
    const result = calculateProductionChain(recipe, 0);
    expect(result.machineCount).toBe(0);
  });
  
  it('should handle negative target rate', () => {
    // 🔍 提案: 異常値のテスト
    expect(() => calculateProductionChain(recipe, -10)).toThrow();
  });
});
```

### パターン2: エラーメッセージの調査

エラーメッセージが指定された場合、以下の分析を実施：

#### 1. エラーの分類

エラーメッセージから以下の情報を抽出：

- **エラータイプ**: TypeError, ReferenceError, RangeError など
- **エラー内容**: 具体的なエラーメッセージ
- **スタックトレース**: エラー発生箇所

#### 2. よくある原因を列挙

エラータイプ別のよくある原因：

**TypeError: Cannot read property 'X' of undefined**:
- オブジェクトがundefinedまたはnull
- オプショナルチェイニング（`?.`）の不足
- 非同期処理の完了前にアクセス

**TypeError: Cannot read property 'X' of null**:
- オブジェクトがnull
- APIレスポンスが空
- データ初期化の不足

**ReferenceError: X is not defined**:
- 変数の宣言忘れ
- スコープ外の変数参照
- importの不足

**RangeError: Maximum call stack size exceeded**:
- 無限再帰
- 循環参照
- イベントリスナーの無限ループ

**TypeError: X is not a function**:
- 関数ではないものを関数として呼び出し
- undefinedまたはnullを関数として呼び出し
- 型の不一致

#### 3. 関連するコードを検索

エラーメッセージから関連するコードを検索：

```bash
# エラーメッセージに含まれるキーワードで検索
grep -r "関連キーワード" src/

# 特定の関数・変数を検索
grep -r "functionName" src/
```

#### 4. 修正例を提示

具体的な修正例を提示：

**修正前**:
```typescript
function processData(data) {
  return data.items.map(item => item.value); // エラー発生
}
```

**修正後**:
```typescript
function processData(data: Data | null | undefined) {
  // オプショナルチェイニングとデフォルト値
  return data?.items?.map(item => item.value) ?? [];
}
```

#### 5. デバッグ手順を提案

段階的なデバッグ手順：

1. **エラー発生箇所の特定**: スタックトレースを確認
2. **データの確認**: 変数の値をログ出力
3. **条件の確認**: if文やループ条件を確認
4. **型の確認**: TypeScriptの型を確認
5. **テストの追加**: エラーを再現するテストを追加

### パターン3: 特定の行のデバッグ

ファイルパスと行番号が指定された場合：

```
/debug src/lib/calculator.ts:120
```

#### 1. 該当行の周辺コードを表示

- 指定された行の前後10行を表示
- 問題の文脈を把握

#### 2. その行で起こりうる問題を分析

- 変数の型チェック
- Null参照の可能性
- 論理エラーの可能性

#### 3. 具体的な修正案を提示

該当行の問題点と修正案を提示

## 使用例

### 例1: ファイル全体のデバッグ

```bash
/debug src/lib/calculator.ts

# 実行結果:
# 🔍 デバッグ分析: src/lib/calculator.ts
#
# 📊 ファイル概要:
# - 関数: 12個
# - クラス: 0個
# - export: 3個
# - 行数: 350行
#
# ⚠️  潜在的な問題:
#
# 1. Null参照の可能性 (45行目)
#    const result = data.items[0].value;
#    → data.items が空配列の可能性があります
#    
#    修正案:
#    const result = data.items.at(0)?.value ?? defaultValue;
#
# 2. エラーハンドリング不足 (78行目)
#    const response = await fetch(url);
#    → try-catch でエラーハンドリングを追加してください
#
# 3. 無限ループの可能性 (120行目)
#    while (condition) { ... }
#    → 脱出条件が不明確です
#
# 🔍 デバッグログ追加箇所の提案:
#
# 1. 関数の入口 (calculateProductionChain, 23行目)
#    console.log('[DEBUG] inputs:', { recipe, targetRate });
#
# 2. 中間結果 (performCalculation, 89行目)
#    console.log('[DEBUG] intermediate:', result);
#
# 3. エラー発生時 (validateResult, 145行目)
#    console.error('[DEBUG] validation failed:', error);
#
# 📝 テストケースの提案:
#
# describe('calculateProductionChain', () => {
#   it('should handle empty recipe', () => {
#     const result = calculateProductionChain(emptyRecipe, 10);
#     expect(result).toBeDefined();
#   });
#   
#   it('should handle zero target rate', () => {
#     const result = calculateProductionChain(recipe, 0);
#     expect(result.machineCount).toBe(0);
#   });
# });
```

### 例2: エラーメッセージの調査

```bash
/debug "TypeError: Cannot read property 'length' of undefined"

# 実行結果:
# 🔍 エラー分析: TypeError
#
# 📋 エラータイプ: TypeError
# 📋 エラー内容: Cannot read property 'length' of undefined
#
# 🔍 よくある原因:
#
# 1. 変数がundefined
#    - オブジェクトが初期化されていない
#    - 非同期処理の完了前にアクセス
#    - オプショナルチェイニングの不足
#
# 2. 配列が存在しない
#    - APIレスポンスが空
#    - データ構造の変更
#    - フィルタリング後に空配列
#
# 3. プロパティ名の誤り
#    - タイポ
#    - ネストレベルの誤り
#
# 🔍 関連するコードを検索中...
#
# 検出されたコード:
# - src/lib/calculator.ts:45
#   const count = result.items.length;
#
# - src/components/ResultTree.tsx:120
#   const total = data.nodes.length;
#
# 💡 修正例:
#
# 修正前:
# const count = result.items.length;
#
# 修正後:
# const count = result.items?.length ?? 0;
# // または
# const count = Array.isArray(result.items) ? result.items.length : 0;
#
# 🔍 デバッグ手順:
#
# 1. エラー発生箇所の特定
#    - スタックトレースを確認
#    - console.log() で変数の値を確認
#
# 2. データの確認
#    console.log('result:', result);
#    console.log('result.items:', result.items);
#
# 3. 型の確認
#    - TypeScriptの型定義を確認
#    - 実行時の型を確認（typeof, Array.isArray）
#
# 4. テストの追加
#    it('should handle undefined items', () => {
#      const result = { items: undefined };
#      expect(() => processResult(result)).not.toThrow();
#    });
```

### 例3: 特定の行のデバッグ

```bash
/debug src/lib/calculator.ts:120

# 実行結果:
# 🔍 デバッグ分析: src/lib/calculator.ts:120
#
# 📋 周辺コード:
#
# 115|  function calculateMachineCount(recipe: Recipe, targetRate: number) {
# 116|    const cycleTime = recipe.timeSpend / 60;
# 117|    const outputPerCycle = recipe.results[0].count;
# 118|    const outputPerSecond = outputPerCycle / cycleTime;
# 119|    
# 120|    const machineCount = targetRate / outputPerSecond;
# 121|    
# 122|    return Math.ceil(machineCount);
# 123|  }
#
# ⚠️  潜在的な問題:
#
# 1. ゼロ除算の可能性
#    - outputPerSecond が0の場合、Infinityになります
#    - cycleTime が0の場合、outputPerSecond がInfinityになります
#
# 2. 配列の範囲外アクセス
#    - recipe.results[0] が存在しない可能性があります
#
# 💡 修正案:
#
# function calculateMachineCount(recipe: Recipe, targetRate: number) {
#   // バリデーション追加
#   if (!recipe.results || recipe.results.length === 0) {
#     throw new Error('Recipe has no results');
#   }
#   
#   const cycleTime = recipe.timeSpend / 60;
#   if (cycleTime === 0) {
#     throw new Error('Invalid cycle time');
#   }
#   
#   const outputPerCycle = recipe.results[0].count;
#   const outputPerSecond = outputPerCycle / cycleTime;
#   
#   if (outputPerSecond === 0) {
#     return 0;
#   }
#   
#   const machineCount = targetRate / outputPerSecond;
#   return Math.ceil(machineCount);
# }
#
# 📝 テストケースの提案:
#
# it('should handle recipe with no results', () => {
#   const recipe = { results: [], timeSpend: 60 };
#   expect(() => calculateMachineCount(recipe, 10)).toThrow('Recipe has no results');
# });
#
# it('should handle zero cycle time', () => {
#   const recipe = { results: [{ count: 1 }], timeSpend: 0 };
#   expect(() => calculateMachineCount(recipe, 10)).toThrow('Invalid cycle time');
# });
```

## エラーハンドリング

### ファイルが見つからない場合

```
❌ エラー: ファイルが見つかりません

指定されたファイル: src/lib/nonexistent.ts

確認事項:
- ファイルパスが正しいか確認してください
- ファイルが削除されていないか確認してください
```

### エラーメッセージが不明確な場合

```
⚠️  エラーメッセージが不明確です

より詳細なエラー情報を提供してください：
- スタックトレース全体
- エラーが発生する条件
- 再現手順
```

## 注意事項

1. **デバッグログは削除を忘れずに**
   - コミット前に `/cleanup debug` でデバッグログを削除

2. **テストで問題を再現**
   - 提案されたテストケースを追加してバグを再現

3. **段階的にデバッグ**
   - 一度に多くのログを追加せず、段階的に追加

4. **型安全性を優先**
   - any の使用を避け、適切な型を使用

5. **エラーハンドリングを徹底**
   - try-catch でエラーをキャッチ
   - エラーメッセージを分かりやすく

---

**デバッグは段階的に進めることが重要です。このコマンドを活用して効率的にデバッグしてください。**

