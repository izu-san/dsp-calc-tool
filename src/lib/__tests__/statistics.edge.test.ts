import { describe, it, expect } from "vitest";
import {
  calculateItemStatistics,
  getSortedItems,
  getRawMaterials,
  getIntermediateProducts,
  getFinalProducts,
} from "../statistics";
import {
  createRecipeNode,
  createRawMaterialNode,
  createSingleOutputRecipe,
} from "../../test/factories/testDataFactory";
import { PROLIFERATOR_DATA } from "../../types/settings";
import type { RecipeTreeNode } from "../../types/calculation";

describe("statistics edge cases", () => {
  it("handles empty tree gracefully", () => {
    const emptyRoot = createRecipeNode({
      recipe: undefined,
      machine: undefined,
      targetOutputRate: 0,
      machineCount: 0,
      proliferator: { ...PROLIFERATOR_DATA.none, mode: "production" },
      power: { machines: 0, sorters: 0, dysonSphere: 0, total: 0 },
      inputs: [],
      children: [],
      conveyorBelts: { inputs: 0, outputs: 0, total: 0 },
      nodeId: "root",
    }) as unknown as RecipeTreeNode & { isRawMaterial?: boolean };
    emptyRoot.isRawMaterial = false;

    const stats = calculateItemStatistics(emptyRoot);
    expect(stats.totalMachines).toBe(0);
    expect(stats.totalPower).toBe(0);
    expect(stats.items.size).toBe(0);
    expect(getSortedItems(stats)).toEqual([]);
    expect(getRawMaterials(stats)).toEqual([]);
    expect(getIntermediateProducts(stats)).toEqual([]);
    expect(getFinalProducts(stats)).toEqual([]);
  });

  it("treats raw material child as consumption only when no recipe", () => {
    const rawChild = createRawMaterialNode({
      itemId: 1001,
      itemName: "Iron Ore",
      targetOutputRate: 60,
      nodeId: "raw-1001-0",
    });
    (rawChild as { conveyorBelts?: { outputs?: number } }).conveyorBelts = { outputs: 1 };

    const recipe = createSingleOutputRecipe({
      SID: 2001,
      name: "Test Recipe",
      type: "Assemble",
      timeSpend: 60,
      inputId: 1001,
      inputName: "Iron Ore",
      inputCount: 1,
      outputId: 1002,
      outputName: "Test Item",
      outputCount: 1,
    });

    const root = createRecipeNode({
      recipe,
      machine: undefined,
      targetOutputRate: 60,
      machineCount: 1,
      proliferator: { ...PROLIFERATOR_DATA.none, mode: "production" },
      power: { machines: 120, sorters: 0, dysonSphere: 0, total: 120 },
      inputs: [{ itemId: 1001, itemName: "Iron Ore", requiredRate: 60 }],
      children: [rawChild],
      conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
      nodeId: "root",
    }) as unknown as RecipeTreeNode & { isRawMaterial?: boolean };
    root.isRawMaterial = false;

    const stats = calculateItemStatistics(root);
    // raw material is registered as consumption only
    const raw = stats.items.get(1001)!;
    expect(raw).toBeTruthy();
    expect(raw.isRawMaterial).toBe(true);
    expect(raw.totalProduction).toBe(0);
    // root.inputs の 60 のみがカウントされる（raw child の 60 は重複カウントしない）
    expect(raw.totalConsumption).toBe(60);
    expect(raw.netProduction).toBe(-60);

    // product item is produced
    const prod = stats.items.get(1002)!;
    expect(prod.totalProduction).toBe(60);
    expect(prod.totalConsumption).toBe(0);

    // group helpers do not crash
    expect(getSortedItems(stats).length).toBe(2);
    expect(getRawMaterials(stats).length).toBe(1);
    expect(getIntermediateProducts(stats).length).toBe(0);
    expect(getFinalProducts(stats).length).toBe(1);
  });

  it("proportional outputs are calculated relative to main output count", () => {
    const recipe = createSingleOutputRecipe({
      SID: 3001,
      name: "Multi Output Recipe",
      type: "Chemical",
      timeSpend: 60,
      inputId: 1,
      inputName: "Input",
      inputCount: 1,
      outputId: 2000,
      outputName: "Main Output",
      outputCount: 2,
    });
    recipe.Results.push({
      id: 2001,
      name: "Secondary Output",
      count: 1,
      Type: "Material",
      isRaw: false,
    });

    const root = createRecipeNode({
      recipe,
      machine: undefined,
      targetOutputRate: 60,
      machineCount: 1,
      proliferator: { ...PROLIFERATOR_DATA.none, mode: "production" },
      power: { machines: 120, sorters: 0, dysonSphere: 0, total: 120 },
      inputs: [],
      children: [],
      conveyorBelts: { inputs: 1, outputs: 2, total: 3 },
      nodeId: "root",
    }) as unknown as RecipeTreeNode & { isRawMaterial?: boolean };
    root.isRawMaterial = false;

    const stats = calculateItemStatistics(root);
    const main = stats.items.get(2000)!;
    const sub = stats.items.get(2001)!;
    expect(main.totalProduction).toBe(60);
    // proportional: 60 * (1 / 2) = 30
    expect(sub.totalProduction).toBeCloseTo(30, 6);
  });
});
