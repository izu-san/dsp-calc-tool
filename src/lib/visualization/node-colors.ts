import type { NodeAppearance, VisualizationNodeType } from "./types";

const NEON_PALETTE = [
  "rgb(0, 136, 255)",
  "rgb(0, 217, 255)",
  "rgb(233, 53, 255)",
  "rgb(255, 107, 53)",
  "rgb(0, 255, 136)",
  "rgb(255, 215, 0)",
  "rgb(168, 85, 247)",
  "rgb(255, 0, 255)",
  "rgb(0, 255, 255)",
  "rgb(255, 128, 0)",
];

const NODE_BASE_APPEARANCE: Record<VisualizationNodeType, NodeAppearance> = {
  "raw-material": {
    fill: "rgba(0, 255, 136, 0.35)", // より暗く
    stroke: "rgba(0, 255, 136, 0.6)",
    pattern: "stripe",
  },
  intermediate: {
    fill: "rgba(0, 217, 255, 0.3)", // より暗く
    stroke: "rgba(0, 217, 255, 0.6)",
    pattern: "dot",
  },
  machine: {
    fill: "rgba(0, 136, 255, 0.4)",
    stroke: "rgba(0, 136, 255, 0.6)",
    pattern: null,
  },
  "final-product": {
    fill: "rgba(255, 215, 0, 0.4)", // より暗く
    stroke: "rgba(255, 215, 0, 0.7)",
    pattern: null,
  },
};

export function getNodeAppearance(type: VisualizationNodeType, paletteIndex = 0): NodeAppearance {
  const base = NODE_BASE_APPEARANCE[type];

  if (type !== "intermediate") {
    return base;
  }

  const color = NEON_PALETTE[paletteIndex % NEON_PALETTE.length];
  return {
    ...base,
    fill: `${color.replace(")", ", 0.3)").replace("rgb", "rgba")}`, // より暗く
    stroke: `${color.replace(")", ", 0.6)").replace("rgb", "rgba")}`,
  };
}

export function getLinkColor(paletteIndex = 0): string {
  const color = NEON_PALETTE[paletteIndex % NEON_PALETTE.length];
  return color;
}

export function getPaletteIndex(itemId: number, palette?: Map<number, number>): number {
  if (!palette) return itemId % NEON_PALETTE.length;
  const existing = palette.get(itemId);
  if (typeof existing === "number") {
    return existing;
  }
  const nextIndex = palette.size % NEON_PALETTE.length;
  palette.set(itemId, nextIndex);
  return nextIndex;
}

export { NEON_PALETTE };
