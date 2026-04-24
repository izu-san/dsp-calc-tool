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
  cyan: "shadow-none",
  cyanStrong: "shadow-none",
  blue: "shadow-none",
  blueStrong: "shadow-none",
  purple: "shadow-none",
  purpleStrong: "shadow-none",
  green: "shadow-none",
  greenStrong: "shadow-none",
  orange: "shadow-none",
  orangeStrong: "shadow-none",
  yellow: "shadow-none",
  yellowStrong: "shadow-none",
  red: "shadow-none",
  redStrong: "shadow-none",
} as const;

/**
 * テキストドロップシャドウ
 */
export const TEXT_GLOW = {
  cyan: "drop-shadow-none",
  blue: "drop-shadow-none",
  purple: "drop-shadow-none",
  green: "drop-shadow-none",
  orange: "drop-shadow-none",
  yellow: "drop-shadow-none",
  red: "drop-shadow-none",
} as const;

/**
 * アイコングロー (小)
 */
export const ICON_GLOW = {
  cyan: "shadow-[0_0_10px_rgba(0,217,255,0.3)]",
  blue: "shadow-[0_0_10px_rgba(0,136,255,0.3)]",
  purple: "shadow-[0_0_10px_rgba(168,85,247,0.3)]",
  magenta: "shadow-[0_0_10px_rgba(233,53,255,0.3)]",
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
export const HOVER_SHADOW = "hover:border-space-400/50" as const;

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
  cyan: "shadow-[0_24px_64px_rgba(0,0,0,0.45)]",
  blue: "shadow-[0_24px_64px_rgba(0,0,0,0.45)]",
  purple: "shadow-[0_24px_64px_rgba(0,0,0,0.45)]",
  green: "shadow-[0_24px_64px_rgba(0,0,0,0.45)]",
  yellow: "shadow-[0_24px_64px_rgba(0,0,0,0.45)]",
  red: "shadow-[0_24px_64px_rgba(0,0,0,0.45)]",
} as const;

/**
 * カードグロー (中)
 */
export const CARD_GLOW = {
  cyan: "shadow-none",
  cyanLight: "shadow-none",
  blue: "shadow-none",
  blueLight: "shadow-none",
  blueStrong: "shadow-none",
  purple: "shadow-none",
  purpleLight: "shadow-none",
  purpleStrong: "shadow-none",
  magenta: "shadow-none",
  magentaLight: "shadow-none",
  magentaStrong: "shadow-none",
  green: "shadow-none",
  greenLight: "shadow-none",
  greenStrong: "shadow-none",
  yellow: "shadow-none",
  yellowLight: "shadow-none",
  yellowStrong: "shadow-none",
  red: "shadow-none",
  redLight: "shadow-none",
  redStrong: "shadow-none",
} as const;

/**
 * ホバー時のカードグロー (中)
 * TailwindのJITコンパイラが検出できるように、hover:プレフィックスを含めた完全なクラス名を定義
 */
export const HOVER_CARD_GLOW = {
  cyan: "hover:border-space-400/50",
  cyanLight: "hover:border-space-400/50",
  blue: "hover:border-space-400/50",
  blueLight: "hover:border-space-400/50",
  blueStrong: "hover:border-space-400/50",
  purple: "hover:border-space-400/50",
  purpleLight: "hover:border-space-400/50",
  purpleStrong: "hover:border-space-400/50",
  magenta: "hover:border-space-400/50",
  magentaLight: "hover:border-space-400/50",
  magentaStrong: "hover:border-space-400/50",
  green: "hover:border-space-400/50",
  greenLight: "hover:border-space-400/50",
  greenStrong: "hover:border-space-400/50",
  yellow: "hover:border-space-400/50",
  yellowLight: "hover:border-space-400/50",
  yellowStrong: "hover:border-space-400/50",
  red: "hover:border-space-400/50",
  redLight: "hover:border-space-400/50",
  redStrong: "hover:border-space-400/50",
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
