/**
 * テーマ定数
 *
 * Tailwind CSS で使用する共通のスタイル定義
 * 重複するグラデーション、影、色などを一元管理
 */

/**
 * ネオングローエフェクト
 * ボックスシャドウ用の定義
 */
export const NEON_GLOW = {
  cyan: "shadow-[0_0_20px_rgba(0,217,255,0.3)]",
  cyanStrong: "shadow-[0_0_25px_rgba(0,217,255,0.4)]",
  blue: "shadow-[0_0_20px_rgba(0,136,255,0.3)]",
  blueStrong: "shadow-[0_0_25px_rgba(0,136,255,0.4)]",
  purple: "shadow-[0_0_20px_rgba(168,85,247,0.3)]",
  purpleStrong: "shadow-[0_0_25px_rgba(168,85,247,0.4)]",
  green: "shadow-[0_0_20px_rgba(0,255,136,0.3)]",
  greenStrong: "shadow-[0_0_25px_rgba(0,255,136,0.4)]",
  orange: "shadow-[0_0_20px_rgba(255,107,53,0.3)]",
  orangeStrong: "shadow-[0_0_25px_rgba(255,107,53,0.4)]",
  yellow: "shadow-[0_0_20px_rgba(255,215,0,0.3)]",
  yellowStrong: "shadow-[0_0_20px_rgba(255,215,0,0.6)]",
  red: "shadow-[0_0_20px_rgba(255,0,0,0.3)]",
  redStrong: "shadow-[0_0_20px_rgba(255,0,0,0.6)]",
} as const;

/**
 * テキストドロップシャドウ
 */
export const TEXT_GLOW = {
  cyan: "drop-shadow-[0_0_4px_rgba(0,217,255,0.6)]",
  blue: "drop-shadow-[0_0_4px_rgba(0,136,255,0.6)]",
  purple: "drop-shadow-[0_0_4px_rgba(168,85,247,0.6)]",
  green: "drop-shadow-[0_0_4px_rgba(0,255,136,0.6)]",
  orange: "drop-shadow-[0_0_4px_rgba(255,107,53,0.6)]",
  yellow: "drop-shadow-[0_0_8px_rgba(255,255,0,0.6)]",
  red: "drop-shadow-[0_0_8px_rgba(255,0,0,0.6)]",
} as const;

/**
 * アイコングロー (小)
 */
export const ICON_GLOW = {
  cyan: "shadow-[0_0_10px_rgba(0,217,255,0.3)]",
  blue: "shadow-[0_0_10px_rgba(0,136,255,0.3)]",
  purple: "shadow-[0_0_10px_rgba(168,85,247,0.3)]",
  green: "shadow-[0_0_10px_rgba(0,255,136,0.3)]",
  orange: "shadow-[0_0_10px_rgba(255,107,53,0.3)]",
  yellow: "shadow-[0_0_10px_rgba(255,215,0,0.5)]",
  red: "shadow-[0_0_10px_rgba(255,0,0,0.3)]",
} as const;

/**
 * バッジグロー (小)
 */
export const BADGE_GLOW = {
  cyan: "shadow-[0_0_5px_rgba(0,217,255,0.3)]",
  blue: "shadow-[0_0_5px_rgba(0,136,255,0.3)]",
  purple: "shadow-[0_0_5px_rgba(168,85,247,0.3)]",
  green: "shadow-[0_0_5px_rgba(0,255,136,0.3)]",
  orange: "shadow-[0_0_5px_rgba(255,107,53,0.3)]",
} as const;

/**
 * 背景色（透明度付き）
 */
export const BG_COLOR = {
  cyanLight: "bg-neon-cyan/20",
  blueLight: "bg-neon-blue/20",
  purpleLight: "bg-neon-purple/20",
  greenLight: "bg-neon-green/20",
  orangeLight: "bg-neon-orange/20",
  dark: "bg-dark-700/50",
  darkDarker: "bg-dark-800/50",
} as const;

/**
 * ボーダー色
 */
export const BORDER_COLOR = {
  cyan: "border-neon-cyan/50",
  cyanStrong: "border-neon-cyan/60",
  blue: "border-neon-blue/50",
  blueStrong: "border-neon-blue/60",
  purple: "border-neon-purple/50",
  purpleStrong: "border-neon-purple/60",
  green: "border-neon-green/50",
  greenStrong: "border-neon-green/60",
  orange: "border-neon-orange/40",
  orangeStrong: "border-neon-orange/60",
  yellow: "border-neon-yellow/40",
  yellowStrong: "border-neon-yellow/50",
  red: "border-neon-red/40",
  redStrong: "border-neon-red/50",
} as const;

/**
 * ホバー時のシャドウ
 */
export const HOVER_SHADOW = "hover:shadow-[0_0_20px_rgba(0,217,255,0.3)]" as const;

/**
 * アニメーション
 */
export const ANIMATION = {
  fadeIn: "animate-fadeIn",
  pulse: "animate-pulse",
  spin: "animate-spin",
} as const;

/**
 * トランジション
 */
export const TRANSITION = {
  all: "transition-all",
  colors: "transition-colors",
  transform: "transition-transform",
} as const;

/**
 * 飽和度に応じた色
 * @param saturation - 飽和度（%）
 * @returns カラーコード
 */
export function getSaturationColor(saturation: number): string {
  if (saturation > 90) return "#FF6B35";
  if (saturation > 80) return "#FFD700";
  return "#00FF88";
}

/**
 * モーダルグロー (大)
 */
export const MODAL_GLOW = {
  cyan: "shadow-[0_0_30px_rgba(0,217,255,0.3)]",
  blue: "shadow-[0_0_30px_rgba(0,136,255,0.3)]",
  purple: "shadow-[0_0_30px_rgba(168,85,247,0.3)]",
  green: "shadow-[0_0_30px_rgba(0,255,136,0.3)]",
  yellow: "shadow-[0_0_30px_rgba(255,255,0,0.3)]",
  red: "shadow-[0_0_30px_rgba(255,0,0,0.3)]",
} as const;

/**
 * カードグロー (中)
 */
export const CARD_GLOW = {
  cyan: "shadow-[0_0_15px_rgba(0,217,255,0.3)]",
  cyanLight: "shadow-[0_0_15px_rgba(0,217,255,0.2)]",
  blue: "shadow-[0_0_15px_rgba(0,136,255,0.3)]",
  blueLight: "shadow-[0_0_15px_rgba(0,136,255,0.2)]",
  blueStrong: "shadow-[0_0_15px_rgba(0,136,255,0.5)]",
  purple: "shadow-[0_0_15px_rgba(168,85,247,0.3)]",
  purpleLight: "shadow-[0_0_15px_rgba(168,85,247,0.2)]",
  purpleStrong: "shadow-[0_0_15px_rgba(168,85,247,0.5)]",
  magenta: "shadow-[0_0_15px_rgba(233,53,255,0.3)]",
  magentaLight: "shadow-[0_0_15px_rgba(233,53,255,0.2)]",
  magentaStrong: "shadow-[0_0_15px_rgba(233,53,255,0.5)]",
  green: "shadow-[0_0_15px_rgba(0,255,136,0.3)]",
  greenLight: "shadow-[0_0_15px_rgba(0,255,136,0.2)]",
  greenStrong: "shadow-[0_0_15px_rgba(0,255,136,0.4)]",
  yellow: "shadow-[0_0_15px_rgba(255,215,0,0.3)]",
  yellowLight: "shadow-[0_0_15px_rgba(255,215,0,0.2)]",
  yellowStrong: "shadow-[0_0_15px_rgba(255,215,0,0.6)]",
  red: "shadow-[0_0_15px_rgba(255,0,0,0.3)]",
  redLight: "shadow-[0_0_15px_rgba(255,0,0,0.2)]",
  redStrong: "shadow-[0_0_15px_rgba(255,0,0,0.4)]",
} as const;

/**
 * ノード状態に応じたスタイル
 */
export const NODE_STYLES = {
  root: {
    bottleneck: `${BORDER_COLOR.orangeStrong} border-2 ${NEON_GLOW.orangeStrong}`,
    normal: `${BORDER_COLOR.blueStrong} border-2 ${NEON_GLOW.blueStrong}`,
  },
  child: {
    bottleneck: `${BORDER_COLOR.orange} border-2 ${NEON_GLOW.orange}`,
    normal: `${BORDER_COLOR.cyan} ${NEON_GLOW.cyan}`,
  },
  rawMaterial: {
    circular: `${BG_COLOR.purpleLight} ${BORDER_COLOR.purple} ${NEON_GLOW.purple}`,
    normal: `${BG_COLOR.greenLight} ${BORDER_COLOR.green} ${NEON_GLOW.green}`,
  },
} as const;
