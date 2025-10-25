# [Dyson Sphere Program - 生産チェーン計算機](https://dsp-calc.com/)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-dsp--calc.com-blue?style=for-the-badge&logo=react)](https://dsp-calc.com/)
[![Version](https://img.shields.io/badge/version-v0.0.1-green?style=for-the-badge)](https://github.com/izu-san/dsp-calc-tool/releases)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/izu-san/dsp-calc-tool/ci.yml?branch=main&style=for-the-badge)](https://github.com/izu-san/dsp-calc-tool/actions)

Dyson Sphere Programの生産ラインを最適化するためのWebベース計算ツールです。原材料から最終製品までの完全な生産チェーンを可視化し、必要な施設数・電力・ベルト要件を正確に算出します。

## ✨ 主要機能

### 🔢 生産計算
- **完全な生産チェーン計算**: 原材料から最終製品までの全工程を自動計算
- **増産剤サポート**: Mk.I/II/III の生産加速・増産モードに対応（排他モード）
- **マシンランク選択**: 各種施設の段階別性能に対応
  - 精錬設備: アーク溶鉱炉（100%）→ プレーン溶鉱炉（200%）→ 負エントロピー溶鉱炉（300%）
  - 組立機: Mk.I（75%）→ Mk.II（100%）→ Mk.III（150%）→ 再構成式組立機（300%）
  - 化学プラント: 標準（100%）→ 量子化学プラント（200%）
  - 研究設備: 標準（100%）→ 自己進化ラボ（300%）

### 📊 可視化と分析
- **生産ツリー表示**: 依存関係を階層的に表示、展開/折りたたみ可能
- **統計ビュー**: 全アイテムの生産量・消費量を一覧表示
- **電力グラフ**: 施設別の消費電力を円グラフで視覚化
- **建設コスト計算**: 生産ライン構築に必要な建材を自動算出
- **採掘速度計算**: 原材料の採掘に必要な採掘機・軌道採掘機の数を計算

### 🎯 最適化機能
- **What-ifシミュレーター**: 7種類のシナリオで最適化を提案
  - 増産剤切替（Mk.I/II/III、加速/増産）
  - マシンランクアップグレード
  - ベルトアップグレード
- **レシピ比較モーダル**: 代替レシピの性能を比較
- **ノード別設定**: 各生産段階ごとに個別設定をオーバーライド可能

### 💾 プラン管理
- **保存・読込**: プランをJSON形式で保存・読込
- **URL共有**: 圧縮URLでプランを他のユーザーと共有
- **テンプレート機能**: ゲーム進行度別のプリセット設定
  - 序盤（Mk.Iベルト、増産剤なし）
  - 中盤（Mk.IIベルト、Mk.I増産剤）
  - 終盤（Mk.IIIベルト、Mk.II増産剤）
  - エンドゲーム（Mk.III全装備、4スタック）
  - 省電力（最小施設数）

### 🌍 多言語対応
- 日本語・英語に対応
- ゲームデータの自動多言語化

## 🛠️ 技術スタック

### フロントエンド
- **React 19** - 最新のReactバージョン
- **TypeScript** - 型安全な開発
- **Vite 7** - 高速ビルドツール
- **Tailwind CSS 4** - ユーティリティファーストCSS

### 状態管理とUI
- **Zustand** - 軽量な状態管理ライブラリ
- **Radix UI** - アクセシブルなUIコンポーネント
- **Chart.js** - データ可視化

### データ処理
- **fast-xml-parser** - ゲームデータXMLのパース
- **decimal.js** - 高精度な数値計算
- **zod** - スキーマバリデーション
- **DOMPurify** - XMLサニタイゼーション

### 国際化
- **i18next** - 多言語対応
- **react-i18next** - React統合

### テスト
- **Vitest** - 高速ユニットテスト
- **Testing Library** - コンポーネントテスト
- **V8 Coverage** - カバレッジレポート

## 🚀 セットアップ

### 前提条件
- **Node.js** 18以上
- **npm** または **yarn**

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# 本番用ビルド
npm run build

# ビルドのプレビュー
npm run preview
```

### テスト

```bash
# ユニットテストの実行
npm run test

# テストUIの起動
npm run test:ui

# カバレッジレポートの生成
npm run test:coverage

# E2Eテストの実行
npm run test:e2e

# E2EテストのUIモード
npm run test:e2e:ui
```

### その他のコマンド

```bash
# コード品質チェック
npm run lint

# 画像をWebP形式に変換
npm run convert:webp
```

## 📁 プロジェクト構造

```
src/
├── components/              # Reactコンポーネント
│   ├── RecipeSelector/      # レシピ選択グリッド
│   ├── ResultTree/          # 生産ツリー表示
│   ├── SettingsPanel/       # 設定パネル（増産剤、マシンランク）
│   ├── StatisticsView/      # 統計ビュー
│   ├── BuildingCostView/    # 建設コスト表示
│   ├── PowerGraphView/      # 電力グラフ
│   ├── MiningCalculator/    # 採掘速度計算機
│   ├── WhatIfSimulator/     # What-ifシミュレーター
│   ├── PlanManager/         # プラン管理
│   ├── AlternativeRecipeSelector/ # 代替レシピ選択
│   ├── NodeSettingsModal/   # ノード設定モーダル
│   ├── RecipeComparisonModal/ # レシピ比較モーダル
│   ├── ModSettings/         # Mod設定（隠し機能）
│   ├── LanguageSwitcher/    # 言語切替
│   └── WelcomeModal.tsx     # ウェルカムモーダル
│
├── lib/                     # ビジネスロジック
│   ├── calculator.ts        # 生産チェーン計算エンジン
│   ├── parser.ts            # XMLデータパーサー
│   ├── proliferator.ts      # 増産剤計算
│   ├── powerCalculation.ts  # 電力計算
│   ├── buildingCost.ts      # 建設コスト計算
│   ├── miningCalculation.ts # 採掘速度計算
│   └── statistics.ts        # 統計計算
│
├── stores/                  # Zustand状態管理
│   ├── gameDataStore.ts     # ゲームデータ（アイテム、レシピ、施設）
│   ├── settingsStore.ts     # ユーザー設定（永続化）
│   ├── recipeSelectionStore.ts # レシピ選択状態
│   ├── nodeOverrideStore.ts # ノード別オーバーライド設定
│   └── favoritesStore.ts    # お気に入りレシピ
│
├── types/                   # TypeScript型定義
│   ├── game-data.ts         # ゲームデータ型
│   ├── settings.ts          # 設定型
│   ├── calculation.ts       # 計算結果型
│   └── saved-plan.ts        # プラン保存型
│
├── utils/                   # ユーティリティ関数
│   ├── format.ts            # 数値フォーマット
│   ├── grid.ts              # グリッド計算
│   ├── planExport.ts        # プラン保存・復元
│   └── urlShare.ts          # URL共有
│
├── constants/               # 定数定義
│   ├── machines.ts          # 施設データ
│   ├── rawMaterials.ts      # 原材料定義
│   └── icons.ts             # アイコンマッピング
│
├── hooks/                   # カスタムReactフック
│   ├── useDebounce.ts       # デバウンス処理
│   ├── useProductionCalculation.ts # 生産計算フック
│   ├── useSpriteData.ts     # スプライトデータ管理
│   ├── useTheme.ts          # テーマ管理
│   └── useTreeCollapse.ts   # ツリー折りたたみ管理
│
├── i18n/                    # 国際化設定
│   ├── index.ts             # i18n設定
│   └── locales/             # 言語ファイル
│       ├── ja.json          # 日本語
│       └── en.json          # 英語
│
├── test/                    # テスト関連
│   ├── factories/           # テストデータファクトリ
│   ├── helpers/             # テストヘルパー
│   └── mocks/               # モックデータ
│
├── utils/                   # ユーティリティ関数
│   ├── classNames.ts        # CSSクラス結合
│   ├── errorHandler.ts      # エラーハンドリング
│   ├── errors.ts            # エラー定義
│   ├── format.ts            # 数値フォーマット
│   ├── grid.ts              # グリッド計算
│   ├── html.tsx             # HTML生成ヘルパー
│   ├── imageFormat.ts       # 画像フォーマット処理
│   ├── logger.ts            # ログ機能
│   ├── paths.ts             # パス管理
│   ├── planExport.ts        # プラン保存・復元
│   ├── storageSerializer.ts # ストレージシリアライザー
│   └── urlShare.ts          # URL共有
│
├── i18n.ts                  # 国際化設定
├── App.tsx                  # メインアプリケーション
└── main.tsx                 # エントリーポイント

public/
└── data/                    # ゲームデータ
    ├── Items/               # アイテム画像・XML
    ├── Recipes/             # レシピ画像・XML
    ├── Machines/            # 施設画像・XML
    ├── Techs/               # 技術画像・XML
    └── sprites/             # スプライトデータ

tests/
├── e2e/                     # E2Eテスト（Playwright）
└── fixtures/                # テストフィクスチャ

scripts/
├── convert-to-webp.ts       # WebP変換スクリプト
└── generate-sprites.ts      # スプライト生成スクリプト
```

## 📖 使い方

### 基本的な流れ

1. **レシピを選択**: グリッドから目的のレシピをクリック
2. **目標生産量を入力**: 秒間アイテム数を指定
3. **設定を調整**: 増産剤、マシンランク、ベルト速度などを設定
4. **結果を確認**: 
   - **生産ツリータブ**: 階層構造で全工程を確認
   - **統計タブ**: アイテム別の生産量・消費量を一覧
   - **建設コストタブ**: 必要な建材を確認

### 高度な機能

#### ノード別設定
各生産ノードで右側の設定ボタンをクリックし、個別に以下を調整可能：
- 増産剤の種類とモード
- マシンランク
- 代替レシピの選択

#### What-ifシミュレーター
最適化提案を表示：
- **Apply Best**: 最適なシナリオを自動適用
- **Fix All**: 全問題を一括解決

#### プラン保存と共有
1. **保存**: プランマネージャーから名前を付けて保存
2. **読込**: 保存済みプランを選択して復元
3. **URL共有**: Share URLボタンでリンクをコピー

#### テンプレート
設定パネル下部のテンプレートセレクターから選択：
- ゲーム進行度に応じた最適設定を瞬時に適用

## ⚙️ ゲームデータについて

本ツールはDyson Sphere Programから抽出されたXMLデータを使用：

- **Items.xml**: 全アイテムとリソース
- **Recipes.xml**: 生産レシピ
- **Machines.xml**: 生産施設とその性能

## 🧮 増産剤の仕組み

増産剤は**排他モード**で動作：
- **増産モード**: 出力量を増加
- **加速モード**: 生産速度を増加

同時に両方のモードは使用できません。

| 種類 | 増産 | 加速 | 消費電力 |
|------|------|------|---------|
| Mk.I | +12.5% | +25% | +30% |
| Mk.II | +20% | +50% | +70% |
| Mk.III | +25% | +100% | +150% |

## 🔌 電力計算

合計電力 = 施設電力 + ソーター電力

- **施設電力**: ランクと増産剤設定に基づく
- **ソーター電力**: マテリアル搬送用（スループット計算なし）

## 🧪 テストカバレッジ

包括的なテストスイートを実装：

```bash
# カバレッジレポート生成
npm run test:coverage

# カバレッジをブラウザで確認
open coverage/index.html
```

主要な計算ロジックは100%のカバレッジを目標としています。

## 🎨 開発ガイド

### 型安全性
本プロジェクトはTypeScript strictモードを使用。全てのゲームデータは完全に型付けされています。

### 状態管理パターン
- **gameDataStore**: パース済みXMLデータを保持
- **settingsStore**: ユーザー設定をlocalStorageに永続化
- **recipeSelectionStore**: 現在の選択状態
- **nodeOverrideStore**: ノード別オーバーライド設定

### 機能追加の流れ
1. `src/types/` に型定義を追加
2. `src/lib/` にビジネスロジックを実装
3. `src/components/` にUIコンポーネントを作成
4. 必要に応じて `src/stores/` を更新
5. テストを `__tests__/` に追加

### パフォーマンス最適化
- **コード分割**: React.lazy()で重いコンポーネントを遅延読込
- **チャンク最適化**: ViteのmanualChunksで依存関係を分割
- **メモ化**: useMemo/useCallbackで再計算を最小化

## 🌐 ビルドとデプロイ

```bash
# 本番用ビルド
npm run build

# dist/ディレクトリが生成されます
# 任意の静的ホスティングサービスにデプロイ可能
```

ビルド設定（vite.config.ts）:
- チャンクサイズ警告上限: 800KB
- React、UI、Chart、i18n、Utilsを個別チャンクに分割

## 📜 ライセンス

本プロジェクトは [MIT License](LICENSE) の下で公開されています。

自由に使用・改変・再配布が可能です。詳細はLICENSEファイルをご確認ください。

### ゲームの著作権について

Dyson Sphere Program © Youthcat Studio

本ツールはファンメイドのプロジェクトであり、Youthcat Studioとは公式な関係はありません

---

**バグ報告や機能要望は Issues までお気軽にどうぞ！**
