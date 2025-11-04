# E2Eテストガイド

このプロジェクトでは、Playwrightを使用してE2E（End-to-End）テストを実施しています。

## テストの実行

### 基本的なテスト実行

```bash
# 全E2Eテストを実行（Chromium、Firefox、Edge）
npm run test:e2e

# UIモードでテストを実行（視覚的なテスト実行）
npm run test:e2e:ui

# デバッグモードでテストを実行（ステップ実行）
npm run test:e2e:debug

# 特定のファイルのみテスト
npx playwright test tests/e2e/03-main-features.spec.ts

# 特定のプロジェクト（ブラウザ）のみテスト
npx playwright test --project=chromium
```

### テスト実行前の準備

E2Eテストは開発サーバー（`npm run dev`）が起動している必要があります。Playwrightは自動的に開発サーバーを起動しますが、手動で起動することもできます：

```bash
# 開発サーバーを起動（別ターミナル）
npm run dev

# テストを実行
npm run test:e2e
```

## テストファイルの構成

```
tests/
├── e2e/
│   ├── fixtures/           # Playwrightフィクスチャ
│   │   ├── app.fixture.ts      # アプリ共通フィクスチャ（ページ初期化、welcome modalスキップ）
│   │   ├── test-data.fixture.ts # テストデータフィクスチャ（localStorage操作）
│   │   ├── browser.fixture.ts   # ブラウザフィクスチャ（ページリロード、ビューポート設定）
│   │   └── index.ts             # フィクスチャのエクスポート
│   ├── helpers/            # テストヘルパー関数
│   │   ├── dialogs.ts           # ダイアログ操作ヘルパー
│   │   ├── numeric-asserts.ts   # 数値アサーションヘルパー
│   │   └── ui-stability.ts      # UI安定化ヘルパー（アニメーション無効化など）
│   ├── 01-welcome-modal.spec.ts      # Welcomeモーダルのテスト
│   ├── 02-game-data.spec.ts          # ゲームデータ読み込みのテスト
│   ├── 03-main-features.spec.ts      # 主要機能のテスト
│   ├── 04-power-generation.spec.ts   # 発電設備のテスト
│   ├── 05-import-export.spec.ts      # インポート/エクスポートのテスト
│   ├── 06-persistence-locale.spec.ts # 永続化・ロケールのテスト
│   ├── 07-modsettings.spec.ts        # Mod設定のテスト
│   ├── 08-what-if.spec.ts            # What-if機能のテスト
│   ├── 09-history-version-management.spec.ts # 履歴・バージョン管理のテスト
│   ├── 10-building-roadmap.spec.ts   # 建設ロードマップのテスト
│   ├── 11-custom-template.spec.ts    # カスタムテンプレートのテスト
│   └── seed.spec.ts                  # シード値のテスト
└── playwright.config.ts    # Playwright設定ファイル
```

## フィクスチャの使用方法

### 基本的な使用

フィクスチャを使用することで、テストの重複コードを削減し、保守性を向上させます。

```typescript
import { expect } from "@playwright/test";
import { test } from "./fixtures";

test("レシピを選択する", async ({ appPage }) => {
  // appPageは自動的に初期化され、welcome modalはスキップ済み
  await appPage.getByTestId("recipe-selector-gear").click();
  await expect(appPage.getByTestId("result-tree")).toBeVisible();
});
```

### 利用可能なフィクスチャ

#### `appPage` (Page)

自動的に初期化されたアプリケーションのページ。以下の処理が自動的に実行されます：

- `page.goto('/')`
- アニメーションの無効化
- Welcomeモーダルのスキップ（存在する場合）

```typescript
test("ページが読み込まれる", async ({ appPage }) => {
  // appPageは既に初期化済み
  await expect(appPage.getByTestId("recipe-selector")).toBeVisible();
});
```

#### `clearLocalStorage` / `clearLocalStorageKeepingTutorial`

`localStorage`をクリアします。`clearLocalStorageKeepingTutorial`はチュートリアルの状態を保持します。

```typescript
test("設定をリセット", async ({ appPage, clearLocalStorage }) => {
  await clearLocalStorage();
  await appPage.reload();
  // localStorageがクリアされた状態でテスト
});
```

#### `setLocalStorage` / `getLocalStorage`

`localStorage`の値を設定・取得します。

```typescript
test("設定を読み込む", async ({ appPage, setLocalStorage, getLocalStorage }) => {
  await setLocalStorage(
    "dsp-calculator-settings",
    JSON.stringify({
      /* ... */
    })
  );
  await appPage.reload();
  const value = await getLocalStorage("dsp-calculator-settings");
  expect(value).toBeTruthy();
});
```

#### `reloadPage`

ページをリロードし、アニメーションを無効化し、welcome modalをスキップします。

```typescript
test("ページリロード後も設定が保持される", async ({ appPage, reloadPage }) => {
  // 設定を変更
  await appPage.getByTestId("settings-proliferator").click();

  // ページをリロード
  await reloadPage();

  // 設定が保持されていることを確認
  await expect(appPage.getByTestId("settings-proliferator")).toHaveValue("production");
});
```

#### `setViewport`

ビューポートサイズを設定します。

```typescript
test("モバイルビューでの表示", async ({ appPage, setViewport }) => {
  await setViewport(375, 667); // iPhone SEサイズ
  await expect(appPage.getByTestId("mobile-menu")).toBeVisible();
});
```

#### `newPage`

新しいページを開きます。

```typescript
test("URL共有", async ({ appPage, newPage }) => {
  // 共有URLを取得
  const shareUrl = await appPage.getByTestId("share-url").getAttribute("href");

  // 新しいページで共有URLを開く
  const newTab = await newPage();
  await newTab.goto(shareUrl);
  await expect(newTab.getByTestId("recipe-selector-gear")).toBeVisible();
});
```

### フィクスチャの組み合わせ

複数のフィクスチャを組み合わせて使用できます：

```typescript
test("完全なテストシナリオ", async ({ appPage, clearLocalStorage, reloadPage, setViewport }) => {
  await clearLocalStorage();
  await setViewport(1920, 1080);
  await appPage.getByTestId("recipe-selector-gear").click();
  await reloadPage();
  // 続きのテスト...
});
```

## 新しいシナリオの追加方法

### 1. テストファイルの作成

新しいテストファイルを作成します：

```typescript
// tests/e2e/12-new-feature.spec.ts
import { expect } from "@playwright/test";
import { test } from "./fixtures";

test.describe("新機能", () => {
  test("機能の基本動作", async ({ appPage }) => {
    // Arrange（準備）
    await appPage.getByTestId("new-feature-button").click();

    // Act（実行）
    await appPage.getByTestId("new-feature-input").fill("test");

    // Assert（検証）
    await expect(appPage.getByTestId("new-feature-result")).toBeVisible();
  });
});
```

### 2. フィクスチャの使用

可能な限り既存のフィクスチャを使用します：

```typescript
import { test } from "./fixtures";

test("フィクスチャを使用したテスト", async ({ appPage }) => {
  // appPageは自動的に初期化済み
  // ...
});
```

### 3. 新しいフィクスチャの追加

共通の処理が複数のテストで繰り返される場合は、新しいフィクスチャを作成します：

```typescript
// tests/e2e/fixtures/custom.fixture.ts
import { test as base } from "@playwright/test";
import { testDataFixture } from "./test-data.fixture";

export const customFixture = testDataFixture.extend<{
  setupCustomFeature: () => Promise<void>;
}>({
  setupCustomFeature: async ({ appPage }, use) => {
    await use(async () => {
      // 共通のセットアップ処理
      await appPage.getByTestId("custom-feature-setup").click();
      // ...
    });
  },
});

export const test = customFixture;
```

### 4. テストヘルパーの使用

複雑な操作やアサーションは、ヘルパー関数として抽出します：

```typescript
// tests/e2e/helpers/custom-helper.ts
import type { Page } from "@playwright/test";

export async function expectCustomFeature(page: Page, expected: string) {
  const element = page.getByTestId("custom-feature");
  await expect(element).toHaveText(expected);
}

// テストファイルで使用
import { expectCustomFeature } from "./helpers/custom-helper";

test("カスタムヘルパーの使用", async ({ appPage }) => {
  await expectCustomFeature(appPage, "expected value");
});
```

## ベストプラクティス

### 1. テストは独立させる

各テストは他のテストに依存しないようにします：

```typescript
// ✅ Good: 各テストが独立している
test("テスト1", async ({ appPage, clearLocalStorage }) => {
  await clearLocalStorage();
  // ...
});

test("テスト2", async ({ appPage, clearLocalStorage }) => {
  await clearLocalStorage();
  // ...
});

// ❌ Bad: テストが順序に依存している
test("テスト1", async ({ appPage }) => {
  // localStorageにデータを設定
});

test("テスト2", async ({ appPage }) => {
  // テスト1のデータに依存している
});
```

### 2. 明確なテスト名

テスト名は何をテストしているか明確にします：

```typescript
// ✅ Good
test("レシピ選択時に生産ツリーが表示される", async ({ appPage }) => {
  // ...
});

// ❌ Bad
test("test1", async ({ appPage }) => {
  // ...
});
```

### 3. テストIDの使用

要素の選択には`testid`を使用します：

```typescript
// ✅ Good: testidを使用
await appPage.getByTestId("recipe-selector-gear").click();

// ❌ Bad: テキストやクラス名に依存
await appPage.getByText("Gear").click();
```

### 4. 適切な待機

要素が表示されるまで待機します：

```typescript
// ✅ Good: 明示的な待機
await expect(appPage.getByTestId("result-tree")).toBeVisible();

// ❌ Bad: 固定の待機時間
await appPage.waitForTimeout(1000);
```

### 5. フィクスチャの活用

重複する処理はフィクスチャに抽出します：

```typescript
// ✅ Good: フィクスチャを使用
test("テスト", async ({ appPage }) => {
  // appPageは自動的に初期化済み
});

// ❌ Bad: 毎回同じ処理を繰り返す
test("テスト", async ({ page }) => {
  await page.goto("/");
  await disableAnimations(page);
  // ...
});
```

## パフォーマンス最適化

### 並列実行

Playwrightはデフォルトで並列実行されます。設定は`playwright.config.ts`で調整できます：

```typescript
// playwright.config.ts
export default defineConfig({
  // ローカル: CPUコア数の50%を使用（速度と安定性のバランス）
  // CI: 1ワーカーを使用（安定性優先）
  workers: process.env.CI ? 1 : Math.max(1, Math.floor(os.cpus().length * 0.5)),
});
```

### テストのグループ化

関連するテストは`test.describe`でグループ化します：

```typescript
test.describe("レシピ選択", () => {
  test("基本選択", async ({ appPage }) => {
    // ...
  });

  test("複数選択", async ({ appPage }) => {
    // ...
  });
});
```

## トラブルシューティング

### テストがタイムアウトする

```typescript
// テストのタイムアウトを延長
test(
  "slow test",
  async ({ appPage }) => {
    // ...
  },
  { timeout: 60000 }
); // 60秒
```

### 要素が見つからない

```typescript
// 要素が表示されるまで待機
await expect(appPage.getByTestId("element")).toBeVisible();

// または、要素が存在するまで待機
await appPage.getByTestId("element").waitFor({ state: "visible" });
```

### アニメーションによる不安定性

`appPage`フィクスチャは自動的にアニメーションを無効化しますが、手動で無効化する場合は：

```typescript
import { disableAnimations } from "./helpers/ui-stability";

test("テスト", async ({ appPage }) => {
  await disableAnimations(appPage);
  // ...
});
```

### localStorageの状態が保持される

各テストの前に`clearLocalStorage`を使用します：

```typescript
test("テスト", async ({ appPage, clearLocalStorage }) => {
  await clearLocalStorage();
  // ...
});
```

## CI/CD統合

GitHub ActionsでE2Eテストを自動実行する例：

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run test:e2e
```

## 参考リンク

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Fixtures](https://playwright.dev/docs/test-fixtures)
