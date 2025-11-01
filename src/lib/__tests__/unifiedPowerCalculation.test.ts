import { beforeEach, describe, expect, it } from "vitest";
import { createMockGameData, createMockSettings } from "../../test/factories/testDataFactory";
import type { RecipeTreeNode } from "../../types";
import type { MiningCalculation } from "../miningCalculation";
import { calculateUnifiedPower } from "../unifiedPowerCalculation";

// モックデータの作成
function createMockRecipeTreeNode(): RecipeTreeNode {
  return {
    id: "test-node",
    recipe: {
      ID: 1,
      Name: "Test Recipe",
      Items: [{ ID: 1001, Count: 1 }],
      Results: [{ ID: 1002, Count: 1 }],
      TimeSpend: 1,
    },
    machine: {
      id: 2301,
      name: "Assembling Machine Mk.I",
      powerConsumption: 420,
      craftingSpeed: 0.75,
    },
    machineCount: 2,
    power: {
      machines: 840, // 420 * 2
      sorters: 60, // 30 * 2 (入力1 + 出力1)
      dysonSphere: 0,
    },
    children: [],
  };
}

function createMockMiningCalculation(): MiningCalculation {
  return {
    rawMaterials: [
      {
        itemId: 1001,
        itemName: "Iron Ore",
        requiredRate: 1.0,
        miningSpeedBonus: 1.0,
        workSpeedMultiplier: 1.0,
        powerMultiplier: 1.0,
        outputPerSecond: 0.5,
        minersNeeded: 2,
        veinsNeeded: 1,
        machineType: "Mining Machine",
      },
    ],
    totalMiners: 2,
    totalOrbitalCollectors: 0,
  };
}

describe("calculateUnifiedPower", () => {
  let mockGameData: any;
  let mockSettings: any;
  let mockRootNode: RecipeTreeNode;
  let mockMiningCalculation: MiningCalculation;

  beforeEach(() => {
    mockGameData = createMockGameData();
    mockSettings = createMockSettings();
    mockRootNode = createMockRecipeTreeNode();
    mockMiningCalculation = createMockMiningCalculation();
  });

  describe("基本的な電力計算", () => {
    it("単一ノードの電力計算が正しく行われる", () => {
      const result = calculateUnifiedPower(mockRootNode);

      // 設備電力: 840 kW (420 * 2)
      expect(result.machinesPower).toBe(840);
      // ソーター電力: 60 kW (30 * 2)
      expect(result.sortersPower).toBe(60);
      // 採掘電力: 0 kW (採掘計算なし)
      expect(result.miningPower).toBe(0);
      // 総消費電力: 840 + 60 = 900 kW
      expect(result.totalConsumption).toBe(900);
    });

    it("採掘計算を含む場合の電力計算が正しく行われる", () => {
      const result = calculateUnifiedPower(mockRootNode, mockMiningCalculation);

      // 設備電力: 840 kW
      expect(result.machinesPower).toBe(840);
      // ソーター電力: 60 kW
      expect(result.sortersPower).toBe(60);
      // 採掘電力: 840 kW (420 * 2台)
      expect(result.miningPower).toBe(840);
      // 総消費電力: 840 + 60 + 840 = 1740 kW
      expect(result.totalConsumption).toBe(1740);
    });

    it("電力内訳が正しく作成される", () => {
      const result = calculateUnifiedPower(mockRootNode, mockMiningCalculation);

      // 内訳の数: 設備1 + ソーター1 + 採掘機1 = 3
      expect(result.breakdown).toHaveLength(3);

      // 設備の内訳
      const machineBreakdown = result.breakdown.find(item => item.machineId === 2301);
      expect(machineBreakdown).toBeDefined();
      expect(machineBreakdown?.machineCount).toBe(2);
      expect(machineBreakdown?.powerPerMachine).toBe(420);
      expect(machineBreakdown?.totalPower).toBe(840);

      // ソーターの内訳
      const sorterBreakdown = result.breakdown.find(item => item.machineName.includes("ソーター"));
      expect(sorterBreakdown).toBeDefined();
      expect(sorterBreakdown?.machineCount).toBe(4); // 入力1 + 出力1 = 2台/設備 * 2設備
      expect(sorterBreakdown?.totalPower).toBe(60);

      // 採掘機の内訳
      const miningBreakdown = result.breakdown.find(
        item => item.machineId === 2301 && item.machineName.includes("Mining")
      );
      expect(miningBreakdown).toBeDefined();
      expect(miningBreakdown?.machineCount).toBe(2);
      expect(miningBreakdown?.powerPerMachine).toBe(420);
      expect(miningBreakdown?.totalPower).toBe(840);
    });
  });

  describe("レイレシーバーの特別処理", () => {
    it("レイレシーバーは設備電力から除外される", () => {
      const rayReceiverNode: RecipeTreeNode = {
        id: "ray-receiver",
        recipe: {
          ID: 2,
          Name: "Ray Receiver Recipe",
          Items: [{ ID: 1003, Count: 1 }],
          Results: [{ ID: 1004, Count: 1 }],
          TimeSpend: 1,
        },
        machine: {
          id: 2208, // Ray Receiver ID
          name: "Ray Receiver",
          powerConsumption: 0, // ダイソンスフィア電力を使用
          craftingSpeed: 1.0,
        },
        machineCount: 1,
        power: {
          machines: 0, // 設備電力は0
          sorters: 30, // ソーター電力のみ
          dysonSphere: 1000, // ダイソンスフィア電力
        },
        children: [],
      };

      const result = calculateUnifiedPower(rayReceiverNode);

      // 設備電力は0（レイレシーバーは除外）
      expect(result.machinesPower).toBe(0);
      // ソーター電力は30 kW
      expect(result.sortersPower).toBe(30);
      // ダイソンスフィア電力は1000 kW（参考用）
      expect(result.dysonSpherePower).toBe(1000);
      // 総消費電力は30 kW（ソーターのみ）
      expect(result.totalConsumption).toBe(30);
    });
  });

  describe("複雑な生産チェーン", () => {
    it("複数の子ノードがある場合の電力計算が正しく行われる", () => {
      const complexRootNode: RecipeTreeNode = {
        ...mockRootNode,
        children: [
          {
            id: "child-1",
            recipe: {
              ID: 2,
              Name: "Child Recipe 1",
              Items: [{ ID: 1003, Count: 1 }],
              Results: [{ ID: 1001, Count: 1 }],
              TimeSpend: 1,
            },
            machine: {
              id: 2302,
              name: "Assembling Machine Mk.II",
              powerConsumption: 630,
              craftingSpeed: 1.0,
            },
            machineCount: 1,
            power: {
              machines: 630,
              sorters: 30,
              dysonSphere: 0,
            },
            children: [],
          },
          {
            id: "child-2",
            recipe: {
              ID: 3,
              Name: "Child Recipe 2",
              Items: [{ ID: 1004, Count: 1 }],
              Results: [{ ID: 1003, Count: 1 }],
              TimeSpend: 1,
            },
            machine: {
              id: 2303,
              name: "Assembling Machine Mk.III",
              powerConsumption: 840,
              craftingSpeed: 1.5,
            },
            machineCount: 1,
            power: {
              machines: 840,
              sorters: 30,
              dysonSphere: 0,
            },
            children: [],
          },
        ],
      };

      const result = calculateUnifiedPower(complexRootNode);

      // 設備電力: 840 + 630 + 840 = 2310 kW
      expect(result.machinesPower).toBe(2310);
      // ソーター電力: 60 + 30 + 30 = 120 kW
      expect(result.sortersPower).toBe(120);
      // 総消費電力: 2310 + 120 = 2430 kW
      expect(result.totalConsumption).toBe(2430);
    });
  });

  describe("採掘機の種類別電力計算", () => {
    it("高度採掘機の電力計算が正しく行われる", () => {
      const advancedMiningCalculation: MiningCalculation = {
        rawMaterials: [
          {
            itemId: 1002,
            itemName: "Copper Ore",
            requiredRate: 2.0,
            miningSpeedBonus: 1.0,
            workSpeedMultiplier: 1.5, // 150% speed
            powerMultiplier: 2.25, // (150/100)^2 = 2.25
            outputPerSecond: 1.5,
            minersNeeded: 2,
            veinsNeeded: 1,
            machineType: "Advanced Mining Machine",
          },
        ],
        totalMiners: 2,
        totalOrbitalCollectors: 0,
      };

      const result = calculateUnifiedPower(mockRootNode, advancedMiningCalculation);

      // 高度採掘機の電力: 630 * 2.25 * 2 = 2835 kW
      expect(result.miningPower).toBe(2835);
      expect(result.totalConsumption).toBe(840 + 60 + 2835); // 3735 kW
    });

    it("水ポンプの電力計算が正しく行われる", () => {
      const waterPumpCalculation: MiningCalculation = {
        rawMaterials: [
          {
            itemId: 1000,
            itemName: "Water",
            requiredRate: 1.0,
            miningSpeedBonus: 1.0,
            workSpeedMultiplier: 1.0,
            powerMultiplier: 1.0,
            outputPerSecond: 1.0,
            minersNeeded: 1,
            veinsNeeded: 1,
            machineType: "Water Pump",
          },
        ],
        totalMiners: 1,
        totalOrbitalCollectors: 0,
      };

      const result = calculateUnifiedPower(mockRootNode, waterPumpCalculation);

      // 水ポンプの電力: 300 * 1 * 1 = 300 kW
      expect(result.miningPower).toBe(300);
      expect(result.totalConsumption).toBe(840 + 60 + 300); // 1200 kW
    });

    it("オイル抽出機の電力計算が正しく行われる", () => {
      const oilExtractorCalculation: MiningCalculation = {
        rawMaterials: [
          {
            itemId: 1007,
            itemName: "Crude Oil",
            requiredRate: 1.0,
            miningSpeedBonus: 1.0,
            workSpeedMultiplier: 1.0,
            powerMultiplier: 1.0,
            outputPerSecond: 1.0,
            minersNeeded: 1,
            veinsNeeded: 1,
            machineType: "Oil Extractor",
          },
        ],
        totalMiners: 1,
        totalOrbitalCollectors: 0,
      };

      const result = calculateUnifiedPower(mockRootNode, oilExtractorCalculation);

      // オイル抽出機の電力: 840 * 1 * 1 = 840 kW
      expect(result.miningPower).toBe(840);
      expect(result.totalConsumption).toBe(840 + 60 + 840); // 1740 kW
    });

    it("軌道採集器は電力消費しない", () => {
      const orbitalCollectorCalculation: MiningCalculation = {
        rawMaterials: [
          {
            itemId: 1120,
            itemName: "Hydrogen",
            requiredRate: 1.0,
            miningSpeedBonus: 1.0,
            workSpeedMultiplier: 1.0,
            powerMultiplier: 1.0,
            outputPerSecond: 0.84,
            minersNeeded: 0,
            veinsNeeded: 0,
            orbitCollectorsNeeded: 2,
            orbitalCollectorSpeed: 0.84,
            machineType: "Mining Machine", // 軌道採集器は採掘機ではないが、型の都合上
          },
        ],
        totalMiners: 0,
        totalOrbitalCollectors: 2,
      };

      const result = calculateUnifiedPower(mockRootNode, orbitalCollectorCalculation);

      // 軌道採集器は電力消費しない
      expect(result.miningPower).toBe(0);
      expect(result.totalConsumption).toBe(840 + 60); // 900 kW
    });
  });

  describe("エッジケース", () => {
    it("電力情報がないノードはスキップされる", () => {
      const nodeWithoutPower: RecipeTreeNode = {
        id: "no-power-node",
        recipe: {
          ID: 4,
          Name: "No Power Recipe",
          Items: [{ ID: 1005, Count: 1 }],
          Results: [{ ID: 1006, Count: 1 }],
          TimeSpend: 1,
        },
        machine: {
          id: 2301,
          name: "Assembling Machine Mk.I",
          powerConsumption: 420,
          craftingSpeed: 0.75,
        },
        machineCount: 1,
        // power プロパティがない
        children: [],
      };

      const result = calculateUnifiedPower(nodeWithoutPower);

      // 電力情報がないノードはスキップされる
      expect(result.machinesPower).toBe(0);
      expect(result.sortersPower).toBe(0);
      expect(result.totalConsumption).toBe(0);
    });

    it("machineCountが0の場合は電力内訳に含まれない", () => {
      const zeroCountNode: RecipeTreeNode = {
        id: "zero-count-node",
        recipe: {
          ID: 5,
          Name: "Zero Count Recipe",
          Items: [{ ID: 1007, Count: 1 }],
          Results: [{ ID: 1008, Count: 1 }],
          TimeSpend: 1,
        },
        machine: {
          id: 2301,
          name: "Assembling Machine Mk.I",
          powerConsumption: 420,
          craftingSpeed: 0.75,
        },
        machineCount: 0, // 設備数が0
        power: {
          machines: 0,
          sorters: 0,
          dysonSphere: 0,
        },
        children: [],
      };

      const result = calculateUnifiedPower(zeroCountNode);

      // 設備数が0の場合は電力内訳に含まれない
      expect(result.machinesPower).toBe(0);
      expect(result.sortersPower).toBe(0);
      expect(result.totalConsumption).toBe(0);
      expect(result.breakdown).toHaveLength(0);
    });

    it("設定やゲームデータがない場合でも動作する", () => {
      const result = calculateUnifiedPower(
        mockRootNode,
        mockMiningCalculation,
        undefined,
        undefined
      );

      // 設定やゲームデータがなくても基本的な計算は動作する
      expect(result.totalConsumption).toBe(1740);
      expect(result.breakdown).toHaveLength(3);
    });
  });

  describe("パーセンテージ計算", () => {
    it("電力内訳のパーセンテージが正しく計算される", () => {
      const result = calculateUnifiedPower(mockRootNode, mockMiningCalculation);

      // 総消費電力: 1740 kW
      // 設備電力: 840 kW (48.3%)
      // ソーター電力: 60 kW (3.4%)
      // 採掘電力: 840 kW (48.3%)

      const machineBreakdown = result.breakdown.find(
        item => item.machineId === 2301 && !item.machineName.includes("Mining")
      );
      expect(machineBreakdown?.percentage).toBeCloseTo(48.3, 1);

      const sorterBreakdown = result.breakdown.find(item => item.machineName.includes("ソーター"));
      expect(sorterBreakdown?.percentage).toBeCloseTo(3.4, 1);

      const miningBreakdown = result.breakdown.find(
        item => item.machineId === 2301 && item.machineName.includes("Mining")
      );
      expect(miningBreakdown?.percentage).toBeCloseTo(48.3, 1);
    });

    it("電力内訳が総電力の降順でソートされる", () => {
      const result = calculateUnifiedPower(mockRootNode, mockMiningCalculation);

      // 電力の大きい順にソートされていることを確認
      for (let i = 0; i < result.breakdown.length - 1; i++) {
        expect(result.breakdown[i].totalPower).toBeGreaterThanOrEqual(
          result.breakdown[i + 1].totalPower
        );
      }
    });
  });

  describe("空のケース", () => {
    it("空のノードを処理する", () => {
      const emptyNode: RecipeTreeNode = {
        id: "empty-node",
        children: [],
      };

      const result = calculateUnifiedPower(emptyNode);

      expect(result.totalConsumption).toBe(0);
      expect(result.machinesPower).toBe(0);
      expect(result.sortersPower).toBe(0);
      expect(result.miningPower).toBe(0);
      expect(result.dysonSpherePower).toBe(0);
      expect(result.breakdown).toHaveLength(0);
    });
  });
});
