import type { Recipe, Machine, GlobalSettings } from '../types';

// Central mapping of recipe type to language-independent machine IDs (from game data)
export const MACHINE_IDS_BY_RECIPE_TYPE: Record<Recipe['Type'], number[]> = {
  Smelt: [2302, 2315, 2319],            // Arc Smelter, Plane Smelter, Negentropy Smelter
  Assemble: [2303, 2304, 2305, 2318],   // Assembling Mk.I, Mk.II, Mk.III, Re-composing Assembler
  Chemical: [2309, 2317],               // Chemical Plant, Quantum Chemical Plant
  Research: [2901, 2902],               // Matrix Lab, Self-evolution Lab
  Refine: [2308],                       // Oil Refinery
  Particle: [2310],                     // Miniature Particle Collider
};

// Select a machine for a given recipe type using global settings
export function getMachineForRecipe(
  recipeType: Recipe['Type'],
  machines: Map<number, Machine>,
  settings: GlobalSettings
): Machine {
  const ids = MACHINE_IDS_BY_RECIPE_TYPE[recipeType] || [];
  let targetId = ids[0];

  const { machineRank } = settings;

  switch (recipeType) {
    case 'Smelt': {
      const rank = machineRank.Smelt;
      targetId = rank === 'arc' ? ids[0] : rank === 'plane' ? ids[1] : ids[2];
      break;
    }
    case 'Assemble': {
      const rank = machineRank.Assemble;
      targetId = rank === 'mk1' ? ids[0] : rank === 'mk2' ? ids[1] : rank === 'mk3' ? ids[2] : ids[3];
      break;
    }
    case 'Chemical': {
      const rank = machineRank.Chemical;
      targetId = rank === 'standard' ? ids[0] : ids[1];
      break;
    }
    case 'Research': {
      const rank = machineRank.Research;
      targetId = rank === 'standard' ? ids[0] : ids[1];
      break;
    }
    case 'Refine':
    case 'Particle':
    default:
      break;
  }

  if (!machines) {
    throw new Error('Machines map is undefined');
  }

  const machine = machines.get(targetId);
  if (machine) return machine;

  const fallback = machines.values().next().value as Machine | undefined;
  if (!fallback) {
    throw new Error(`No machine found for recipe type: ${recipeType || 'undefined'}`);
  }
  return fallback;
}


