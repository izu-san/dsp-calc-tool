import type { SavedPlan, SerializedPlan, GlobalSettings, NodeOverrideSettings } from '../types';

const PLAN_VERSION = '1.0.0';

/**
 * Generate default plan name with date and time
 */
function getDefaultPlanName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `Plan_${year}-${month}-${day}_${hours}-${minutes}`;
}

/**
 * Export a production plan to JSON file
 */
export function exportPlan(
  recipeSID: number,
  targetQuantity: number,
  settings: GlobalSettings,
  alternativeRecipes: Map<number, number>,
  nodeOverrides: Map<string, NodeOverrideSettings>,
  planName?: string
): void {
  // Convert Maps to plain objects
  const alternativeRecipesObj: Record<number, number> = {};
  alternativeRecipes.forEach((value, key) => {
    alternativeRecipesObj[key] = value;
  });

  const nodeOverridesObj: Record<string, NodeOverrideSettings> = {};
  nodeOverrides.forEach((value, key) => {
    nodeOverridesObj[key] = value;
  });

  const plan: SavedPlan = {
    name: planName || getDefaultPlanName(),
    timestamp: Date.now(),
    recipeSID,
    targetQuantity,
    settings,
    alternativeRecipes: alternativeRecipesObj,
    nodeOverrides: nodeOverridesObj,
  };

  const serialized: SerializedPlan = {
    version: PLAN_VERSION,
    plan,
  };

  // Create blob and download
  const json = JSON.stringify(serialized, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${plan.name}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import a production plan from JSON file
 */
export async function importPlan(file: File): Promise<SavedPlan> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data: SerializedPlan = JSON.parse(text);
        
        // Validate version
        if (!data.version || !data.plan) {
          throw new Error('Invalid plan file format');
        }
        
        // Version compatibility check (for future versions)
        if (data.version !== PLAN_VERSION) {
          console.warn(`Plan version mismatch: ${data.version} vs ${PLAN_VERSION}`);
        }
        
        resolve(data.plan);
      } catch (error) {
        reject(new Error(`Failed to parse plan file: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Restore a saved plan to the application state
 */
export function restorePlan(
  plan: SavedPlan,
  setRecipe: (recipe: number) => void,
  setTargetQuantity: (quantity: number) => void,
  updateSettings: (settings: Partial<GlobalSettings>) => void,
  setNodeOverrides: (overrides: Map<string, NodeOverrideSettings>) => void
): void {
  // Restore recipe and quantity
  setRecipe(plan.recipeSID);
  setTargetQuantity(plan.targetQuantity);
  
  // Restore settings (convert alternativeRecipes to Map)
  const restoredSettings = {
    ...plan.settings,
    alternativeRecipes: new Map(
      Object.entries(plan.settings.alternativeRecipes).map(([k, v]) => [Number(k), Number(v)])
    ),
  };
  updateSettings(restoredSettings);
  
  // Restore node overrides
  const nodeOverridesMap = new Map(Object.entries(plan.nodeOverrides));
  setNodeOverrides(nodeOverridesMap);
}

/**
 * Save plan to localStorage (for recent plans)
 */
export function savePlanToLocalStorage(plan: SavedPlan): void {
  const key = `plan_${plan.timestamp}`;
  const serialized: SerializedPlan = {
    version: PLAN_VERSION,
    plan,
  };
  localStorage.setItem(key, JSON.stringify(serialized));
  
  // Update recent plans list
  const recentPlans = getRecentPlans();
  recentPlans.unshift({
    key,
    name: plan.name,
    timestamp: plan.timestamp,
  });
  
  // Keep only last 10 plans
  const plansToKeep = recentPlans.slice(0, 10);
  localStorage.setItem('recent_plans', JSON.stringify(plansToKeep));
  
  // Remove old plans
  recentPlans.slice(10).forEach(p => {
    localStorage.removeItem(p.key);
  });
}

/**
 * Get recent plans from localStorage
 */
export function getRecentPlans(): Array<{ key: string; name: string; timestamp: number }> {
  const stored = localStorage.getItem('recent_plans');
  return stored ? JSON.parse(stored) : [];
}

/**
 * Load plan from localStorage
 */
export function loadPlanFromLocalStorage(key: string): SavedPlan | null {
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  
  try {
    const data: SerializedPlan = JSON.parse(stored);
    return data.plan;
  } catch {
    return null;
  }
}

/**
 * Delete plan from localStorage
 */
export function deletePlanFromLocalStorage(key: string): void {
  localStorage.removeItem(key);
  
  const recentPlans = getRecentPlans();
  const filtered = recentPlans.filter(p => p.key !== key);
  localStorage.setItem('recent_plans', JSON.stringify(filtered));
}
