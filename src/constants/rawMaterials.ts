/**
 * Raw materials list - Items that have miningFrom values in Items.xml
 * These are terminal nodes in the production tree
 */
export const RAW_MATERIAL_IDS = new Set([
  // Basic ores
  1001, // Iron Ore - Iron Veins
  1002, // Copper Ore - Copper Veins
  1003, // Silicon Ore - Silicon Veins
  1004, // Titanium Ore - Titanium Veins
  1005, // Stone - Stone Veins
  1006, // Coal - Coal Veins
  
  // Plants
  1030, // Log - Tree
  1031, // Plant Fuel - Plant
  
  // Rare veins
  1011, // Fire Ice - Fire ice vein
  1012, // Kimberlite Ore - Kimberlite vein
  1013, // Fractal Silicon - Fractal silicium vein
  1014, // Grating Crystal - Grating Crystal vein
  1015, // Stalagmite Crystal - Stalagmite Crystal Vein
  1016, // Unipolar Magnet - Unipolar magnet vein
  
  // Liquids and gases
  1000, // Water - Ocean
  1007, // Crude Oil - Crude Oil Seep
  1116, // Sulfuric Acid - Sulfuric acid ocean
  1120, // Hydrogen - Gas Giant Orbit
  1121, // Deuterium - Gas Giant Orbit
  
  // Special rare materials
  1117, // Organic Crystal - Organic crystal vein
  
  // Dark Fog items
  5201, // Dark Fog Matrix - Dark Fog Debris
  5202, // Silicon-based Neuron - Dark Fog Debris
  5203, // Matter Recombinator - Dark Fog Debris
  5204, // Negentropy Singularity - Dark Fog Debris
  5205, // Core Element - Dark Fog Debris
  5206, // Energy Shard - Dark Fog Debris
]);

/**
 * Check if an item is a raw material
 */
export function isRawMaterial(itemId: number): boolean {
  return RAW_MATERIAL_IDS.has(itemId);
}
