/**
 * Phase node information for building roadmap
 */
export interface PhaseNode {
  nodeId: string;
  itemId: number;
  itemName: string;
  machineId: number;
  machineType: string;
  machineCount: number;
  isCompleted: boolean;

  // Optional: mining nodes
  isMiningNode?: boolean;
  miningFrom?: string;
  requiredRate?: number;

  // Optional: icons
  itemIconPath?: string;
  machineIconPath?: string;
}

/**
 * Phase information
 */
export interface PhaseInfo {
  phaseNumber: number;
  title: string;
  nodes: PhaseNode[];
  isCompleted: boolean;
  completedCount: number;
  totalCount: number;
}

/**
 * Building roadmap data
 */
export interface BuildingRoadmap {
  planId: string;
  phases: PhaseInfo[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Building roadmap state for persistence
 */
export interface BuildingRoadmapState {
  planId: string;
  nodeCompletions: Record<string, boolean>; // nodeId -> isCompleted
  lastUpdated: number;
}
