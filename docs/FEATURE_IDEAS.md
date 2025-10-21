# Future Feature Ideas for DSP Recipe Calculator

## 🎯 現在完成している機能

### ✅ コア機能
- ダークモード対応
- レシピ選択・検索（材料検索、オートコンプリート）
- 生産ツリー表示
- 電力・機械数・ベルト計算
- Raw Materials統計
- プラン保存・読込

### ✅ 最適化機能
- ボトルネック検出（飽和度80%以上）
- What-ifシミュレーター（7シナリオ）
- 最適化エンジン（4目標）
- クイックアクション（Apply Best, Fix All）
- レシピ比較モーダル
- おすすめレシピ機能

---

## 💡 追加機能アイデア（優先度順）

### 🔥 超高優先度（ゲームプレイに直結）

#### 1. 建設コスト計算機 ✅ 実装済み
**内容**: 生産ラインを構築するのに必要な建材を計算
```
必要な建材:
- Assembling Machine Mk.III × 45
- Conveyor Belt Mk.III × 180
- Sorter Mk.III × 90
- Proliferator Tower × 15
```
**理由**: 「これを作るには何が必要？」は最もよくある質問

---

#### 2. 採掘速度計算機 ✅ 実装済み
**内容**: 原材料の採掘に必要な Mining Machine / Orbital Collector 数を計算
```
Iron Ore: 30/s required
→ Mining Machine × 6 (at 100% vein richness)
→ Or Orbital Collector × 2 (Unipolar Magnet)
```
**理由**: 原材料供給計画が立てやすくなる

---

#### 3. 電力グラフ ✅ 実装済み
**内容**: 各ノードの電力消費を視覚化（円グラフ or 棒グラフ）
```
Total Power: 680 MW
- Assemblers: 320 MW (47%)
- Chemical Plants: 240 MW (35%)
- Sorters: 120 MW (18%)
```
**理由**: どこが電力を食っているか一目瞭然

---

#### 4. ロードマップ機能
**内容**: 段階的な建設計画を生成
```
Step 1: Build 10 Iron Smelters
Step 2: Build 5 Gear Assemblers
Step 3: Connect with Mk.II Belts
Step 4: Add Proliferator (optional)
```
**理由**: 初心者に優しい、計画的に拡張できる

---

### ⭐ 高優先度（便利機能）

#### 5. エクスポート機能強化
**現在**: JSONのみ  
**追加**: 
- 📋 **Markdown形式**（Reddit/Discord投稿用）
- 📊 **Excel/CSV形式**（スプレッドシート分析用）
- 🖼️ **画像形式**（スクリーンショット共有用）

---

#### 6. テンプレート機能 ✅ 実装済み
**内容**: よく使う設定を保存
```
Templates:
- "Early Game" (Mk.I belts, no proliferator)
- "Mid Game" (Mk.II belts, Mk.I proliferator)
- "Late Game" (Mk.III belts, Mk.II proliferator)
- "End Game" (Mk.III everything, 4 stacks)
- "Power Saver" (minimum machines)
```
**理由**: 異なるゲーム段階で素早く切り替え

---

#### 7. 比較モード
**内容**: 2つのプランを並べて比較
```
Plan A vs Plan B
Power: 500 MW | 680 MW (+36%)
Machines: 120 | 95 (-21%)
```
**理由**: リファクタリング前後の効果を確認

---

#### 8. アラート機能
**内容**: 問題を自動検出して通知
```
⚠️ Warning: Power consumption exceeds 1 GW!
⚠️ Warning: Belt saturation >95% detected!
💡 Tip: Consider using Mk.III proliferator
```

---

### 🌟 中優先度（QoL向上）

#### 9. ノートメモ機能
各ノードにメモを追加
```
"このラインは惑星Aに配置"
"後でMk.IIIにアップグレード予定"
```

---

#### 10. 履歴機能（Undo/Redo）
設定変更を元に戻す

---

#### 11. ダッシュボード
全プランの概要を一覧表示
```
My Plans:
1. Iron Ingot Factory - 680 MW, 45 machines
2. Circuit Production - 320 MW, 28 machines
3. Green Matrix Lab - 1.2 GW, 180 machines
```

---

#### 12. パフォーマンスメトリクス
```
Efficiency Score: 85/100
- Power Efficiency: 92/100
- Machine Utilization: 78/100
- Belt Saturation: 65/100
```

---

### 🎨 低優先度（Nice to have）

#### 13. 3D視覚化
生産ツリーを3Dで表示（Three.js）

#### 14. コミュニティ共有
プランをWebで公開・共有

#### 15. 多言語対応
日本語、中国語、英語など

#### 16. モバイル対応
スマホでも使いやすく

---

## 📅 実装履歴

- 2025-01-15: 建設コスト計算機実装
- 2025-01-15: 電力グラフ実装
- 2025-01-15: 採掘速度計算機実装
- 2025-01-15: テンプレート機能実装（5つのプリセット）
- 2025-01-15: チートMod対応（隠し機能、Ctrl+Shift+M）
  - カスタムRecipes.xmlアップロード
  - 増産剤効果カスタマイズ（未実装）
