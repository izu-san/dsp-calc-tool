# テストガイド

このプロジェクトでは、Vitestを使用してユニットテストとコンポーネントテストを実施しています。

## テストの実行

### 基本的なテスト実行

```bash
# 全テストを実行
npm test

# watchモードでテスト（ファイル変更を監視）
npm test -- --watch

# 特定のファイルのみテスト
npm test -- format.test.ts
```

### UIモード

Vitestの視覚的なUIでテストを実行・管理できます。

```bash
npm run test:ui
```

ブラウザが開き、以下の機能が利用できます：
- テストの階層表示
- 個別テストの実行
- テスト結果の詳細表示
- カバレッジの可視化

### カバレッジレポート

コードカバレッジを計測してレポートを生成します。

```bash
npm run test:coverage
```

結果は以下の形式で出力されます：
- テキスト（ターミナル）
- HTML（`coverage/index.html`）
- JSON（`coverage/coverage-final.json`）

## テストファイルの構成

```
src/
├── lib/
│   ├── calculator.ts
│   └── __tests__/
│       └── calculator.test.ts
├── utils/
│   ├── format.ts
│   └── __tests__/
│       └── format.test.ts
└── test/
    └── setup.ts  # テスト環境のセットアップ
```

## テストの書き方

### ユニットテスト（純粋関数）

```typescript
import { describe, it, expect } from 'vitest';
import { formatPower } from '../format';

describe('formatPower', () => {
  it('should format power in kW', () => {
    expect(formatPower(500)).toBe('500.0 kW');
  });

  it('should format power in MW', () => {
    expect(formatPower(1500)).toBe('1.5 MW');
  });
});
```

### コンポーネントテスト

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### モックの使用

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('with mocks', () => {
  it('should call callback', () => {
    const callback = vi.fn();
    // テストコード
    expect(callback).toHaveBeenCalled();
  });
});
```

## ベストプラクティス

### 1. テストは小さく、焦点を絞る

```typescript
// ✅ Good
it('should add two numbers', () => {
  expect(add(1, 2)).toBe(3);
});

// ❌ Bad
it('should do everything', () => {
  // 複数の異なることをテスト
});
```

### 2. テスト名は明確に

```typescript
// ✅ Good
it('should return 0 when input is empty array', () => {
  // ...
});

// ❌ Bad
it('works', () => {
  // ...
});
```

### 3. AAA パターンを使用

```typescript
it('should calculate total', () => {
  // Arrange（準備）
  const items = [1, 2, 3];
  
  // Act（実行）
  const result = sum(items);
  
  // Assert（検証）
  expect(result).toBe(6);
});
```

### 4. エッジケースをテスト

```typescript
describe('formatPower', () => {
  it('should handle zero', () => {
    expect(formatPower(0)).toBe('0.0 kW');
  });

  it('should handle negative values', () => {
    expect(formatPower(-100)).toBe('-100.0 kW');
  });

  it('should handle very large values', () => {
    expect(formatPower(1_000_000_000)).toBe('1000.0 GW');
  });
});
```

## トラブルシューティング

### テストがタイムアウトする

```typescript
// テストのタイムアウトを延長
it('slow test', async () => {
  // ...
}, 10000); // 10秒
```

### DOMテストでエラーが出る

`happy-dom`が正しく設定されているか確認：

```typescript
// vite.config.ts
export default defineConfig({
  test: {
    environment: 'happy-dom',
  },
});
```

### モジュールが見つからない

```bash
# 依存関係を再インストール
npm install

# キャッシュをクリア
npm run test -- --clearCache
```

## CI/CD統合

GitHub Actionsでテストを自動実行する例：

```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test -- --run
      - run: npm run test:coverage
```

## 参考リンク

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Testing Best Practices](https://testingjavascript.com/)
