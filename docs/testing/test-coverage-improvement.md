## カバレッジ現況サマリ

- 全体カバレッジ: ステートメント 86.68%（目標 85% は達成済み）
- 主な不足ファイル（いずれも指標が 85% 未満）:
  - `src/components/PlanDiffView/index.tsx`
  - `src/components/SettingsPanel/PhotonGenerationSettings.tsx`
  - `src/constants/exportVersion.ts`
  - `src/lib/import/jsonImporter.ts`
  - `src/components/PlanManager/index.tsx`
  - `src/components/SettingsPanel/TemplateSelector.tsx`
  - `src/components/ToastProvider/index.tsx`
  - `src/stores/settingsStore.ts`
  - `src/utils/historyDescriptionRegenerator.ts`
  - `src/lib/roadmap/phaseCalculation.ts`
  - `src/utils/historyRestore.ts`

## 不足要因の概要

- **PlanManager UI**: 保存/読込/共有系ハンドラの正常系以外（レシピ未選択・保存名重複など）と `act()` 未使用による警告。
- **TemplateSelector**: 作成/編集/削除モーダルやバリデーション、上書き確認など状態分岐が手付かず。
- **PhotonGenerationSettings**: レンズ利用トグル、増産剤ボタン、スライダーなど UI 分岐が未検証。
- **PlanDiffView**: 差分種別（add/remove/change）の描画確認が皆無。
- **jsonImporter**: JSON 構造検証・ `validatePlanInfo` 失敗・ `buildPlanFromImport` の null パスが未テスト。
- **settingsStore**: `persist` 永続化処理のシリアライズ/デシリアライズ系分岐が不足。
- **履歴ユーティリティ / ToastProvider**: ロケール別再生成やトースト切替、タイマーなどの分岐が不足。
- **その他**: 各テストで `act()` を用いずに state 更新を検証しているため警告が多発。

## 改善施策（優先順位順）

1. **PlanManager のハンドラ網羅**
   - 保存/読込/共有ボタンのガード分岐（レシピ未選択、同名保存、レシピ不在など）とエラーフローをテスト。
   - `handleShareURL` 例外、コピー成功/失敗、`includeOverrides*` オプションの反映確認。
   - 既存テストに `act()` を追加して React state 反映後に検証する。

2. **TemplateSelector のモーダル/バリデーション検証**
   - デフォルトテンプレート確認ダイアログ。
   - カスタム新規作成時の空文字・全角スペースのみ・長さ超過・名前重複（上書き確認）・最大数到達エラー。
   - 編集/削除/現在設定での上書き動作とエラーメッセージ確認。

3. **PhotonGenerationSettings UI テスト**
   - グラビトンレンズ利用トグルのオン/オフ、増産剤各種ボタンと `setPhotonGenerationSetting` の呼び出し引数。
   - 研究レベルスライダーの端点値と `calculateRayTransmissionEfficiency` の値表示。

4. **jsonImporter の異常系テスト**
   - JSON 解析失敗、必須フィールド欠如、`validatePlanInfo` エラー、`buildPlanFromImport` が `null` のケース。
   - 警告ログの発生確認（必要に応じて `vi.spyOn(console, "warn")` を使用）。

5. **PlanDiffView の表示テスト**
   - `diff.type` ごとのアイコン・色・`formatDiffValue` 呼び出し確認。

6. **settingsStore 永続化処理**
   - `persist` ストレージのシリアライズ/デシリアライズ異常系、custom template の復元確認。

7. **履歴ユーティリティ & ToastProvider**
   - `historyDescriptionRegenerator`/`historyRestore`: 主要分岐（設定変更、ノードオーバーライド、計画読込など）と例外フォールバック。
   - `ToastProvider`: 成功/失敗トースト表示と自動クローズ挙動。

## 補足

- 追加テストで要素参照が困難な場合は、必要最小限の `data-testid` を付与してテスト容易性を確保する。
- テスト中の `act()` 警告はすべて解消すること。state 反映前のアサーションは信頼性を損なうため厳禁。
