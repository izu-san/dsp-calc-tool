export type VisualizationNodeType = "raw-material" | "intermediate" | "machine" | "final-product";

export interface NodeAppearance {
  fill: string;
  stroke: string;
  pattern?: "stripe" | "dot" | null;
}

export interface SankeyNodeDatum {
  id: string;
  label: string;
  type: VisualizationNodeType;
  itemId?: number;
  machineId?: number;
  nodeId?: string;
  recipeType?: string;
  value: number;
  appearance?: NodeAppearance;
  metadata?: Record<string, unknown>;
}

export interface SankeyLinkDatum {
  source: string;
  target: string;
  value: number;
  itemId: number;
  label: string;
  color?: string;
}

export interface SankeyGraphData {
  nodes: SankeyNodeDatum[];
  links: SankeyLinkDatum[];
}

export interface SankeyBuildOptions {
  includeByproducts?: boolean;
}
