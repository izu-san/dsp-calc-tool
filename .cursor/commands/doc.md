# ドキュメント生成コマンド

このコマンドは、関数、モジュール、コンポーネントのドキュメントを自動生成します。

**ドキュメント形式**: TSDoc（TypeScript向けドキュメントコメント規格）

## 使用方法

```
/doc <ファイルパス>
```

**例**:
- `/doc src/lib/calculator.ts` - calculator.ts のドキュメント生成
- `/doc src/components/MiningCalculator/MiningCalculator.tsx` - コンポーネントのドキュメント生成
- `/doc src/hooks/useProductionCalculation.ts` - カスタムフックのドキュメント生成
- `/doc` - 現在開いているファイルのドキュメント生成

## TSDoc vs JSDoc

このコマンドでは **TSDoc** を使用します。

| 項目 | JSDoc | TSDoc |
|---|---|---|
| **対象言語** | JavaScript | TypeScript |
| **型情報** | @param {string} で型を記述 | TypeScript型定義を参照 |
| **型パラメータ** | @template | @typeParam |
| **修飾タグ** | @private, @public | @internal, @public |
| **詳細説明** | なし | @remarks（詳細説明専用） |
| **互換性** | TypeScriptでも使用可 | TypeScript専用 |

**TSDocの利点**:
- TypeScriptの型システムと完全に統合
- 冗長な型記述が不要（TypeScript型定義を自動参照）
- TypeScript固有の機能（ジェネリクス、型パラメータ）に対応
- Microsoft公式のTypeScript向けドキュメント規格

## 実行内容

### ステップ 1: ファイルの解析

指定されたファイルを解析して、以下の情報を抽出：

- **関数**: 関数名、パラメータ、戻り値
- **クラス**: クラス名、メソッド、プロパティ
- **Reactコンポーネント**: Props、State、Hooks
- **型定義**: インターフェース、型エイリアス
- **定数**: export された定数

### ステップ 2: TSDocコメントの生成

#### 関数のTSDoc

```typescript
/**
 * 生産チェーンを計算します。
 * 
 * @remarks
 * このコマンドは、指定されたレシピと目標生産量から、
 * 必要な施設数、原材料、電力消費などを計算します。
 * 
 * 計算アルゴリズム:
 * 1. レシピツリーを構築
 * 2. 各ノードの施設数を計算
 * 3. 原材料と電力を集計
 * 
 * @param recipe - 計算対象のレシピ
 * @param targetRate - 目標生産量（個/秒）
 * @param gameData - ゲームデータ（アイテム、レシピ、施設）
 * @param settings - グローバル設定（増産剤、ベルト速度など）
 * @param nodeOverrides - ノード別のオーバーライド設定（デフォルト: 空のMap）
 * @returns 計算結果（施設数、原材料、電力消費など）
 * 
 * @throws レシピが無効な場合
 * @throws 目標生産量が負の場合
 * 
 * @example 基本的な使い方
 * ```typescript
 * const result = calculateProductionChain(
 *   ironPlateRecipe,
 *   10,
 *   gameData,
 *   settings,
 *   new Map()
 * );
 * console.log(`必要な施設数: ${result.machineCount}`);
 * ```
 * 
 * @see {@link CalculationResult} - 計算結果の型定義
 * @see {@link buildRecipeTree} - レシピツリー構築の内部関数
 */
export function calculateProductionChain(
  recipe: Recipe,
  targetRate: number,
  gameData: GameData,
  settings: GlobalSettings,
  nodeOverrides: Map<string, NodeOverrideSettings> = new Map()
): CalculationResult {
  // 実装
}
```

#### クラスのTSDoc

```typescript
/**
 * タイムベースのキャッシュ実装。
 * 
 * @remarks
 * 指定されたTTL（Time To Live）の間、値をキャッシュします。
 * TTLを過ぎた値は自動的に無効化されます。
 * 
 * 有効期限の管理:
 * - 値を取得時に有効期限をチェック
 * - 有効期限切れの値は自動的に削除
 * - ガベージコレクションは実装していません（メモリリーク注意）
 * 
 * @typeParam T - キャッシュする値の型
 * 
 * @example 基本的な使い方
 * ```typescript
 * const cache = new TimeBasedCache<User>(60000); // 60秒のTTL
 * cache.set('user1', user);
 * const cachedUser = cache.get('user1'); // 60秒以内は有効
 * ```
 * 
 * @example 複雑なオブジェクトのキャッシュ
 * ```typescript
 * interface GameData {
 *   items: Item[];
 *   recipes: Recipe[];
 * }
 * 
 * const cache = new TimeBasedCache<GameData>(300000); // 5分のTTL
 * cache.set('gameData', await loadGameData());
 * const data = cache.get('gameData');
 * ```
 */
class TimeBasedCache<T> implements Cache<T> {
  /**
   * キャッシュされた値のマップ。
   * 
   * @internal
   */
  private items = new Map<string, { value: T; expireAt: number }>();

  /**
   * TimeBasedCacheのコンストラクタ。
   * 
   * @param ttlMs - TTL（Time To Live）をミリ秒で指定
   * 
   * @example
   * ```typescript
   * const cache = new TimeBasedCache<string>(60000); // 60秒
   * ```
   */
  constructor(private ttlMs: number) {}

  /**
   * キャッシュから値を取得します。
   * 
   * @remarks
   * 有効期限切れの場合は undefined を返します。
   * 有効期限切れの値は自動的に削除されます。
   * 
   * @param key - キャッシュのキー
   * @returns キャッシュされた値、または undefined（有効期限切れまたは存在しない場合）
   * 
   * @example
   * ```typescript
   * const value = cache.get('key1');
   * if (value !== undefined) {
   *   console.log('Cache hit:', value);
   * } else {
   *   console.log('Cache miss');
   * }
   * ```
   */
  get(key: string): T | undefined {
    // 実装
  }

  /**
   * キャッシュに値を設定します。
   * 
   * @remarks
   * 既存のキーがある場合は上書きされます。
   * 有効期限は現在時刻 + TTL で計算されます。
   * 
   * @param key - キャッシュのキー
   * @param value - キャッシュする値
   * 
   * @example
   * ```typescript
   * cache.set('key1', 'value1');
   * ```
   */
  set(key: string, value: T): void {
    // 実装
  }
}
```

#### ReactコンポーネントのTSDoc

```typescript
/**
 * 採掘速度計算コンポーネント。
 * 
 * @remarks
 * 鉱床の採掘速度を計算し、必要な採掘機の数を表示します。
 * 
 * 機能:
 * - 鉱物IDから採掘速度を自動計算
 * - 採掘機のレベル選択
 * - 目標採掘速度の入力
 * - 必要な採掘機数の表示
 * 
 * @param props - コンポーネントのProps {@link MiningCalculatorProps}
 * @returns Reactコンポーネント
 * 
 * @example 基本的な使い方
 * ```tsx
 * <MiningCalculator 
 *   mineralId={1001} 
 *   targetRate={10}
 *   onResultChange={handleResultChange}
 * />
 * ```
 * 
 * @example カスタムスタイル適用
 * ```tsx
 * <MiningCalculator 
 *   mineralId={1002}
 *   targetRate={20}
 *   className="my-4 p-6 bg-slate-800"
 * />
 * ```
 */
export function MiningCalculator(props: MiningCalculatorProps) {
  // 実装
}

/**
 * MiningCalculator コンポーネントのProps。
 * 
 * @public
 */
interface MiningCalculatorProps {
  /**
   * 鉱物のID（例: 1001 = 鉄鉱石）
   * 
   * @remarks
   * ゲームデータ内の鉱物IDを指定します。
   * 無効なIDの場合、エラーメッセージが表示されます。
   */
  mineralId: number;
  
  /**
   * 目標採掘速度（個/秒）
   * 
   * @remarks
   * 正の数値を指定してください。
   * 0または負の値の場合、バリデーションエラーになります。
   */
  targetRate: number;
  
  /**
   * 計算結果が変更されたときのコールバック
   * 
   * @param result - 計算結果 {@link MiningResult}
   * 
   * @example
   * ```typescript
   * const handleResultChange = (result: MiningResult) => {
   *   console.log(`必要な採掘機: ${result.minerCount}`);
   * };
   * ```
   */
  onResultChange?: (result: MiningResult) => void;
  
  /**
   * コンポーネントのスタイルクラス（オプション）
   * 
   * @defaultValue undefined
   * 
   * @example
   * ```tsx
   * <MiningCalculator className="my-4 p-6" {...props} />
   * ```
   */
  className?: string;
}
```

#### カスタムフックのTSDoc

```typescript
/**
 * 生産チェーン計算のカスタムフック。
 * 
 * @remarks
 * このフックは、選択されたレシピと目標生産量から、
 * 生産チェーンを自動的に計算します。
 * 依存関係が変更されると、自動的に再計算されます。
 * 
 * 再計算のトリガー:
 * - selectedRecipe の変更
 * - targetQuantity の変更
 * - settings の変更
 * - nodeOverridesVersion の変更（Mapの中身が変更された場合）
 * 
 * パフォーマンス:
 * - 計算はuseEffectで非同期実行
 * - 不要な再計算を避けるため、useMemoでメモ化推奨
 * 
 * @param selectedRecipe - 選択されたレシピ（null の場合は計算しない）
 * @param targetQuantity - 目標生産量（個/秒）
 * @param data - ゲームデータ（null の場合は計算しない）
 * @param settings - グローバル設定（増産剤、ベルト速度など）
 * @param nodeOverrides - ノード別のオーバーライド設定
 * @param nodeOverridesVersion - ノードオーバーライドのバージョン（Mapの変更を検知）
 * @param setCalculationResult - 計算結果を設定するコールバック
 * 
 * @example 基本的な使い方
 * ```typescript
 * function App() {
 *   const [result, setResult] = useState<CalculationResult | null>(null);
 *   const selectedRecipe = useRecipeSelectionStore(state => state.selectedRecipe);
 *   const gameData = useGameDataStore(state => state.data);
 *   const settings = useSettingsStore(state => state.settings);
 *   
 *   useProductionCalculation(
 *     selectedRecipe,
 *     10, // 目標生産量
 *     gameData,
 *     settings,
 *     new Map(),
 *     0,
 *     setResult
 *   );
 *   
 *   return <div>{result && <ResultTree result={result} />}</div>;
 * }
 * ```
 * 
 * @example ノードオーバーライドを使用する場合
 * ```typescript
 * const [nodeOverrides, setNodeOverrides] = useState(new Map());
 * const [overridesVersion, setOverridesVersion] = useState(0);
 * 
 * const handleOverrideChange = (nodeId: string, override: NodeOverrideSettings) => {
 *   setNodeOverrides(prev => new Map(prev).set(nodeId, override));
 *   setOverridesVersion(v => v + 1); // バージョンをインクリメント
 * };
 * 
 * useProductionCalculation(
 *   selectedRecipe,
 *   targetQuantity,
 *   gameData,
 *   settings,
 *   nodeOverrides,
 *   overridesVersion,
 *   setResult
 * );
 * ```
 */
export function useProductionCalculation(
  selectedRecipe: Recipe | null,
  targetQuantity: number,
  data: GameData | null,
  settings: GlobalSettings,
  nodeOverrides: Map<string, NodeOverrideSettings>,
  nodeOverridesVersion: number,
  setCalculationResult: (result: CalculationResult | null) => void
) {
  // 実装
}
```

### ステップ 3: ファイルの先頭に仕様コメントを追加

```typescript
/**
 * 生産チェーン計算モジュール
 * 
 * @remarks
 * このモジュールは、Dyson Sphere Program の生産チェーンを計算します。
 * レシピ、目標生産量、設定から、必要な施設数、原材料、電力消費などを計算します。
 * 
 * 主要な機能:
 * - レシピツリーの構築
 * - 施設数の計算
 * - 原材料の集計
 * - 電力消費の計算
 * - 増産剤の適用
 * 
 * @packageDocumentation
 * 
 * @example 基本的な使い方
 * ```typescript
 * import { calculateProductionChain } from './calculator';
 * 
 * const result = calculateProductionChain(
 *   recipe,
 *   10,
 *   gameData,
 *   settings
 * );
 * console.log(`必要な施設数: ${result.machineCount}`);
 * ```
 * 
 * @see {@link https://github.com/owner/repo/docs/calculator.md | 詳細ドキュメント}
 * @see {@link CalculationResult} - 計算結果の型定義
 */

import { Recipe, GameData, CalculationResult } from './types';
// ... (以下略)
```

### ステップ 4: 型定義のドキュメント

```typescript
/**
 * 生産チェーンの計算結果。
 */
export interface CalculationResult {
  /**
   * ルートレシピノード
   */
  rootNode: RecipeNode;
  
  /**
   * 全ノードの配列（フラット化）
   */
  allNodes: RecipeNode[];
  
  /**
   * 原材料の集計
   * キー: アイテムID、値: 必要量（個/秒）
   */
  rawMaterials: Map<number, number>;
  
  /**
   * 施設の集計
   * キー: 施設タイプ、値: 必要な施設数
   */
  buildings: Map<string, number>;
  
  /**
   * 合計電力消費（MW）
   */
  totalPower: number;
  
  /**
   * 増産剤の消費量（個/秒）
   */
  proliferatorConsumption: number;
}

/**
 * レシピノード（生産ツリーのノード）。
 */
export interface RecipeNode {
  /**
   * ノードの一意なID
   */
  id: string;
  
  /**
   * レシピ
   */
  recipe: Recipe;
  
  /**
   * 必要な施設数
   */
  machineCount: number;
  
  /**
   * 目標生産量（個/秒）
   */
  targetRate: number;
  
  /**
   * 子ノード（原材料のレシピ）
   */
  children: RecipeNode[];
  
  /**
   * 電力消費（MW）
   */
  powerConsumption: number;
}
```

### ステップ 5: 使用例の生成

各関数・コンポーネントの使用例を自動生成：

```typescript
/**
 * @example 基本的な使い方
 * ```typescript
 * const result = calculateProductionChain(
 *   ironPlateRecipe,
 *   10,
 *   gameData,
 *   settings
 * );
 * console.log(`必要な施設数: ${result.machineCount}`);
 * ```
 * 
 * @example 増産剤を使用する場合
 * ```typescript
 * const settingsWithProliferator: GlobalSettings = {
 *   ...settings,
 *   proliferatorType: 'mk3',
 *   proliferatorMode: 'production',
 * };
 * const result = calculateProductionChain(
 *   ironPlateRecipe,
 *   10,
 *   gameData,
 *   settingsWithProliferator
 * );
 * ```
 * 
 * @example ノード別のオーバーライド設定
 * ```typescript
 * const nodeOverrides = new Map<string, NodeOverrideSettings>([
 *   ['node-1', { machineType: 'assembler-mk3' }],
 *   ['node-2', { proliferatorType: 'mk2' }],
 * ]);
 * const result = calculateProductionChain(
 *   ironPlateRecipe,
 *   10,
 *   gameData,
 *   settings,
 *   nodeOverrides
 * );
 * ```
 */
```

## TSDocの主要タグ

### 基本タグ

| タグ | 用途 | 例 |
|---|---|---|
| `@remarks` | 詳細説明 | `@remarks これは詳細な説明です` |
| `@param` | パラメータ説明 | `@param value - 値の説明` |
| `@returns` | 戻り値の説明 | `@returns 計算結果` |
| `@throws` | 例外の説明 | `@throws エラーが発生する条件` |
| `@example` | 使用例 | `@example コード例` |
| `@see` | 関連情報 | `@see {@link OtherFunction}` |

### TypeScript固有タグ

| タグ | 用途 | 例 |
|---|---|---|
| `@typeParam` | 型パラメータ説明 | `@typeParam T - ジェネリック型` |
| `@defaultValue` | デフォルト値 | `@defaultValue undefined` |
| `@internal` | 内部実装 | `@internal` |
| `@public` | 公開API | `@public` |
| `@packageDocumentation` | パッケージドキュメント | ファイル先頭に使用 |

### モジュールドキュメント用タグ

| タグ | 用途 | 例 |
|---|---|---|
| `@packageDocumentation` | モジュール全体のドキュメント | ファイル先頭に使用 |
| `@module` | モジュール名（JSDoc互換） | `@module calculator` |

## 使用例

### 例1: 関数のドキュメント生成

```bash
/doc src/lib/calculator.ts

# 実行結果:
# 📝 ドキュメント生成（TSDoc形式）: src/lib/calculator.ts
#
# ✅ ファイルの先頭に@packageDocumentationコメントを追加しました
# ✅ 3個の関数にTSDocコメントを追加しました
#   - calculateProductionChain
#   - buildRecipeTree
#   - aggregateResults
#
# ✅ 5個の型定義にコメントを追加しました
#   - CalculationResult
#   - RecipeNode
#   - AggregatedData
#   - BuildingCount
#   - PowerConsumption
#
# ✅ 使用例を3個生成しました
#
# 📝 TSDoc形式: @remarks, @typeParam などを使用
# 📝 変更内容を確認してください（git diff）
```

### 例2: Reactコンポーネントのドキュメント生成

```bash
/doc src/components/MiningCalculator/MiningCalculator.tsx

# 実行結果:
# 📝 ドキュメント生成（TSDoc形式）: src/components/MiningCalculator/MiningCalculator.tsx
#
# ✅ コンポーネントのTSDocコメントを追加しました
#   - MiningCalculator（@remarks, @example を使用）
#
# ✅ Props型にコメントを追加しました
#   - MiningCalculatorProps (4個のプロパティ)
#   - @defaultValue タグでデフォルト値を明記
#
# ✅ 使用例を2個生成しました
#   - 基本的な使い方
#   - カスタムスタイルを適用する場合
#
# 📝 変更内容を確認してください
```

### 例3: カスタムフックのドキュメント生成

```bash
/doc src/hooks/useProductionCalculation.ts

# 実行結果:
# 📝 ドキュメント生成（TSDoc形式）: src/hooks/useProductionCalculation.ts
#
# ✅ カスタムフックのTSDocコメントを追加しました
#   - useProductionCalculation
#   - @remarks で詳細な動作説明を追加
#
# ✅ 使用例を2個生成しました
#   - 基本的な使い方
#   - ノードオーバーライドを使用する場合
#
# 📝 変更内容を確認してください
```

## 生成されるTSDocの構成

### 1. @packageDocumentation

ファイル全体の説明（モジュールドキュメント）：
- ファイルの目的
- 主要な機能
- 使用例
- 関連ドキュメントへのリンク

**特徴**: ファイルの先頭に配置、`@packageDocumentation` タグを使用

### 2. @remarks

詳細説明：
- 関数・クラスの詳細な動作説明
- アルゴリズムの説明
- 注意事項・制約

**特徴**: 一行サマリーの後に詳細を記述

### 3. @param

パラメータの説明：
- パラメータ名
- 説明（TypeScript型は自動参照）
- デフォルト値（あれば）

**特徴**: JSDocと異なり、型は `@param {型}` ではなくTypeScript型定義を参照

### 4. @typeParam

型パラメータ（ジェネリクス）の説明：
- 型パラメータ名
- 型の制約
- 使用例

**特徴**: JSDocの `@template` の代わり

### 5. @returns

戻り値の説明：
- 説明（TypeScript型は自動参照）

**特徴**: 型情報は省略可能（TypeScriptから自動推論）

### 6. @throws

例外の説明：
- 例外が発生する条件

**特徴**: JSDocと異なり、型は `@throws {Error}` ではなく説明のみ

### 7. @example

使用例：
- 基本的な使い方
- 応用例
- エッジケース

**特徴**: 複数の `@example` を記述可能

### 8. @see

関連情報：
- 関連するドキュメント
- 参考URL（`{@link URL | テキスト}` 形式）
- 関連する関数・モジュール（`{@link FunctionName}` 形式）

### 9. @defaultValue

デフォルト値：
- オプショナルパラメータのデフォルト値を明記

**特徴**: JSDocにはない、TSDoc固有のタグ

### 10. @internal / @public

可視性：
- `@internal`: 内部実装（公開APIではない）
- `@public`: 公開API

**特徴**: JSDocの `@private` / `@public` の代わり

## TSDocs vs JSDocの違い（まとめ）

| 項目 | JSDoc | TSDoc |
|---|---|---|
| **型情報の記述** | `@param {string} name` | `@param name` (TypeScript型から自動参照) |
| **型パラメータ** | `@template T` | `@typeParam T` |
| **詳細説明** | なし | `@remarks` |
| **デフォルト値** | なし | `@defaultValue` |
| **可視性** | `@private`, `@public` | `@internal`, `@public` |
| **モジュール** | `@module` | `@packageDocumentation` |
| **例外の型** | `@throws {Error}` | `@throws` (説明のみ) |
| **リンク** | `@see` | `@see {@link URL \| text}` |

**TypeScriptプロジェクトではTSDocを推奨**:
- 型情報の重複を避ける
- TypeScriptの型システムと統合
- より簡潔で保守しやすい

## 注意事項

1. **既存のコメントは保持**
   - 既にTSDoc/JSDocコメントがある場合は上書きしません
   - 不足している部分のみを追加します

2. **生成後は必ず確認**
   - 自動生成されたコメントは完璧ではありません
   - 内容を確認して必要に応じて修正してください

3. **複雑なロジックには手動でコメント追加**
   - アルゴリズムの説明 → `@remarks` に記載
   - なぜその実装をしたのか → `@remarks` に記載
   - 制限事項・注意事項 → `@remarks` に記載

4. **TypeScript型定義を優先**
   - 型定義が明確な場合、コメントは簡潔に
   - 型だけでは分からない情報（ビジネスロジック、制約など）をコメントに記載
   - `@param {型}` ではなく、TypeScript型定義を使用

5. **日本語と英語の選択**
   - プロジェクトの方針に従ってください
   - このプロジェクトでは日本語を使用

6. **TSDoc形式を維持**
   - `@template` ではなく `@typeParam` を使用
   - `@private` ではなく `@internal` を使用
   - 詳細説明は `@remarks` に記載

## ワークフローへの組み込み

### 新機能追加時

```bash
# 1. 機能実装
# ... コード実装 ...

# 2. ドキュメント生成
/doc src/lib/newFeature.ts

# 3. 生成されたコメントを確認・修正
# ... コメント確認 ...

# 4. テスト追加
# ... テスト実装 ...

# 5. コミット
git add src/lib/newFeature.ts
git commit -m "feat: 新機能を追加"
```

### リファクタリング時

```bash
# 1. リファクタリング実施
# ... コード整理 ...

# 2. 既存のコメントを確認
/doc src/lib/refactoredFile.ts

# 3. 不足しているコメントを追加
# ... コメント追加 ...

# 4. コミット
git commit -m "refactor: コードを整理"
```

---

**ドキュメントはコードの可読性と保守性を大幅に向上させます。新しい関数・コンポーネントには必ずドキュメントを追加してください。**

