import type { GridPosition } from '../types';
import { getDataPath } from './paths';

/**
 * Parse GridIndex string to grid position
 * Format: ZYXX where Z=tab, Y=row, XX=column
 * Example: "1101" -> z=1 (Item tab), y=1, x=01
 */
export function parseGridIndex(gridIndex: string | number): GridPosition {
  const indexStr = String(gridIndex).padStart(4, '0');
  const z = parseInt(indexStr.charAt(0), 10);
  const y = parseInt(indexStr.charAt(1), 10);
  const x = parseInt(indexStr.substring(2, 4), 10);

  return { x, y, z };
}

/**
 * Convert grid position to GridIndex string
 */
export function toGridIndex(position: GridPosition): string {
  const xStr = position.x.toString().padStart(2, '0');
  return `${position.z}${position.y}${xStr}`;
}

/**
 * Get icon path for a recipe
 */
export function getRecipeIconPath(recipeId: number, isExplicit: boolean, firstResultId?: number): string {
  if (isExplicit) {
    return getDataPath(`data/Recipes/Icons/${recipeId}.png`);
  } else if (firstResultId) {
    return getDataPath(`data/Items/Icons/${firstResultId}.png`);
  }
  return '';
}

/**
 * Get icon path for an item
 */
export function getItemIconPath(itemId: number): string {
  return getDataPath(`data/Items/Icons/${itemId}.png`);
}

/**
 * Get icon path for a machine
 */
export function getMachineIconPath(machineId: number): string {
  return getDataPath(`data/Machines/Icons/${machineId}.png`);
}
