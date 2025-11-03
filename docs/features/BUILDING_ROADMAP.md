# 段階的建設計画（ロードマップ機能）仕様書

## 概要

本機能は、計算された生産チェーンを実際のゲーム内で構築する際に、段階的な建設計画をチェックリスト形式で表示・管理する機能です。

**関連Issue**: [#70](https://github.com/izu-san/dsp-calc-tool/issues/70)
**マイルストーン**: Version 0.0.2

## 目的

- 初心者に優しい段階的な建設ガイドを提供
- 末端素材（原材料）から完成品に向かって工場を構築する流れをサポート
- チェックリスト形式で建設進捗を管理
- 計画的な拡張を可能にする

## 機能仕様

### 1. フェーズ分割方式

#### 1.1 自動フェーズ分割

生産ツリーの階層（深さ）に基づいて自動的にフェーズを分割します。

**分割ルール**:

- **Phase 1**: 原材料の採掘（ツリーの最深層）
- **Phase 2**: 1次加工品（原材料の直接的な加工品）
- **Phase 3**: 2次加工品（1次加工品を使用する製品）
- **Phase N**: 最終製品に向かって順次階層を上る

**アルゴリズム**:

```typescript
function calculatePhases(rootNode: RecipeTreeNode): Map<number, PhaseNode[]> {
  const phases = new Map<number, PhaseNode[]>();

  function traverse(node: RecipeTreeNode, depth: number) {
    // depth = 0 が最終製品、depth が大きいほど原材料に近い
    const phase = depth + 1;

    if (!phases.has(phase)) {
      phases.set(phase, []);
    }

    phases.get(phase)!.push(createPhaseNode(node));

    // 子ノードを再帰的に処理
    node.children.forEach(child => {
      traverse(child, depth + 1);
    });
  }

  traverse(rootNode, 0);

  // フェーズ番号を逆順にする（Phase 1 が原材料になるように）
  return reversePhaseNumbers(phases);
}
```

#### 1.2 フェーズの表示順序

- フェーズは昇順（Phase 1 → Phase N）で表示
- 各フェーズ内のノードは以下の順序で表示:
  1. 採掘施設
  2. 製錬施設
  3. 組立施設
  4. その他の施設

### 2. 表示情報

#### 2.1 フェーズ単位の表示

各フェーズには以下の情報を表示:

```typescript
interface PhaseInfo {
  phaseNumber: number; // フェーズ番号（1, 2, 3...）
  title: string; // 自動生成されるタイトル（例: "Phase 1: 基礎素材採掘"）
  nodes: PhaseNode[]; // このフェーズに含まれるノード
  isCompleted: boolean; // フェーズ全体が完了したか
  completedCount: number; // 完了したノード数
  totalCount: number; // 総ノード数
}
```

**フェーズタイトルの自動生成ルール**:

- Phase 1（最深層）: "Phase 1: 原材料採掘"
- Phase 2以降: "Phase {N}: {主要生産物名}"
  - 主要生産物は、そのフェーズで最も多く生産されるアイテム

#### 2.2 ノード単位の表示

各ノードには以下の情報を表示:

```typescript
interface PhaseNode {
  nodeId: string; // ノードID
  itemName: string; // 生産物名
  machineType: string; // 施設タイプ（例: "Arc Smelter"）
  machineCount: number; // 必要施設数（切り上げ）
  isCompleted: boolean; // このノードの建設が完了したか

  // 表示用の追加情報
  itemIconPath?: string; // アイテムアイコンのパス
  machineIconPath?: string; // 施設アイコンのパス
}
```

**表示形式**:

```
☐ Iron Ingot × 10 (Arc Smelter Mk.I)
```

- チェックボックス: 未完了は `☐`、完了は `☑`
- アイテム名 × 施設数 (施設タイプ)
- アイコン: アイテムと施設のアイコンを表示

#### 2.3 原材料ノードの特別表示

原材料（採掘）ノードは特別な形式で表示:

```typescript
interface MiningPhaseNode extends PhaseNode {
  isMiningNode: true;
  miningFrom: string; // 採掘元（例: "Iron Ore Vein"）
  requiredRate: number; // 必要な採掘速度（個/秒）
}
```

**表示形式**:

```
☐ Iron Ore × 5 (Mining Machine)
   採掘速度: 30/s
```

### 3. チェックリスト機能

#### 3.1 チェック状態の管理

```typescript
interface BuildingRoadmapState {
  planId: string; // 現在のプランID
  phaseCompletions: Map<string, boolean>; // nodeId -> isCompleted
  lastUpdated: number; // 最終更新時刻
}
```

#### 3.2 チェック操作

- **個別ノードのチェック**: ノードごとにチェック/アンチェック可能
- **フェーズ一括チェック**: フェーズ全体を一括でチェック/アンチェック
- **自動チェック**: 前フェーズが全て完了したら次フェーズを自動的に展開（オプション）

#### 3.3 進捗表示

各フェーズの進捗率を表示:

```
Phase 1: 原材料採掘 (3/5 完了) [進捗バー: 60%]
```

#### 3.4 永続化

- **保存先**: localStorage
- **保存キー**: `dsp-calculator-roadmap-{planId}`
- **保存タイミング**: チェック状態変更時（デバウンス: 500ms）

### 4. UI設計

#### 4.1 ロードマップビュー

新しい独立したビューとして実装:

**配置**:

- タブバーに "Roadmap" タブを追加
- Statistics、Building Cost、Power Graph と同列のタブ

**レイアウト**:

```
┌─────────────────────────────────────┐
│ Roadmap                              │
├─────────────────────────────────────┤
│ ▼ Phase 1: 原材料採掘 (0/3) [===   ] │
│   ☐ Iron Ore × 5 (Mining Machine)   │
│   ☐ Copper Ore × 3 (Mining Machine) │
│   ☐ Stone × 2 (Mining Machine)      │
│                                     │
│ ▶ Phase 2: 基礎素材 (0/2)           │
│                                     │
│ ▶ Phase 3: 中間製品 (0/5)           │
│                                     │
│ [すべてリセット] [完了をエクスポート]  │
└─────────────────────────────────────┘
```

#### 4.2 フェーズアコーディオン

- **展開/折りたたみ**: フェーズごとに展開/折りたたみ可能
- **初期状態**: Phase 1のみ展開、他は折りたたみ
- **自動展開**: 前フェーズが完了したら次フェーズを自動展開（設定で切り替え可能）

#### 4.3 チェックボックス

- **視覚的フィードバック**: チェック時にアニメーション
- **クリック領域**: ノード全体をクリック可能（チェックボックスだけでなく）
- **キーボード操作**: スペースキーでチェック/アンチェック

#### 4.4 進捗バー

- **フェーズごとの進捗**: 各フェーズの進捗率を視覚的に表示
- **全体進捗**: ビュー上部に全体の進捗率を表示

```
全体進捗: 45% [====================          ]
```

#### 4.5 アクションボタン

**すべてリセット**:

- 全てのチェックを外す
- 確認ダイアログを表示

**完了をエクスポート**:

- チェック状態をテキスト形式でエクスポート
- 例: "Phase 1: 3/5 完了"

### 5. データ構造

#### 5.1 ロードマップストア

```typescript
interface BuildingRoadmapStore {
  // 現在のロードマップ状態
  currentRoadmap: BuildingRoadmap | null;

  // チェック状態
  nodeCompletions: Map<string, boolean>;

  // アクション
  generateRoadmap: (calculationResult: CalculationResult) => void;
  toggleNodeCompletion: (nodeId: string) => void;
  togglePhaseCompletion: (phaseNumber: number) => void;
  resetAllCompletions: () => void;

  // 永続化
  saveToPlan: (planId: string) => void;
  loadFromPlan: (planId: string) => void;
}
```

#### 5.2 ロードマップデータ型

```typescript
interface BuildingRoadmap {
  planId: string;
  phases: PhaseInfo[];
  createdAt: number;
  updatedAt: number;
}

interface PhaseInfo {
  phaseNumber: number;
  title: string;
  nodes: PhaseNode[];
  isCompleted: boolean;
  completedCount: number;
  totalCount: number;
}

interface PhaseNode {
  nodeId: string;
  itemId: number;
  itemName: string;
  machineId: number;
  machineType: string;
  machineCount: number;
  isCompleted: boolean;

  // Optional: mining nodes
  isMiningNode?: boolean;
  miningFrom?: string;
  requiredRate?: number;

  // Optional: icons
  itemIconPath?: string;
  machineIconPath?: string;
}
```

### 6. 実装の流れ

#### 6.1 ロードマップ生成

1. `CalculationResult`から`RecipeTreeNode`を取得
2. ツリーを深さ優先探索して階層を計算
3. 階層ごとにフェーズを作成
4. フェーズ番号を逆順にする（原材料がPhase 1になるように）
5. 各フェーズのタイトルを自動生成

#### 6.2 チェック状態の管理

1. ユーザーがノードをクリック
2. `toggleNodeCompletion(nodeId)`を呼び出し
3. `nodeCompletions`マップを更新
4. フェーズの完了状態を再計算
5. localStorageに保存（デバウンス）

#### 6.3 プラン切り替え時の処理

1. 新しいプランが選択される
2. `loadFromPlan(planId)`を呼び出し
3. localStorageから保存されたチェック状態を読み込み
4. ロードマップを再生成（計算結果が変わった場合）

### 7. 多言語対応

#### 7.1 翻訳キー

```json
{
  "roadmap": {
    "title": "建設ロードマップ",
    "phaseTitle": "Phase {{number}}: {{name}}",
    "phaseTitleRawMaterials": "原材料採掘",
    "progressLabel": "{{completed}}/{{total}} 完了",
    "overallProgress": "全体進捗: {{percent}}%",
    "resetAll": "すべてリセット",
    "exportProgress": "完了をエクスポート",
    "resetConfirmTitle": "リセット確認",
    "resetConfirmMessage": "すべてのチェックを外しますか？",
    "machineCount": "× {{count}}",
    "miningRate": "採掘速度: {{rate}}/s"
  }
}
```

### 8. テスト計画

#### 8.1 単体テスト

- `calculatePhases()`関数のテスト
  - 単一ノードのツリー
  - 複数階層のツリー
  - 原材料ノードの処理
- `toggleNodeCompletion()`のテスト
- フェーズ完了状態の計算テスト

#### 8.2 統合テスト

- ロードマップ生成のフローテスト
- チェック状態の永続化テスト
- プラン切り替え時の動作テスト

#### 8.3 E2Eテスト

- ロードマップビューの表示
- ノードのチェック/アンチェック
- フェーズの展開/折りたたみ
- リセット機能
- エクスポート機能

### 9. パフォーマンス考慮事項

#### 9.1 大規模ツリーへの対応

- **仮想スクロール**: ノード数が100を超える場合は仮想スクロールを使用
- **遅延レンダリング**: 折りたたまれたフェーズのノードは遅延レンダリング

#### 9.2 チェック状態の保存

- **デバウンス**: チェック状態の保存は500msデバウンス
- **差分保存**: 変更されたノードのみ保存

### 10. 将来の拡張可能性

1. **カスタムフェーズ分割**: ユーザーが手動でノードをフェーズに割り当て
2. **フェーズの並び替え**: ドラッグ&ドロップでフェーズ順序を変更
3. **メモ機能**: 各ノードにメモを追加
4. **タイマー機能**: 各フェーズの建設時間を記録
5. **共有機能**: ロードマップをURLで共有
6. **テンプレート**: よく使うロードマップをテンプレートとして保存

## 実装ファイル構成

```
src/
├── components/
│   └── BuildingRoadmapView/
│       ├── index.tsx              # メインビュー
│       ├── PhaseAccordion.tsx     # フェーズアコーディオン
│       ├── PhaseNode.tsx          # ノードチェックリスト
│       ├── ProgressBar.tsx        # 進捗バー
│       └── __tests__/
│           ├── BuildingRoadmapView.test.tsx
│           ├── PhaseAccordion.test.tsx
│           └── PhaseNode.test.tsx
├── lib/
│   └── roadmap/
│       ├── phaseCalculation.ts    # フェーズ計算ロジック
│       ├── roadmapGeneration.ts   # ロードマップ生成
│       └── __tests__/
│           ├── phaseCalculation.test.ts
│           └── roadmapGeneration.test.ts
├── stores/
│   └── buildingRoadmapStore.ts    # ロードマップストア
└── types/
    └── roadmap.ts                 # ロードマップ型定義
```

## レビュー・検討事項

### 1. フェーズタイトルの命名

**問題**: 自動生成されるフェーズタイトルがわかりにくい可能性

**対策案**:

- ユーザーがフェーズタイトルを編集可能にする（将来の拡張）
- より賢い命名アルゴリズム（例: 「鉄系素材」「電子部品」など）

### 2. 複雑なツリーのフェーズ分割

**問題**: 複雑な生産ツリー（循環、複数入力）での階層計算が難しい

**対策案**:

- 最長パスを基準に階層を決定
- 循環が検出された場合は警告を表示

### 3. チェック状態の同期

**問題**: 複数デバイス間でのチェック状態の同期

**対策案**:

- 初期実装ではlocalStorageのみ（同期なし）
- 将来的にクラウド同期を検討

## 参考資料

- [Issue #70](https://github.com/izu-san/dsp-calc-tool/issues/70)
- Radix UI Accordion: https://www.radix-ui.com/docs/primitives/components/accordion
- React Virtual: https://tanstack.com/virtual/latest
