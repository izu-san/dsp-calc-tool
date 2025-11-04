# 履歴・バージョン管理機能 仕様書

## 概要

本機能は、アプリケーション内の状態変更（設定変更・プラン変更）を履歴として記録し、Undo/Redo機能、プランのバージョン管理、差分表示を提供する。

**関連Issue**: [#68](https://github.com/izu-san/dsp-calc-tool/issues/68)

## 対象範囲

### 履歴管理対象

以下の状態変更を履歴として記録する：

1. **設定変更 (`GlobalSettings`)**
   - 増産剤設定
   - 施設ランク設定
   - コンベアベルト設定
   - ソーター設定
   - 代替レシピ設定
   - 採掘速度研究ボーナス
   - 増産剤倍率設定
   - 光子生成設定

2. **ノードオーバーライド設定 (`NodeOverrideSettings`)**
   - ノードごとの増産剤設定変更
   - ノードごとの施設ランク設定変更

3. **プラン変更**
   - レシピ選択変更
   - 目標生産量変更
   - プラン保存（バージョン管理）

4. **発電設備設定**
   - 発電設備テンプレート変更
   - 手動発電設備選択
   - 手動燃料選択
   - 燃料増産剤設定

### 履歴管理対象外

以下の状態は履歴管理の対象外とする：

- 計算結果（`CalculationResult`） - 常に最新状態から再計算されるため
- UI状態（ツリーの折りたたみ状態など） - 一時的な表示状態のため
- お気に入りレシピ - 独立した機能として扱う

## 機能仕様

### 1. Undo/Redo機能

#### 1.1 基本仕様

- **履歴スタック**: 双方向リンクリストまたは配列で実装
- **履歴の保存タイミング**: 状態変更後、一定時間（デバウンス）後に保存
- **履歴の保存上限**: 50件（設定可能）
- **現在位置**: 履歴スタック内の現在位置を記録

#### 1.2 Undo操作

- **アクション**: Ctrl+Z（または ⌘+Z）で実行
- **動作**: 現在位置を1つ前に移動し、その時点の状態を復元
- **制限**: 履歴の最初まで到達した場合は無効化
- **UI表示**: Undoボタンの有効/無効状態を表示

#### 1.3 Redo操作

- **アクション**: Ctrl+Y（または ⌘+Shift+Z）で実行
- **動作**: 現在位置を1つ後に移動し、その時点の状態を復元
- **制限**: 履歴の最後まで到達した場合は無効化
- **UI表示**: Redoボタンの有効/無効状態を表示

#### 1.4 履歴の分岐処理

- **新規操作時の動作**: 現在位置以降の履歴を削除し、新しい履歴を追加
- **例**: Undo後、設定を変更した場合、Redo履歴は削除される

#### 1.5 履歴保存のデバウンス

- **デバウンス時間**: 500ms
- **理由**: 連続する操作を1つの履歴エントリとしてまとめる
- **例外**: プラン保存操作は即座に履歴に追加

### 2. 設定変更履歴

#### 2.1 履歴エントリ構造

```typescript
interface HistoryEntry {
  id: string; // 一意のID（UUID）
  timestamp: number; // 変更時刻
  type: "settings" | "nodeOverride" | "plan" | "powerGeneration";
  description: string; // 変更内容の説明（例: "増産剤をmk1に変更"）
  // 変更されたプロパティのみを保存（差分形式）
  changes: {
    // 変更されたプロパティのパス -> 値
    // 例: { 'settings.proliferator.type': 'mk1', 'settings.proliferator.mode': 'speed' }
    [path: string]: unknown;
  };
  // プラン保存の場合のみ、完全なプランデータを保存（オプショナル）
  planSnapshot?: SavedPlan;
  // 履歴エントリのバージョン（マイグレーション用）
  version?: string; // 例: "1.0.0"
  affectedNodes?: string[]; // 影響を受けたノードID（nodeOverrideの場合）
}
```

**注意**: この構造は容量制限への対応として決定した差分形式です（詳細は「レビュー・検討事項と決定事項」のセクション1を参照）。

#### 2.2 変更検出

- **設定変更の検出**: Zustandストアの各`set`関数をラップして変更を検出
- **変更前の状態**: 変更検出時に現在の状態をスナップショットとして保存
- **変更後の状態**: 変更後の状態を保存

#### 2.3 変更説明の生成

以下のルールで変更説明を自動生成：

- `setProliferator`: "増産剤を{type}に変更（{mode}）"
- `setMachineRank`: "{recipeType}を{rank}に変更"
- `setConveyorBelt`: "コンベアベルトを{tier}に変更"
- `setSorter`: "ソーターを{tier}に変更"
- `setAlternativeRecipe`: "{itemName}の代替レシピを変更"
- `setNodeOverride`: "ノード{nodeId}の設定を変更"
- `setSelectedRecipe`: "レシピを{recipeName}に変更"
- `setTargetQuantity`: "目標生産量を{quantity}に変更"

#### 2.4 履歴の永続化

- **保存先**: localStorage（履歴ストア）
- **保存形式**: JSON形式
- **保存キー**: `dsp-calculator-history`
- **最大保存数**: 50件（設定可能）

### 3. プランバージョン管理

#### 3.1 バージョン概念

- **プランID**: 各プランに一意のIDを付与
- **バージョン番号**: プラン保存時に自動的にバージョンを付与（1, 2, 3...）
- **バージョン履歴**: 同一プランIDの複数バージョンを保持

#### 3.2 プラン保存時の動作

```typescript
interface SavedPlanVersion {
  planId: string; // プランID（UUID）
  version: number; // バージョン番号
  timestamp: number; // 保存時刻
  plan: SavedPlan; // プランデータ
  description?: string; // バージョン説明（オプション）
  changes?: string[]; // 変更点のリスト（オプション）
}
```

#### 3.3 プラン保存フロー

1. ユーザーがプランを保存
2. 既存のプランIDがある場合は、新しいバージョンとして保存
3. 新しいプランの場合は、新しいプランIDを生成
4. バージョン番号を自動インクリメント
5. 前バージョンとの差分を自動検出（オプション）
6. 履歴に記録

#### 3.4 バージョン履歴の表示

- **表示場所**: プラン読み込みダイアログ内
- **表示内容**:
  - バージョン番号
  - 保存日時
  - 変更説明（ある場合）
  - 前バージョンとの差分（差分表示機能を使用）

#### 3.5 バージョン復元

- **復元方法**: プラン読み込みダイアログから特定バージョンを選択して読み込み
- **動作**: 選択したバージョンのプランを復元

### 4. 差分表示

#### 4.1 差分計算

- **比較対象**: 2つの状態（履歴エントリまたはプランバージョン）
- **差分アルゴリズム**: Deep diffを使用
- **差分の種類**:
  - 追加: 新しいプロパティが追加された
  - 削除: プロパティが削除された
  - 変更: プロパティの値が変更された

#### 4.2 差分表示形式

```typescript
interface DiffEntry {
  path: string; // プロパティのパス（例: "settings.proliferator.type"）
  type: "add" | "remove" | "change";
  before?: unknown; // 変更前の値（削除・変更の場合）
  after?: unknown; // 変更後の値（追加・変更の場合）
}
```

#### 4.3 差分表示UI

- **表示形式**: ツリービューまたはテーブル形式
- **色分け**:
  - 追加: 緑色
  - 削除: 赤色
  - 変更: 黄色
- **値の表示**: JSON形式または読みやすい形式で表示

#### 4.4 差分表示の使用箇所

1. **履歴エントリの詳細表示**: 履歴ダイアログで選択したエントリの変更内容を表示
2. **プランバージョン比較**: プラン読み込みダイアログでバージョン間の差分を表示
3. **Undo/Redoプレビュー**: Undo/Redo操作時にプレビューとして差分を表示（オプション）

## 実装設計

### 1. 履歴管理ストア

#### 1.1 ストア構造

```typescript
interface HistoryStore {
  // 履歴スタック
  entries: HistoryEntry[];
  // 現在位置（インデックス）
  currentIndex: number;
  // 最大履歴数
  maxHistorySize: number;

  // アクション
  pushEntry: (entry: HistoryEntry) => void;
  undo: () => HistoryEntry | null;
  redo: () => HistoryEntry | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  // プラン関連
  planVersions: Map<string, SavedPlanVersion[]>; // planId -> versions
  savePlanVersion: (plan: SavedPlan, planId?: string) => string; // planIdを返す
  getPlanVersions: (planId: string) => SavedPlanVersion[];
  loadPlanVersion: (planId: string, version: number) => SavedPlan | null;
}
```

#### 1.2 永続化

- **保存先**: localStorage
- **保存キー**: `dsp-calculator-history-store`
- **保存タイミング**: 履歴エントリ追加時、Undo/Redo時

### 2. 状態変更の検出

#### 2.1 ストアラッパー

既存のZustandストアをラップして変更を検出：

```typescript
// settingsStore.ts のラッパー例
export const useSettingsStoreWithHistory = () => {
  const store = useSettingsStore();
  const history = useHistoryStore();

  // 各set関数をラップ
  const setProliferatorWithHistory = (type, mode) => {
    const before = store.settings.proliferator;
    store.setProliferator(type, mode);
    const after = store.settings.proliferator;

    history.pushEntry({
      id: generateId(),
      timestamp: Date.now(),
      type: "settings",
      description: `増産剤を${type}に変更（${mode}）`,
      before: { proliferator: before },
      after: { proliferator: after },
    });
  };

  return {
    ...store,
    setProliferator: setProliferatorWithHistory,
    // ... 他の関数も同様にラップ
  };
};
```

#### 2.2 デバウンス処理

- **ライブラリ**: `lodash.debounce` または `useDebounce`フックを使用
- **デバウンス時間**: 500ms
- **適用対象**: 設定変更のみ（プラン保存は即座に記録）

### 3. 差分計算ライブラリ

#### 3.1 ライブラリ選択

- **候補**: `deep-diff` または `fast-deep-equal` + 独自実装
- **推奨**: `deep-diff` または `react-diff-viewer`（UI表示用）

#### 3.2 差分計算の実装

```typescript
import { diff } from "deep-diff";

function calculateDiff(before: unknown, after: unknown): DiffEntry[] {
  const differences = diff(before, after);
  if (!differences) return [];

  return differences.map(d => ({
    path: d.path?.join(".") || "",
    type: d.kind === "N" ? "add" : d.kind === "D" ? "remove" : "change",
    before: d.kind !== "N" ? d.lhs : undefined,
    after: d.kind !== "D" ? d.rhs : undefined,
  }));
}
```

### 4. UIコンポーネント

#### 4.1 Undo/Redoボタン

- **配置**: トップバーまたはツールバー
- **表示**: アイコンボタン（← Undo, → Redo）
- **状態**: 無効化時はグレーアウト

#### 4.2 履歴ダイアログ

- **開き方**: メニューから「履歴」を選択
- **表示内容**:
  - 履歴エントリのリスト（時系列順）
  - 各エントリの説明とタイムスタンプ
  - 選択したエントリの差分表示

#### 4.3 プランバージョンダイアログ

- **開き方**: プラン読み込みダイアログ内で「バージョン履歴」ボタンをクリック
- **表示内容**:
  - プランのバージョンリスト
  - 各バージョンの保存日時と説明
  - バージョン間の差分表示

#### 4.4 差分表示コンポーネント

- **形式**: ツリービューまたはテーブル
- **色分け**: 追加（緑）、削除（赤）、変更（黄）
- **展開/折りたたみ**: 大きな差分の場合、折りたたみ可能

## 実装時の注意点

### 1. パフォーマンス

- **履歴サイズの制限**: 最大50件で制限し、古い履歴から削除
- **差分計算の最適化**: 大きなオブジェクトの差分計算はバックグラウンドで実行
- **メモリリーク**: 履歴エントリのbefore/afterは必要に応じてシリアライズ

### 2. データ整合性

- **状態の復元**: Undo/Redo時に状態を完全に復元できることを保証
- **計算結果の再計算**: 状態復元後、計算結果を再計算する
- **エラーハンドリング**: 履歴からの復元に失敗した場合のフォールバック処理

### 3. ユーザビリティ

- **変更説明の分かりやすさ**: 技術的な値ではなく、ユーザーが理解しやすい説明
- **履歴の視認性**: 履歴ダイアログで変更内容を一目で把握できる
- **操作の予測可能性**: Undo/Redo操作が期待通りに動作することを保証

### 4. 後方互換性

- **既存データ**: 既存のlocalStorageデータとの互換性を保つ
- **バージョン管理**: 履歴ストアのバージョンも管理し、将来の拡張に対応

## 実装フェーズ

### フェーズ1: 基本機能

1. 履歴管理ストアの実装
2. 状態変更の検出（基本的な設定変更のみ）
3. Undo/Redo機能の実装
4. UIボタンの追加

### フェーズ2: 履歴表示

1. 履歴ダイアログの実装
2. 履歴エントリの表示
3. 差分計算ライブラリの統合
4. 差分表示UIの実装

### フェーズ3: プランバージョン管理

1. プランバージョンの保存機能
2. バージョン履歴の表示
3. バージョン間の差分表示
4. バージョン復元機能

### フェーズ4: 拡張機能

1. 全ての状態変更の履歴化
2. 履歴の検索機能
3. 履歴のフィルタリング機能

## テスト計画

### 単体テスト

- 履歴管理ストアのテスト
- 差分計算関数のテスト
- 状態変更検出のテスト

### 統合テスト

- Undo/Redo操作のテスト
- プランバージョン管理のテスト
- 履歴の永続化のテスト

### E2Eテスト

- Undo/Redo操作のフロー
- プランバージョン管理のフロー
- 差分表示のフロー

## 将来の拡張可能性

1. **履歴のエクスポート/インポート**: 履歴をファイルとして保存・読み込み
2. **履歴の検索**: 履歴エントリを検索する機能
3. **履歴のフィルタリング**: 特定の種類の変更のみを表示
4. **履歴の共有**: 履歴をURLで共有（プラン共有の拡張）
5. **変更の自動保存**: 一定時間ごとに自動的にプランを保存（オプション）

## レビュー・検討事項と決定事項

### 1. localStorage容量制限への対応 ✅ 決定

#### 問題点

- **localStorageの容量制限**: 通常5-10MB（ブラウザ依存）
- **履歴データのサイズ**: 1つの履歴エントリが数十KBになる可能性
- **50件の履歴**: 最大で数MBになる可能性

#### 対策案

1. **差分のみ保存**: 完全な状態ではなく、変更差分のみを保存
   - `before`/`after`を完全な状態ではなく、変更されたプロパティのみ保存
   - 例: `{ proliferator: { type: 'mk1', mode: 'speed' } }` のみ保存

2. **履歴サイズの動的調整**
   - localStorageの残り容量を監視
   - 容量不足時は古い履歴から自動削除
   - ユーザーに通知

3. **履歴の圧縮**
   - JSON圧縮ライブラリを使用（`pako`など）
   - ただし、圧縮/展開のオーバーヘッドを考慮

4. **重要な履歴のみ保存**
   - プラン保存などの重要な操作のみ完全な状態を保存
   - 通常の設定変更は差分のみ保存

**推奨**: 対策1（差分のみ保存）を基本とし、対策2（動的調整）を組み合わせる

#### ✅ 決定事項

**採用する対策**:

- **対策1（差分のみ保存）**: 完全に採用
  - `before`/`after`には変更されたプロパティのみを保存
  - 履歴エントリの構造を変更: `HistoryEntry.before`と`HistoryEntry.after`は部分的な状態のみ
- **対策2（動的調整）**: 簡易版を採用
  - 履歴エントリ数で制限（最大50件）を実装
  - localStorage容量監視は初期実装では省略（将来の拡張として検討）
- **対策4（重要な履歴のみ完全保存）**: プラン保存操作のみ採用
  - プラン保存時のみ、完全なプランデータを履歴に保存
  - 通常の設定変更は差分のみ

**履歴エントリの新構造**:

```typescript
interface HistoryEntry {
  id: string;
  timestamp: number;
  type: "settings" | "nodeOverride" | "plan" | "powerGeneration";
  description: string;
  // 変更されたプロパティのみを保存（差分形式）
  changes: {
    // 変更されたプロパティのパス -> 値
    // 例: { 'settings.proliferator.type': 'mk1', 'settings.proliferator.mode': 'speed' }
    [path: string]: unknown;
  };
  // プラン保存の場合のみ、完全なプランデータを保存（オプショナル）
  planSnapshot?: SavedPlan;
}
```

**理由**:

- 差分のみ保存することで、1エントリあたりのサイズを大幅に削減（数KB程度）
- 50件の履歴でも数百KB程度に収まる見込み
- プラン保存のみ完全保存することで、重要な状態を確実に保持

### 2. 既存プランとの統合 ✅ 決定

#### 問題点

- **既存のプラン保存機能**: `planExport.ts`で既にプラン保存機能が実装されている
- **プランIDの管理**: 既存のプランにはプランIDがない
- **後方互換性**: 既存のプランを壊さないようにする必要がある

#### 対策案

1. **既存プランへのプランID付与**
   - 既存プラン読み込み時に、プランIDを自動生成して付与
   - 初回保存時にバージョン1として扱う

2. **プランIDの保存場所**
   - `SavedPlan`に`planId`フィールドを追加（オプショナル）
   - 既存プランは`planId`なしで動作

3. **プラン保存時の動作変更**
   ```typescript
   // プラン保存時にプランIDを管理
   const savedPlan = loadPlanFromLocalStorage(key);
   if (savedPlan?.planId) {
     // 既存のプランIDを使用
     savePlanVersion(newPlan, savedPlan.planId);
   } else {
     // 新しいプランIDを生成
     const planId = generatePlanId();
     savePlanVersion(newPlan, planId);
     // 既存プランにもプランIDを付与
     updatePlanWithId(key, planId);
   }
   ```

**推奨**: 対策1と対策2を組み合わせる

#### ✅ 決定事項

**採用する対策**:

- **対策1（既存プランへのプランID付与）**: 完全に採用
  - 既存プランの読み込み時に、プランIDを自動生成して付与
  - 初回保存時にバージョン1として扱う
  - 既存プランは読み込み時に自動的に`planId`を付与（メモリ上のみ、localStorageには保存しない）
- **対策2（プランIDの保存場所）**: 完全に採用
  - `SavedPlan`に`planId?: string`フィールドを追加（オプショナル）
  - 既存プランは`planId`なしで動作（後方互換性）
- **対策3（プラン保存時の動作変更）**: 完全に採用

**実装方針**:

```typescript
// SavedPlan型の拡張
interface SavedPlan {
  // ... 既存のフィールド
  planId?: string; // 新規追加（オプショナル）
  version?: number; // 新規追加（オプショナル、バージョン管理用）
}

// プラン保存時の処理
function savePlanWithVersionManagement(plan: SavedPlan): void {
  // 1. 既存のプランを確認（同じ名前で探す、またはplanIdで探す）
  const existingPlan = findExistingPlan(plan.name, plan.planId);

  if (existingPlan?.planId) {
    // 既存のプランIDを使用、バージョンをインクリメント
    const newVersion = (existingPlan.version || 1) + 1;
    plan.planId = existingPlan.planId;
    plan.version = newVersion;
  } else {
    // 新しいプランIDを生成
    plan.planId = generateUUID();
    plan.version = 1;
  }

  // 2. プランバージョン履歴に保存
  savePlanVersion(plan);

  // 3. 既存の保存処理も継続（後方互換性）
  savePlanToLocalStorage(plan);
}
```

**既存プランへの対応**:

- 既存プランを読み込む際、`planId`がない場合は自動生成（メモリ上のみ）
- 既存プランを保存し直すと、プランIDとバージョンが付与される
- 既存のプラン保存機能（`planExport.ts`）はそのまま維持

**理由**:

- 後方互換性を保ちながら、段階的にバージョン管理機能を導入できる
- 既存ユーザーのデータを壊さない

### 3. デバウンス処理の詳細化 ✅ 決定

#### 検討事項

- **デバウンス時間の調整**: 500msが適切か？
- **操作の種類による違い**: 連続する操作をまとめるか、別々に記録するか
- **ユーザー体験**: デバウンスが長すぎると、即座にUndoできない問題

#### 対策案

1. **操作の種類による分岐**

   ```typescript
   const DEBOUNCE_TIMES = {
     settings: 500, // 設定変更は500ms
     plan: 0, // プラン変更は即座
     nodeOverride: 300, // ノード設定は300ms
   };
   ```

2. **操作の重要度による分岐**
   - 重要な操作（プラン保存、レシピ変更）: 即座に記録
   - 通常の操作（設定変更）: デバウンス
   - 連続操作（スライダーの連続変更）: デバウンス

3. **デバウンスのキャンセル**
   - Undo操作時は、デバウンス中の履歴追加をキャンセル
   - 現在の状態を正確に反映

**推奨**: 対策1と対策2を組み合わせる

#### ✅ 決定事項

**採用する対策**:

- **対策1（操作の種類による分岐）**: 完全に採用
  ```typescript
  const DEBOUNCE_TIMES = {
    settings: 500, // 設定変更は500ms
    plan: 0, // プラン変更（レシピ選択、目標生産量変更）は即座
    nodeOverride: 300, // ノード設定は300ms（スライダー操作を想定）
    powerGeneration: 500, // 発電設備設定は500ms
  };
  ```
- **対策2（操作の重要度による分岐）**: 完全に採用
  - **即座に記録**: プラン保存、レシピ選択変更、目標生産量変更
  - **デバウンス適用**: 通常の設定変更（増産剤、施設ランクなど）、ノード設定
- **対策3（デバウンスのキャンセル）**: 完全に採用
  - Undo/Redo操作時は、デバウンス中の履歴追加をキャンセル
  - 現在の状態を正確に反映

**実装方針**:

```typescript
// デバウンス管理
class HistoryDebouncer {
  private timers = new Map<string, NodeJS.Timeout>();

  debounce(entry: HistoryEntry, delay: number, callback: (entry: HistoryEntry) => void): void {
    const key = `${entry.type}_${entry.id}`;

    // 既存のタイマーをクリア
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }

    // 新しいタイマーを設定
    const timer = setTimeout(() => {
      callback(entry);
      this.timers.delete(key);
    }, delay);

    this.timers.set(key, timer);
  }

  cancel(type: string): void {
    // 特定タイプのデバウンスをキャンセル
    for (const [key, timer] of this.timers.entries()) {
      if (key.startsWith(type)) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
    }
  }
}
```

**理由**:

- 操作の種類に応じたデバウンスで、UXを最適化
- 重要な操作は即座に記録し、連続操作はまとめる

### 4. 状態復元時の計算結果の扱い ✅ 決定

#### 問題点

- **計算結果の再計算**: 状態復元後、計算結果を再計算する必要がある
- **パフォーマンス**: 大きなプランの場合、再計算に時間がかかる
- **UIの応答性**: 再計算中はUIがブロックされないようにする必要がある

#### 対策案

1. **計算結果のキャッシュ**
   - 履歴エントリに計算結果のハッシュを保存
   - 同じ設定の場合は再計算をスキップ

2. **非同期再計算**
   - 状態復元後、非同期で計算結果を再計算
   - 再計算中は「計算中...」の表示

3. **計算結果の履歴保存（オプション）**
   - 重要な履歴エントリのみ計算結果を保存
   - ただし、データサイズが大きくなるため注意

**推奨**: 対策2（非同期再計算）を基本とし、必要に応じて対策1（キャッシュ）を追加

#### ✅ 決定事項

**採用する対策**:

- **対策2（非同期再計算）**: 完全に採用
  - 状態復元後、既存の`useProductionCalculation`フックが自動的に再計算を実行
  - 再計算中は計算結果が`null`になり、UI側で「計算中...」を表示（既存の仕組みを活用）
  - 特別な実装は不要（既存の計算フローを活用）
- **対策1（計算結果のキャッシュ）**: 初期実装では省略
  - パフォーマンス問題が発生した場合、将来の拡張として検討
  - 複雑性を避けるため、初期実装では採用しない

**実装方針**:

```typescript
// Undo/Redo時の状態復元
function restoreStateFromHistory(entry: HistoryEntry): void {
  // 1. 状態を復元
  applyStateChanges(entry.changes);

  // 2. 計算結果をクリア（nullに設定）
  setCalculationResult(null);

  // 3. useProductionCalculationフックが自動的に再計算を実行
  // （既存の仕組みをそのまま活用）
}
```

**既存の計算フローの活用**:

- `useProductionCalculation`フックが`settings`や`nodeOverrides`の変更を監視
- 状態復元後、自動的に再計算が実行される
- 追加の実装は不要

**理由**:

- 既存の計算フローを最大限活用し、実装コストを削減
- キャッシュは将来の最適化として検討

### 5. エラーハンドリングの詳細化 ✅ 決定

#### 検討事項

- **履歴からの復元失敗**: 履歴エントリが破損している場合
- **状態の不整合**: 復元後の状態が無効な場合
- **後方互換性**: 古い形式の履歴エントリの扱い

#### 対策案

1. **履歴エントリの検証**

   ```typescript
   function validateHistoryEntry(entry: HistoryEntry): ValidationResult {
     // 必須フィールドの検証
     if (!entry.id || !entry.timestamp || !entry.type) {
       return { valid: false, error: "Invalid entry structure" };
     }
     // 型の検証
     if (!["settings", "nodeOverride", "plan", "powerGeneration"].includes(entry.type)) {
       return { valid: false, error: "Invalid entry type" };
     }
     return { valid: true };
   }
   ```

2. **フォールバック処理**
   - 履歴からの復元に失敗した場合、現在の状態を保持
   - ユーザーに通知し、履歴エントリをスキップ

3. **履歴のマイグレーション**
   - 古い形式の履歴エントリを新しい形式に変換
   - バージョン情報を履歴エントリに保存

**推奨**: 対策1、対策2、対策3を全て実装

#### ✅ 決定事項

**採用する対策**:

- **対策1（履歴エントリの検証）**: 完全に採用
  - 履歴エントリの読み込み時に検証
  - 無効なエントリはスキップ
- **対策2（フォールバック処理）**: 完全に採用
  - 復元失敗時は現在の状態を保持
  - ユーザーに通知（トーストメッセージ）
  - 無効なエントリを履歴から削除（オプション）
- **対策3（履歴のマイグレーション）**: 完全に採用
  - 履歴エントリにバージョン情報を追加
  - 古い形式のエントリを新しい形式に変換

**実装方針**:

```typescript
// 履歴エントリの検証
interface ValidationResult {
  valid: boolean;
  error?: string;
}

function validateHistoryEntry(entry: unknown): ValidationResult {
  // 型ガード
  if (!isHistoryEntry(entry)) {
    return { valid: false, error: "Invalid entry structure" };
  }

  // 必須フィールドの検証
  if (!entry.id || !entry.timestamp || !entry.type) {
    return { valid: false, error: "Missing required fields" };
  }

  // 型の検証
  const validTypes = ["settings", "nodeOverride", "plan", "powerGeneration"];
  if (!validTypes.includes(entry.type)) {
    return { valid: false, error: `Invalid entry type: ${entry.type}` };
  }

  // バージョン情報の確認（マイグレーション用）
  if (!entry.version) {
    // 古い形式のエントリとして扱う
    return { valid: true, needsMigration: true };
  }

  return { valid: true };
}

// 履歴エントリのマイグレーション
function migrateHistoryEntry(entry: unknown): HistoryEntry | null {
  if (!isHistoryEntry(entry)) return null;

  // バージョン1（初期形式）から最新形式への変換
  if (!entry.version || entry.version === "1.0.0") {
    return {
      ...entry,
      version: HISTORY_VERSION,
      // 古い形式のbefore/afterをchanges形式に変換
      changes: convertToChangesFormat(entry.before, entry.after),
    };
  }

  return entry;
}
```

**履歴エントリのバージョン管理**:

```typescript
interface HistoryEntry {
  // ... 既存のフィールド
  version?: string; // 履歴エントリのバージョン（例: "1.0.0"）
}
```

**理由**:

- データの整合性を保証
- 将来の拡張に対応
- ユーザー体験を損なわない

### 6. パフォーマンス最適化 ✅ 決定

#### 検討事項

- **履歴エントリの大量保存**: 50件の履歴を全てlocalStorageに保存すると重い
- **差分計算のコスト**: 大きなオブジェクトの差分計算は重い
- **UIの応答性**: 履歴操作時にUIがブロックされないようにする

#### 対策案

1. **履歴の段階的ロード**
   - 最新10件のみメモリに保持
   - 古い履歴はlocalStorageから必要に応じて読み込み

2. **差分計算の最適化**
   - 大きなオブジェクトの差分計算はWeb Workerで実行
   - キャッシュを使用して同じ差分を再計算しない

3. **バッチ操作**
   - 複数の状態変更を1つの履歴エントリにまとめる
   - 例: テンプレート適用時は、個別の設定変更ではなく1つのエントリとして保存

**推奨**: 対策1と対策3を実装、対策2は必要に応じて追加

#### ✅ 決定事項

**採用する対策**:

- **対策3（バッチ操作）**: 完全に採用
  - テンプレート適用時は、個別の設定変更ではなく1つのエントリとして保存
  - 例: `applyTemplate('early-game')` → "テンプレート「早期ゲーム」を適用" という1つのエントリ
  - `restorePlan`時も同様に1つのエントリとして記録
- **対策1（履歴の段階的ロード）**: 初期実装では省略
  - 50件の履歴を全てメモリに保持する（実装を簡素化）
  - パフォーマンス問題が発生した場合、将来の拡張として検討
- **対策2（差分計算の最適化）**: 初期実装では省略
  - 差分計算は同期的に実行（実装を簡素化）
  - 大きなオブジェクトの場合、計算に時間がかかる可能性があるが、初期実装では許容

**実装方針**:

```typescript
// バッチ操作の検出
function createBatchHistoryEntry(
  type: HistoryEntry["type"],
  description: string,
  changes: Record<string, unknown>
): HistoryEntry {
  return {
    id: generateUUID(),
    timestamp: Date.now(),
    type,
    description,
    changes,
    version: HISTORY_VERSION,
  };
}

// テンプレート適用時の処理
function applyTemplateWithHistory(templateId: string): void {
  const before = getCurrentState();

  // テンプレートを適用
  applyTemplate(templateId);

  const after = getCurrentState();

  // 変更差分を計算
  const changes = calculateChanges(before, after);

  // 1つの履歴エントリとして保存
  pushHistoryEntry(
    createBatchHistoryEntry("settings", `テンプレート「${templateId}」を適用`, changes)
  );
}
```

**理由**:

- バッチ操作により、履歴の可読性が向上
- 段階的ロードやWeb Workerは複雑性が高いため、初期実装では省略
- パフォーマンス問題が発生した場合、計測してから最適化

### 7. UI/UXの改善 ✅ 決定

#### 検討事項

- **Undo/Redo操作の視覚的フィードバック**: 操作が成功したことをユーザーに示す
- **履歴の見やすさ**: 履歴ダイアログで変更内容を一目で把握できる
- **操作の予測可能性**: Undo/Redo操作が期待通りに動作することを保証

#### 対策案

1. **操作の視覚的フィードバック**
   - Undo/Redo操作時に、変更内容をトーストで表示
   - 例: "増産剤設定を元に戻しました"

2. **履歴エントリの視覚化**
   - 変更タイプごとにアイコンを表示
   - 重要な変更は強調表示

3. **履歴のフィルタリング**
   - 変更タイプでフィルタリング
   - 日時でフィルタリング

**推奨**: 対策1と対策2を実装、対策3はフェーズ4で追加

#### ✅ 決定事項

**採用する対策**:

- **対策1（操作の視覚的フィードバック）**: 完全に採用
  - Undo/Redo操作時に、変更内容をトーストで表示
  - 例: "増産剤設定を元に戻しました" / "増産剤設定を再適用しました"
  - トースト表示は3秒後に自動消去
- **対策2（履歴エントリの視覚化）**: 完全に採用
  - 変更タイプごとにアイコンを表示
    - 設定変更: ⚙️
    - ノード設定: 🎯
    - プラン変更: 📋
    - 発電設備設定: ⚡
  - 重要な変更（プラン保存など）は強調表示（太字、色付け）
- **対策3（履歴のフィルタリング）**: フェーズ4で実装
  - 初期実装では省略
  - 必要に応じて将来追加

**実装方針**:

```typescript
// トースト通知
function showUndoRedoNotification(message: string, type: "undo" | "redo"): void {
  // トーストコンポーネントに通知
  toast.show({
    message,
    type: type === "undo" ? "info" : "success",
    duration: 3000,
  });
}

// 履歴エントリのアイコン取得
function getHistoryEntryIcon(type: HistoryEntry["type"]): string {
  const icons = {
    settings: "⚙️",
    nodeOverride: "🎯",
    plan: "📋",
    powerGeneration: "⚡",
  };
  return icons[type] || "📝";
}
```

**UI配置**:

- **Undo/Redoボタン**: トップバー（PlanManagerの横）に配置
- **履歴ダイアログ**: 設定パネルまたはメニューからアクセス
- **トースト**: 画面右下に表示（既存のトーストシステムがあれば活用）

**理由**:

- 視覚的フィードバックにより、ユーザーが操作の結果を把握しやすくなる
- アイコン表示により、履歴の視認性が向上
- フィルタリングは初期実装では不要（50件程度なら全て表示しても問題ない）

## 実装時の最終決定事項まとめ

### 1. 履歴エントリの構造

- **差分形式**: 変更されたプロパティのみを保存
- **プラン保存時のみ完全保存**: オプショナルで完全なプランデータを保存

### 2. デバウンス処理

- **操作の種類による分岐**: settings(500ms), plan(0ms), nodeOverride(300ms)
- **デバウンスのキャンセル**: Undo/Redo時は即座にキャンセル

### 3. プランバージョン管理

- **プランID**: `SavedPlan`にオプショナルフィールドとして追加
- **既存プラン対応**: 読み込み時に自動生成（メモリ上のみ）

### 4. 計算結果の扱い

- **非同期再計算**: 既存の`useProductionCalculation`フックを活用
- **キャッシュ**: 初期実装では省略

### 5. エラーハンドリング

- **検証**: 履歴エントリの読み込み時に検証
- **マイグレーション**: 古い形式のエントリを新しい形式に変換

### 6. パフォーマンス

- **バッチ操作**: テンプレート適用などを1つのエントリとして記録
- **段階的ロード**: 初期実装では省略（50件を全てメモリに保持）

### 7. UI/UX

- **トースト通知**: Undo/Redo操作時に通知
- **アイコン表示**: 変更タイプごとにアイコンを表示
- **フィルタリング**: フェーズ4で実装

## 参考資料

- [Zustand Middleware - History](https://github.com/pmndrs/zustand/wiki/Middleware)
- [React Diff Viewer](https://github.com/praneshr/react-diff-viewer)
- [deep-diff](https://github.com/flitbit/diff)
- [localStorage容量制限](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API)
