# ユーザー定義テンプレート機能 - 仕様書

## 背景

- Issue: [カスタムシナリオ作成 #67](https://github.com/izu-san/dsp-calc-tool/issues/67)
- 既存の設定テンプレートは `src/types/settings/templates.ts` に定義された固定値のみで、ユーザーのプレイスタイルに合わせた保存・再利用ができない。
- 省電力・コンパクト・高速といったプレイ目標ごとに設定を切り替えたいという要望がある。[source](https://github.com/izu-san/dsp-calc-tool/issues/67)

## 目的

ユーザーが現在の設定をテンプレートとして保存・編集・削除できる仕組みを提供し、ワンタッチで複数のプレイスタイルに切り替えられるようにする。

## 想定読者

- フロントエンド実装者
- テスト担当者
- ドキュメントメンテナ

## 既存仕様の整理

| 項目             | 概要                                                                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| テンプレート定義 | `src/types/settings/templates.ts` の `SETTINGS_TEMPLATES` に静的定義。`GameTemplate` は固定的な string union。                                                    |
| 適用フロー       | `TemplateSelector` コンポーネントでプリセットボタンをクリック → 確認モーダル → `useSettingsStore.applyTemplate()` を呼び出す。                                    |
| 永続化           | `useSettingsStore` は `zustand` + `persist`。`dsp-calculator-settings` キーで localStorage に保存。Map は `src/utils/storageSerializer.ts` で配列に変換して往復。 |
| 履歴             | `recordHistoryEntry` を使ってテンプレート適用や設定変更を履歴ログに残す。                                                                                         |

## ユースケースシナリオ

1. **省電力モード** — 電力消費を最小化する設定を保存しておき、必要に応じて呼び出す。[source](https://github.com/izu-san/dsp-calc-tool/issues/67)
2. **コンパクトモード** — 機械数を抑えたい場合に、保存済みのテンプレートを呼び出す。[source](https://github.com/izu-san/dsp-calc-tool/issues/67)
3. **高速モード** — 生産速度を最大化する設定をテンプレート化し、素早く切り替える。[source](https://github.com/izu-san/dsp-calc-tool/issues/67)
4. 新しい惑星拠点ごとにテンプレートを分け、ロード後にすぐ適用する。
5. 共通設定をギルドメンバーと共有するためにエクスポート/インポートと組み合わせる。

## 機能要件

### テンプレートカテゴリー

- **デフォルトテンプレート**: 既存の `SETTINGS_TEMPLATES` を変更せず表示順の先頭に維持する。
- **ユーザー定義テンプレート**: 新たに作成・編集・削除可能なテンプレート群。
- UI 上で両者を識別できるようアイコン/ラベルを付与 (例: `CUSTOM` バッジ)。

### 一覧表示

- デフォルトテンプレートを先に表示し、その下にユーザー定義テンプレート領域を追加する。
- 各テンプレートカードにテンプレート名、概要 (主な差分のサマリ)、適用ボタン、メニュー (編集/削除) を配置する。
- 適用済みテンプレートはハイライト表示し、履歴から最新適用テンプレートがわかるようにする。

### 作成フロー

1. 「現在の設定をテンプレートとして保存」ボタンを新設。
2. クリックでモーダルを開き、以下を入力:
   - テンプレート名 (必須、1〜40 文字、重複不可、前後空白はトリム)
   - オプション: メモ欄 (120 文字程度、将来の UI 拡張を見越し保持のみ)
   - ベース情報の確認 (主要設定値のサマリー)
3. 同名テンプレートが存在する場合:
   - 既存テンプレートとの差分を表示する確認モーダルを表示
   - ユーザーが「上書き」を選択した場合のみ保存を実行
   - キャンセルした場合は保存を中止
4. 「保存」でテンプレートを生成し、`customTemplates` ストア領域に追加。
5. UUID生成は `crypto.randomUUID()` を使用（既存コードと同じ `src/utils/historyUtils.ts` の `generateUUID()` を流用）。

### 編集フロー

- テンプレートカードのメニューから「編集」を選択。
- モーダルで以下が可能:
  - 名称変更 (バリデーションは作成時と同じ。編集時は自分自身を除外した重複チェック)
  - 設定の更新 (Phase 1: 現在の設定で上書きのみ。Phase 2: 手動で値を編集する UI)
  - メモの更新
- 「現在の設定で上書き」操作はワンクリックで反映し、他のテンプレートに影響しない。
- Phase 1 では「現在の設定で上書き」機能のみ実装し、手動編集UIは Phase 2 で実装する。

### 削除フロー

- モーダルで確認ダイアログを表示し、削除後に取り消しは不可。
- 削除対象が適用中であっても、設定値自体は保持されるが `selectedTemplate` が `null` に戻る。

### 適用フロー

- デフォルトと同様に確認モーダルを表示する。
- 確認モーダルではテンプレートカテゴリー (デフォルト/カスタム)、最終更新日時、主要設定の差分を表示。
- 差分表示の形式は既存の `TemplateSelector` コンポーネントの確認モーダルと同じ形式を使用する（増産剤、機械ランク、コンベアベルト、ソーター、採掘速度研究など）。
- 適用後は履歴ログにテンプレート ID と名称を含める。

### 操作ガード

- 最大保持数は 50 件。上限到達時は新規作成/複製を禁止して警告メッセージを表示。
- バリデーションエラー時は送信ボタンを無効化し、エラーメッセージを i18n 文字列で表示。
- ローカルストレージの読み込みに失敗した場合は空リストで初期化し、警告を `console.warn` で出力。

## UI/UX 要件

- `SettingsPanel` 内のテンプレートセクションを 2 カラムからレスポンシブなカードリストに拡張。
- カスタムテンプレート領域のヘッダーに「＋ テンプレート作成」ボタンを配置。
- 作成・編集モーダルは Radix UI `Dialog` を採用し、既存のデザイン言語 (ネオンカラー) を踏襲。
- メニュー操作は Radix UI `DropdownMenu` を使用し、`TemplateSelector` に組み込む。
- 空状態には説明テキストと操作誘導を表示する (例: 「現在の設定をテンプレート化して素早く切り替えられます」)。
- フォーカス管理・キーボード操作 (Enter/ESC) をサポート。

## データ設計

### 型定義

```typescript
// src/types/settings/customTemplates.ts (新規)

export interface CustomSettingsTemplateMeta {
  id: string; // crypto.randomUUID() で生成された UUID v4
  name: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CustomSettingsTemplate {
  meta: CustomSettingsTemplateMeta;
  settings: GlobalSettings;
}

export interface CustomSettingsTemplateState {
  templates: Record<string, CustomSettingsTemplate>;
}

// カスタムテンプレート ID の型（型安全のため）
export type CustomTemplateId = `custom:${string}`;
```

- `GameTemplate` 型は既存 union を維持しつつ、選択状態保持用に `selectedTemplate` を `GameTemplate | CustomTemplateId | null` に拡張する。
- 型安全を優先するため、カスタムテンプレートは `custom:${string}` 形式のブランデッド型とする。
- シリアライズ時は `custom:<uuid>` 形式の文字列として保存し、デシリアライズ時に型ガードで検証する。

### ストア拡張

- `useSettingsStore` に `customTemplates: Record<string, CustomSettingsTemplate>` と CRUD アクションを追加。
- `setSelectedTemplate` はデフォルトテンプレートとカスタムテンプレートを区別できるよう呼び出し元でカテゴリー情報を持つ。
- `applyTemplate` は default / custom を判別し、それぞれ対応する設定を `settings` に反映。
- `persist` の `storage` シリアライザに `customTemplates` を追加し、`serializeSettings` を再利用して設定部分を保存する。

#### シリアライズ形式

```typescript
interface SerializedCustomTemplate {
  id: string;
  name: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
  settings: SerializedSettings; // storageSerializer.ts で使用
}

interface SettingsPersistedState {
  settings: SerializedSettings;
  selectedTemplate: string | null; // デフォルトは preset 名、カスタムは custom:<id>
  powerGenerationTemplate: string;
  customTemplates?: SerializedCustomTemplate[];
  // 既存項目は従来通り
}
```

- `serializeSettings`/`deserializeSettings` を流用して `settings` を安全に保存・復元する。
- 互換性維持のため、`customTemplates` が存在しない旧データは空配列として扱う。

### 履歴連携

- テンプレート作成/更新/削除/適用ごとに `recordHistoryEntry` を呼び出し、カテゴリを `settings` に統一。
- 既存の履歴記録形式を流用し、`generateTemplateDescription` と同様のヘルパー関数を作成する。
- 記録内容:
  - 作成: `{ action: "createTemplate", templateId, name }`
  - 更新: `{ action: "updateTemplate", templateId, name }`
  - 削除: `{ action: "deleteTemplate", templateId, name }`
  - 適用: `{ action: "applyTemplate", templateId, name, source: "custom" | "default" }`
- 履歴記録の `description` は既存の `historyDescriptionHelper.ts` のパターンに従い、`generateCustomTemplateDescription` などのヘルパー関数を作成する。

### フロントエンド状態

- テンプレート適用後に `selectedTemplate` を更新し、UI のハイライトに反映。
- 削除対象が選択中の場合は `selectedTemplate = null` とし、ステータスラベルをリセット。

## バリデーション・制約

- テンプレート名: 1〜40 文字、重複禁止、`/^[^\s].*[^\s]$/` を満たす。
- 編集時の重複チェック: 自分自身を除外した重複チェックを実施（同じテンプレートの名称変更時は同じ名前でもOK）。
- メモ: 0〜120 文字、複数行可。
- 設定差分がゼロでも保存を許可 (ユーザーが状態を記録しておきたいケースを想定)。
- `GlobalSettings` の Map/number などは `serializeSettings` を通して精度を保証する。

## 多言語対応

- UI 文言 (ボタン、エラーメッセージ、空状態説明) を `i18n` に追加。
- 既存の i18n ファイル構造（`src/i18n/locales/ja.json`、`src/i18n/locales/en.json`）を参照し、既存パターンに従ってキーを追加する。
- 既存の `template`、`applyTemplate`、`applyQuestion` などのキーを流用し、必要に応じて新しいキーを追加する。
- ユーザー入力の名称はそのまま表示し、翻訳は行わない。
- 日英双方で書式が崩れないよう、固定ラベルに動的文字列を差し込む際は `{{name}}` プレースホルダを利用。

## テスト戦略

- **ユニットテスト**
  - ストアの CRUD アクション (作成・編集・削除・適用) の state 遷移を検証。
  - シリアライズ/デシリアライズで Map が正しく復元されるか確認。
- **コンポーネントテスト** (`@testing-library/react`)
  - テンプレート一覧のレンダリング、空状態からの作成フロー。
  - バリデーションエラー時のトースト/メッセージ表示。
  - 適用モーダルで差分が表示されるか。
- **E2E テスト** (Playwright)
  - 作成 → 適用 → ページ再読み込み後も反映されるか。
  - 編集 → 再適用 → 履歴が記録されているか。
  - 削除 → 適用状態リセットの挙動。

## マイグレーション指針

- 既存の localStorage データには `customTemplates` が存在しないため、読み込み時に空配列を割り当てるガードを追加。
- データ破損時は JSON パース例外をキャッチし、警告を出した上でテンプレートリストをリセット。
- 互換性確保のため `selectedTemplate` が `custom:` 接頭辞で始まらない場合は既存のプリセット扱いとする。

## 実装 Phase 分け

### Phase 1（初回実装）

- テンプレート作成（現在の設定を保存）
- テンプレート一覧表示
- テンプレート適用（確認モーダル付き）
- テンプレート編集（名称・メモ変更、現在の設定で上書き）
- テンプレート削除
- 同名テンプレートの差分表示と上書き確認

### Phase 2（将来的な拡張）

- テンプレート編集時の手動設定編集UI
- テンプレートのエクスポート/インポートとの統合
- テンプレートごとの統計サマリ表示
- 複数ユーザープロファイルへの切り替え

## 今後の拡張余地 (情報のみ)

- テンプレートのエクスポート/インポートとの統合。
- テンプレートごとの統計サマリ表示。
- 複数ユーザープロファイルへの切り替え。
