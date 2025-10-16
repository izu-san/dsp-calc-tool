import type { GlobalSettings } from './settings';
import type { NodeOverrideSettings } from './calculation';

/**
 * Saved production plan
 */
export interface SavedPlan {
  /** Plan name */
  name: string;
  
  /** Timestamp when saved */
  timestamp: number;
  
  /** Selected recipe SID */
  recipeSID: number;
  
  /** Target production quantity */
  targetQuantity: number;
  
  /** Global settings */
  settings: GlobalSettings;
  
  /** Alternative recipe selections (itemId -> recipeId) */
  alternativeRecipes: Record<number, number>;
  
  /** Node-specific override settings (nodeId -> settings) */
  nodeOverrides: Record<string, NodeOverrideSettings>;
  
  /** Optional description */
  description?: string;
}

/**
 * Serialized format for export/import
 */
export interface SerializedPlan {
  version: string;
  plan: SavedPlan;
}
