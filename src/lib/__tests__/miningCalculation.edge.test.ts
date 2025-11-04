import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateMiningRequirements } from "../miningCalculation";
import { createMockGameData, createMockItem } from "../../test/factories/testDataFactory";

// Mock game data
const mockGameData = (() => {
  const gameData = createMockGameData();
  // 必要なアイテムを追加
  gameData.items.set(1001, createMockItem(1001, "Iron Ore"));
  gameData.items.set(1120, createMockItem(1120, "Hydrogen"));
  // allItemsも更新
  gameData.allItems.set(1001, gameData.items.get(1001)!);
  gameData.allItems.set(1120, gameData.items.get(1120)!);
  return gameData;
})();

describe("miningCalculation edge cases", () => {
  beforeEach(() => {
    // reset if needed
  });

  it("returns zeroes when calculationResult is null", () => {
    const res = calculateMiningRequirements(null);
    expect(res.rawMaterials).toEqual([]);
    expect(res.totalMiners).toBe(0);
    expect(res.totalOrbitalCollectors).toBe(0);
  });

  it("returns zeroes when game data missing", async () => {
    const res = calculateMiningRequirements(
      { rawMaterials: new Map([[1001, 60]]) } as any,
      1.0,
      "Advanced Mining Machine",
      100,
      null
    );
    expect(res.rawMaterials).toEqual([]);
    expect(res.totalMiners).toBe(0);
  });

  it("handles Advanced Mining Machine: workSpeedMultiplier and powerMultiplier fallbacks", async () => {
    const result = { rawMaterials: new Map([[1001, 60]]) } as any;
    // speed 100%: outputPerVein = 1.0 * 1.0 * (100/100) = 1.0, average veins/miner=6 ⇒ minersNeeded ~ ceil(60/1 /6)=10
    const r1 = calculateMiningRequirements(
      result,
      1.0,
      "Advanced Mining Machine",
      100,
      mockGameData
    );
    expect(r1.rawMaterials[0].workSpeedMultiplier).toBe(100);
    expect(r1.rawMaterials[0].powerMultiplier).toBe(1.0);
    expect(r1.totalMiners).toBeGreaterThan(0);

    // undefined speed key uses dynamic calculation for powerMultiplier
    const r2 = calculateMiningRequirements(
      result,
      1.0,
      "Advanced Mining Machine",
      123 as any,
      mockGameData
    );
    expect(r2.rawMaterials[0].powerMultiplier).toBeCloseTo(1.5129, 4); // (123/100)^2 = 1.5129
    expect(r2.rawMaterials[0].workSpeedMultiplier).toBe(123);
  });

  it("uses Mining Machine base speed and ignores workSpeedMultiplier", () => {
    const result = { rawMaterials: new Map([[1001, 3]]) } as any;
    const r = calculateMiningRequirements(result, 1.0, "Mining Machine", 300, mockGameData);
    // base per vein is 0.5, average 6 veins/miner → 3/ (0.5*6)=1 miner needed
    expect(r.totalMiners).toBe(1);
    expect(r.rawMaterials[0].workSpeedMultiplier).toBe(100); // fixed internally for basic miner
    expect(r.rawMaterials[0].powerMultiplier).toBe(1.0);
  });

  it("computes orbital collectors for Hydrogen with miningSpeedBonus applied", () => {
    const result = { rawMaterials: new Map([[1120, 1]]) } as any; // Hydrogen
    const r = calculateMiningRequirements(
      result,
      2.0,
      "Advanced Mining Machine",
      100,
      mockGameData
    );
    // base per collector 0.84 * bonus 2.0 = 1.68 → ceil(1 / 1.68) = 1
    expect(r.rawMaterials[0].orbitalCollectorSpeed).toBeCloseTo(1.68, 6);
    expect(r.rawMaterials[0].orbitCollectorsNeeded).toBe(1);
    expect(r.totalOrbitalCollectors).toBe(1);
  });
});
