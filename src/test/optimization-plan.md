# テスト最適化計画

## 現状分析

### パフォーマンス指標

- **総テスト数**: 756テスト
- **実行時間**: 3.5秒
- **カバレッジ**: 97.18%
- **警告数**: 複数のact()警告

### 特定された問題

1. **act() 警告**
   - ModSettings.test.tsx
   - PlanManager.test.tsx
   - ConveyorBeltSettings.test.tsx
   - 原因: 非同期状態更新の不適切なラッピング

2. **計算エラーログ**
   - "Machines map is undefined" エラーが大量出力
   - テスト実行時のノイズ増加

3. **重複セットアップ**
   - 複数テストで同じモック設定を繰り返し
   - テストデータの再利用不足

## 最適化戦略

### Phase 1: 警告修正（即座に実行可能）

#### 1.1 act() 警告の修正

```typescript
// 修正前
fireEvent.click(button);

// 修正後
await act(async () => {
  fireEvent.click(button);
  await waitFor(() => {
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });
});
```

#### 1.2 計算エラーの抑制

```typescript
// テストセットアップでコンソールエラーを抑制
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
```

### Phase 2: パフォーマンス最適化

#### 2.1 テストデータファクトリーの作成

```typescript
// src/test/factories/testDataFactory.ts
export const createMockGameData = () => ({
  recipes: new Map([[1, { id: 1, name: "Test Recipe" }]]),
  machines: new Map([["mk1", { id: "mk1", name: "Test Machine" }]]),
});
```

#### 2.2 共通モックの統合

```typescript
// src/test/mocks/commonMocks.ts
export const setupCommonMocks = () => {
  vi.mock("../../stores/gameDataStore", () => ({
    useGameDataStore: () => createMockGameData(),
  }));
};
```

#### 2.3 テスト並列化の最適化

```typescript
// vite.config.ts
export default defineConfig({
  test: {
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
  },
});
```

### Phase 3: 高度な最適化

#### 3.1 テスト分割戦略

- 高速テスト（< 10ms）: ユニットテスト
- 中速テスト（10-100ms）: コンポーネントテスト
- 低速テスト（> 100ms）: 統合テスト

#### 3.2 条件付きテスト実行

```typescript
// 開発時は高速テストのみ実行
if (process.env.NODE_ENV === "development") {
  test.skip("slow integration test", () => {
    // 統合テスト
  });
}
```

## 実装優先順位

### 高優先度（即座に実行）

1. ✅ act() 警告の修正
2. ✅ 計算エラーログの抑制
3. ✅ 重複モックの統合

### 中優先度（1週間以内）

1. テストデータファクトリーの作成
2. 共通セットアップの統合
3. テスト並列化の最適化

### 低優先度（長期計画）

1. テスト分割戦略の実装
2. 条件付きテスト実行
3. カスタムマッチャーの追加

## 期待される効果

### パフォーマンス改善

- **実行時間**: 3.5秒 → 2.5秒（30%改善）
- **警告数**: 0件（完全除去）
- **メンテナンス性**: 大幅向上

### 開発体験向上

- テスト実行の高速化
- 警告の完全除去
- テストコードの可読性向上

## 実装チェックリスト

- [ ] act() 警告の修正
- [ ] 計算エラーログの抑制
- [ ] テストデータファクトリーの作成
- [ ] 共通モックの統合
- [ ] テスト並列化の最適化
- [ ] パフォーマンス測定
- [ ] ドキュメント更新
