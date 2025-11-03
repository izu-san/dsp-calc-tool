# ヘッダーリファクタリング - E2Eテスト改修ガイド

## 概要

ヘッダーコンポーネントがリファクタリングされ、以下の変更が行われました：

1. **LanguageSwitcher** → **LanguageMenu** (ドロップダウンメニュー化)
2. **HistoryControls** → **HistoryToolbar** (名前変更のみ、機能は同じ)
3. **PlanManager** → **PlanManagerMenu** (ドロップダウンメニュー化)

## 変更内容詳細

### 1. LanguageSwitcher → LanguageMenu

#### 旧実装 (`LanguageSwitcher`)

```tsx
<select
  data-testid="language-switcher-select"
  value={locale}
  onChange={e => setLocale(e.target.value)}
>
  <option value="ja">🇯🇵 日本語</option>
  <option value="en">🇺🇸 English</option>
</select>
```

#### 新実装 (`LanguageMenu`)

```tsx
<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild>
    <button data-testid="language-menu-trigger" disabled={isLoading}>
      <span>🌐</span>
    </button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item data-testid="language-menu-item-ja" onClick={() => setLocale("ja")}>
      🇯🇵 日本語 ✓
    </DropdownMenu.Item>
    <DropdownMenu.Item data-testid="language-menu-item-en" onClick={() => setLocale("en")}>
      🇺🇸 English ✓
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

#### E2Eテスト変更が必要な箇所

**旧コード:**

```typescript
await page.getByTestId("language-switcher-select").selectOption({ value: "en" });
```

**新コード:**

```typescript
// メニューを開く
await page.getByTestId("language-menu-trigger").click();
// 言語を選択
await page.getByTestId("language-menu-item-en").click();
```

#### 変更マッピング

| 旧                              | 新                                       |
| ------------------------------- | ---------------------------------------- |
| `language-switcher-select`      | `language-menu-trigger` (トリガーボタン) |
| `selectOption({ value: "en" })` | `language-menu-item-en` (メニュー項目)   |

---

### 2. HistoryControls → HistoryToolbar

#### 変更点

**基本的に変更なし** - 機能とdata-testidは同じです。

#### data-testid (変更なし)

- `undo-button` - Undoボタン
- `redo-button` - Redoボタン
- `history-dialog-button` - 履歴ダイアログボタン

#### E2Eテスト変更

**変更不要** - 既存のテストコードはそのまま動作します。

---

### 3. PlanManager → PlanManagerMenu

#### 旧実装 (`PlanManager`)

```tsx
<div className="flex gap-2">
  <button data-testid="save-button">💾 {t("save")}</button>
  <button data-testid="load-button">📂 {t("load")}</button>
  <button data-testid="url-share-button">🔗 {t("shareURL")}</button>
</div>
```

#### 新実装 (`PlanManagerMenu`)

```tsx
<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild>
    <button data-testid="plan-manager-menu-trigger" disabled={!selectedRecipe}>
      💾 {t("plan")}
    </button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item data-testid="plan-menu-save" onClick={() => setShowSaveDialog(true)}>
      💾 {t("save")}
    </DropdownMenu.Item>
    <DropdownMenu.Item data-testid="plan-menu-load" onClick={() => setShowLoadDialog(true)}>
      📂 {t("load")}
    </DropdownMenu.Item>
    <DropdownMenu.Item data-testid="plan-menu-share-url" onClick={handleShareURL}>
      🔗 {t("shareURL")}
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger data-testid="plan-menu-export">
        📤 {t("export")}
      </DropdownMenu.SubTrigger>
      <DropdownMenu.SubContent>
        <DropdownMenu.Item data-testid="plan-menu-export-json">JSON</DropdownMenu.Item>
        <DropdownMenu.Item data-testid="plan-menu-export-markdown">Markdown</DropdownMenu.Item>
        <DropdownMenu.Item data-testid="plan-menu-export-csv">CSV</DropdownMenu.Item>
        <DropdownMenu.Item data-testid="plan-menu-export-excel">Excel</DropdownMenu.Item>
        <DropdownMenu.Item data-testid="plan-menu-export-image">画像 (PNG)</DropdownMenu.Item>
      </DropdownMenu.SubContent>
    </DropdownMenu.Sub>
    <DropdownMenu.Item data-testid="plan-menu-import" onClick={() => fileInputRef.current?.click()}>
      📥 {t("import")}
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

#### E2Eテスト変更が必要な箇所

**旧コード:**

```typescript
await page.getByTestId("save-button").click();
await page.getByTestId("load-button").click();
await page.getByTestId("url-share-button").click();
```

**新コード:**

```typescript
// Save
await page.getByTestId("plan-manager-menu-trigger").click();
await page.getByTestId("plan-menu-save").click();

// Load
await page.getByTestId("plan-manager-menu-trigger").click();
await page.getByTestId("plan-menu-load").click();

// Share URL
await page.getByTestId("plan-manager-menu-trigger").click();
await page.getByTestId("plan-menu-share-url").click();

// Export JSON
await page.getByTestId("plan-manager-menu-trigger").click();
await page.getByTestId("plan-menu-export").click();
await page.getByTestId("plan-menu-export-json").click();

// Import
await page.getByTestId("plan-manager-menu-trigger").click();
await page.getByTestId("plan-menu-import").click();
```

#### 変更マッピング

| 旧                 | 新                                                                             |
| ------------------ | ------------------------------------------------------------------------------ |
| `save-button`      | `plan-manager-menu-trigger` → `plan-menu-save`                                 |
| `load-button`      | `plan-manager-menu-trigger` → `plan-menu-load`                                 |
| `url-share-button` | `plan-manager-menu-trigger` → `plan-menu-share-url`                            |
| (新規)             | `plan-manager-menu-trigger` → `plan-menu-export` → `plan-menu-export-{format}` |
| (新規)             | `plan-manager-menu-trigger` → `plan-menu-import`                               |

#### ダイアログのdata-testid (変更なし)

ダイアログ内の要素は変更されていません：

- `plan-name-input`
- `save-to-localstorage-button`
- `export-json-button`
- `export-markdown-button`
- `export-csv-button`
- `export-excel-button`
- `export-image-button`
- `file-import-input`
- `share-url-input`
- `copy-url-button`
- など

---

## 影響を受けるE2Eテストファイル

### 確認が必要なファイル

1. **`tests/e2e/06-persistence-locale.spec.ts`**
   - `language-switcher-select` → `language-menu-trigger` + `language-menu-item-{code}`

2. **`tests/e2e/05-import-export.spec.ts`**
   - `save-button`, `load-button`, `url-share-button` → `plan-manager-menu-trigger` + 各メニュー項目

3. **その他のファイル**
   - PlanManager関連の操作がある場合は要確認

---

## 改修手順

### 1. LanguageSwitcher → LanguageMenu

```typescript
// 旧
await page.getByTestId("language-switcher-select").selectOption({ value: "en" });

// 新
await page.getByTestId("language-menu-trigger").click();
await page.getByTestId("language-menu-item-en").click();
```

### 2. PlanManager → PlanManagerMenu

```typescript
// 旧
await page.getByTestId("save-button").click();

// 新
await page.getByTestId("plan-manager-menu-trigger").click();
await page.getByTestId("plan-menu-save").click();
```

### 3. メニューが開くまでの待機

ドロップダウンメニューは非同期で開くため、必要に応じて待機を追加：

```typescript
await page.getByTestId("plan-manager-menu-trigger").click();
await page.getByTestId("plan-menu-save").waitFor({ state: "visible" });
await page.getByTestId("plan-menu-save").click();
```

---

## テスト実行確認

```bash
# 該当テストを実行
npm run test:e2e tests/e2e/06-persistence-locale.spec.ts
npm run test:e2e tests/e2e/05-import-export.spec.ts
```

---

## 参考情報

- 新実装ファイル:
  - `src/components/Layout/Header/LanguageMenu.tsx`
  - `src/components/Layout/Header/HistoryToolbar.tsx`
  - `src/components/Layout/Header/PlanManagerMenu.tsx`
- 旧実装ファイル: 削除済み
