import { describe, it, expect } from "vitest";
import { calculateConveyorBelts } from "../belt-calculation";

describe("calculateConveyorBelts", () => {
  it("should calculate required belts for given throughput", () => {
    const targetRate = 30; // 30 items/s
    const inputs = [{ itemId: 1, itemName: "Iron Ore", requiredRate: 30 }];
    const beltSpeed = 6; // Mk1 belt = 6 items/s

    // Output belts = ceil(30 / 6) = 5
    // Input belts = ceil(30 / 6) = 5
    // Total = 10
    const result = calculateConveyorBelts(targetRate, inputs, beltSpeed);

    expect(result.outputs).toBe(5);
    expect(result.inputs).toBe(5);
    expect(result.total).toBe(10);
  });

  it("should calculate saturation percentage", () => {
    const targetRate = 18; // 18 items/s
    const inputs = [{ itemId: 1, itemName: "Iron Ore", requiredRate: 18 }];
    const beltSpeed = 6; // Mk1 belt

    // Required belts = 3
    // Saturation = (18 / (3 * 6)) * 100 = 100%
    const result = calculateConveyorBelts(targetRate, inputs, beltSpeed);

    expect(result.saturation).toBe(100);
  });

  it("should return zero belts when belt speed is invalid", () => {
    const targetRate = 30;
    const inputs = [{ itemId: 1, itemName: "Iron Ore", requiredRate: 30 }];
    const beltSpeed = 0; // Invalid

    const result = calculateConveyorBelts(targetRate, inputs, beltSpeed);

    expect(result.total).toBe(0);
    expect(result.saturation).toBe(0);
  });

  it("should handle multiple input types", () => {
    const targetRate = 10;
    const inputs = [
      { itemId: 1, itemName: "Iron Ore", requiredRate: 8 },
      { itemId: 2, itemName: "Copper Ore", requiredRate: 5 },
    ];
    const beltSpeed = 6;

    // Output belts = ceil(10 / 6) = 2
    // Input belts = ceil(8 / 6) + ceil(5 / 6) = 2 + 1 = 3
    // Total = 5
    const result = calculateConveyorBelts(targetRate, inputs, beltSpeed);

    expect(result.outputs).toBe(2);
    expect(result.inputs).toBe(3);
    expect(result.total).toBe(5);
  });

  it("should identify bottleneck type", () => {
    const targetRate = 30; // High output rate
    const inputs = [
      { itemId: 1, itemName: "Iron Ore", requiredRate: 5 }, // Low input rate
    ];
    const beltSpeed = 6;

    const result = calculateConveyorBelts(targetRate, inputs, beltSpeed);

    // Output saturation = (30 / (5 * 6)) * 100 = 100%
    // Input saturation = (5 / (1 * 6)) * 100 = 83.3%
    // Should identify output as bottleneck
    expect(result.bottleneckType).toBe("output");
  });
});
