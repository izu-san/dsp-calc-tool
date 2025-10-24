/**
 * E2Eテスト用の共通定数
 */

/**
 * タイムアウト設定（ミリ秒）
 */
export const TIMEOUTS = {
  /** データ読み込み待機（XMLパース完了） */
  DATA_LOADING: 3000,
  /** 計算完了待機 */
  CALCULATION: 1000,
  /** 重い計算（宇宙マトリックスなど）の待機 */
  HEAVY_CALCULATION: 3000,
  /** モーダルアニメーション待機 */
  MODAL_ANIMATION: 200,
  /** UI更新待機 */
  UI_UPDATE: 500,
  /** 言語切替待機 */
  LANGUAGE_SWITCH: 5000,
} as const;

/**
 * よく使用するレシピ名（日本語）
 */
export const RECIPES = {
  /** 鉄インゴット - 基本的な製錬レシピ */
  IRON_INGOT: '鉄インゴット',
  /** 電磁マトリックス - 中級レシピ */
  ELECTROMAGNETIC_MATRIX: '電磁マトリックス',
  /** 宇宙マトリックス - 最も複雑な生産チェーン */
  UNIVERSE_MATRIX: '宇宙マトリックス',
  /** 銅インゴット */
  COPPER_INGOT: '銅インゴット',
  /** 回路基板 */
  CIRCUIT_BOARD: '回路基板',
} as const;

/**
 * よく使用するレシピ名（英語）
 */
export const RECIPES_EN = {
  IRON_INGOT: 'Iron Ingot',
  ELECTROMAGNETIC_MATRIX: 'Electromagnetic Matrix',
  UNIVERSE_MATRIX: 'Universe Matrix',
  COPPER_INGOT: 'Copper Ingot',
  CIRCUIT_BOARD: 'Circuit Board',
} as const;

/**
 * ボタンラベル（日本語）
 */
export const BUTTON_LABELS = {
  /** Welcomeモーダルのスキップボタン */
  SKIP: 'スキップ',
  /** Welcomeモーダルの開始ボタン */
  START: '始める！',
  /** Welcomeモーダルの次へボタン */
  NEXT: '次へ',
  /** 保存ボタン */
  SAVE: '💾 保存',
  /** URL共有ボタン */
  URL_SHARE: '🔗 URL共有',
  /** 統計タブ */
  STATISTICS: '統計',
  /** 建設コストタブ */
  BUILDING_COST: '建設コスト',
  /** 折りたたむボタン */
  COLLAPSE: '折りたたむ',
  /** 展開ボタン */
  EXPAND: '展開',
} as const;

/**
 * ボタンラベル（英語）
 */
export const BUTTON_LABELS_EN = {
  SKIP: 'Skip',
  START: 'Get Started!',
  NEXT: 'Next',
  SAVE: '💾 Save',
  URL_SHARE: '🔗 Share URL',
  STATISTICS: 'Statistics',
  BUILDING_COST: 'Building Cost',
  COLLAPSE: 'Collapse',
  EXPAND: 'Expand',
} as const;

/**
 * 見出しテキスト
 */
export const HEADINGS = {
  /** Welcomeモーダルの見出し */
  WELCOME: '🚀 Dyson Sphere Program Production Calculator へようこそ！',
  /** アプリタイトル */
  APP_TITLE: 'Dyson Sphere Program - レシピ計算機',
  /** 生産チェーン見出し */
  PRODUCTION_CHAIN: '生産チェーン',
} as const;

/**
 * テストデータ - 目標数量
 */
export const TEST_VALUES = {
  /** 通常値 */
  NORMAL: 10,
  /** 極大値 */
  EXTREME_MAX: 1000000000,
  /** 極小値 */
  EXTREME_MIN: 0.000001,
} as const;

/**
 * エラーパターン（検出してはいけない文字列）
 */
export const ERROR_PATTERNS = {
  NAN: /NaN/,
  INFINITY: /Infinity/,
  UNDEFINED: /undefined/,
} as const;

