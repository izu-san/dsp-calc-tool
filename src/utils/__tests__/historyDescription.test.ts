import { beforeEach, describe, expect, it, vi } from "vitest";
import * as gameDataStore from "../../stores/gameDataStore";
import type { GameData } from "../../types";
import {
  generateHistoryDescription,
  getAlternativeRecipeLabel,
  getAlternativeRecipeName,
  getConveyorBeltLabel,
  getMachineRankLabel,
  getProliferatorModeLabel,
  getProliferatorTypeLabel,
  getSorterLabel,
} from "../history/description";

// Mock gameDataStore
vi.mock("../../stores/gameDataStore", () => ({
  getMachineById: vi.fn(),
}));

describe("historyDescription", () => {
  const mockT = (key: string) => key;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProliferatorTypeLabel", () => {
    it("noneの場合", () => {
      expect(getProliferatorTypeLabel("none", mockT)).toBe("none");
    });

    it("mk1の場合", () => {
      expect(getProliferatorTypeLabel("mk1", mockT)).toBe("proliferatorMK1");
    });

    it("mk2の場合", () => {
      expect(getProliferatorTypeLabel("mk2", mockT)).toBe("proliferatorMK2");
    });

    it("mk3の場合", () => {
      expect(getProliferatorTypeLabel("mk3", mockT)).toBe("proliferatorMK3");
    });

    it("不明なタイプの場合はそのまま返す", () => {
      expect(getProliferatorTypeLabel("unknown", mockT)).toBe("unknown");
    });
  });

  describe("getProliferatorModeLabel", () => {
    it("speedの場合", () => {
      expect(getProliferatorModeLabel("speed", mockT)).toBe("speedMode");
    });

    it("productionの場合", () => {
      expect(getProliferatorModeLabel("production", mockT)).toBe("productionMode");
    });

    it("不明なモードの場合はそのまま返す", () => {
      expect(getProliferatorModeLabel("unknown", mockT)).toBe("unknown");
    });
  });

  describe("getMachineRankLabel", () => {
    it("arcの場合、機械名を返す", () => {
      vi.mocked(gameDataStore.getMachineById).mockReturnValue({
        id: 2302,
        name: "Arc Smelter",
      } as any);

      expect(getMachineRankLabel("smelting", "arc")).toBe("Arc Smelter");
    });

    it("機械が見つからない場合はランクをそのまま返す", () => {
      vi.mocked(gameDataStore.getMachineById).mockReturnValue(undefined);

      expect(getMachineRankLabel("smelting", "unknown")).toBe("unknown");
    });

    it("mk1の場合", () => {
      vi.mocked(gameDataStore.getMachineById).mockReturnValue({
        id: 2303,
        name: "製造台 Mk.I",
      } as any);

      expect(getMachineRankLabel("manufacturing", "mk1")).toBe("製造台 Mk.I");
    });

    it("mk2の場合", () => {
      vi.mocked(gameDataStore.getMachineById).mockReturnValue({
        id: 2304,
        name: "製造台 Mk.II",
      } as any);

      expect(getMachineRankLabel("manufacturing", "mk2")).toBe("製造台 Mk.II");
    });

    it("mk3の場合", () => {
      vi.mocked(gameDataStore.getMachineById).mockReturnValue({
        id: 2305,
        name: "製造台 Mk.III",
      } as any);

      expect(getMachineRankLabel("manufacturing", "mk3")).toBe("製造台 Mk.III");
    });
  });

  describe("getConveyorBeltLabel", () => {
    it("mk1の場合", () => {
      expect(getConveyorBeltLabel("mk1")).toBe("Mk.I");
    });

    it("mk2の場合", () => {
      expect(getConveyorBeltLabel("mk2")).toBe("Mk.II");
    });

    it("mk3の場合", () => {
      expect(getConveyorBeltLabel("mk3")).toBe("Mk.III");
    });

    it("不明なティアの場合はそのまま返す", () => {
      expect(getConveyorBeltLabel("unknown")).toBe("unknown");
    });
  });

  describe("getSorterLabel", () => {
    it("mk1の場合", () => {
      expect(getSorterLabel("mk1", mockT)).toBe("sorterMkI");
    });

    it("mk2の場合", () => {
      expect(getSorterLabel("mk2", mockT)).toBe("sorterMkII");
    });

    it("mk3の場合", () => {
      expect(getSorterLabel("mk3", mockT)).toBe("sorterMkIII");
    });

    it("pileの場合", () => {
      expect(getSorterLabel("pile", mockT)).toBe("pilingSorter");
    });

    it("不明なティアの場合はそのまま返す", () => {
      expect(getSorterLabel("unknown", mockT)).toBe("unknown");
    });
  });

  describe("getAlternativeRecipeLabel", () => {
    it("アイテム名とレシピ名を結合", () => {
      const mockData = {
        items: new Map([[1101, { id: 1101, name: "Iron Ingot" } as any]]),
        recipes: new Map([[1, { sid: 1, name: "Iron Smelting" } as any]]),
        machines: new Map(),
      } as GameData;

      const result = getAlternativeRecipeLabel(1101, 1, mockData, mockT);
      expect(result).toBe("Iron Ingot: Iron Smelting");
    });

    it("アイテムが見つからない場合", () => {
      const mockData = {
        items: new Map(),
        recipes: new Map([[1, { sid: 1, name: "Iron Smelting" } as any]]),
        machines: new Map(),
      } as GameData;

      const result = getAlternativeRecipeLabel(1101, 1, mockData, mockT);
      expect(result).toBe("アイテム1101: Iron Smelting");
    });

    it("レシピが見つからない場合", () => {
      const mockData = {
        items: new Map([[1101, { id: 1101, name: "Iron Ingot" } as any]]),
        recipes: new Map(),
        machines: new Map(),
      } as GameData;

      const result = getAlternativeRecipeLabel(1101, 1, mockData, mockT);
      expect(result).toBe("Iron Ingot: unknownRecipe");
    });

    it("データがnullの場合", () => {
      const result = getAlternativeRecipeLabel(1101, 1, null, mockT);
      expect(result).toBe("アイテム1101: unknownRecipe");
    });
  });

  describe("getAlternativeRecipeName", () => {
    it("レシピ名を返す", () => {
      const mockData = {
        items: new Map(),
        recipes: new Map([[1, { sid: 1, name: "Iron Smelting" } as any]]),
        machines: new Map(),
      } as GameData;

      const result = getAlternativeRecipeName(1101, 1, mockData, mockT);
      expect(result).toBe("Iron Smelting");
    });

    it("recipeSIDが-1の場合はmining", () => {
      const mockData = {
        items: new Map(),
        recipes: new Map(),
        machines: new Map(),
      } as GameData;

      const result = getAlternativeRecipeName(1101, -1, mockData, mockT);
      expect(result).toBe("mining");
    });

    it("レシピが見つからない場合", () => {
      const mockData = {
        items: new Map(),
        recipes: new Map(),
        machines: new Map(),
      } as GameData;

      const result = getAlternativeRecipeName(1101, 999, mockData, mockT);
      expect(result).toBe("unknownRecipe");
    });
  });

  describe("generateHistoryDescription", () => {
    const mockData = {
      items: new Map([[1101, { id: 1101, name: "Iron Ingot" } as any]]),
      recipes: new Map([[1, { sid: 1, name: "Iron Smelting" } as any]]),
      machines: new Map(),
    } as GameData;

    it("setProliferatorの説明を生成", () => {
      const before = { type: "mk1", mode: "speed" };
      const after = { type: "mk2", mode: "production" };

      const result = generateHistoryDescription("setProliferator", before, after, mockT, mockData);
      expect(result).toContain("proliferator");
      expect(result).toContain("proliferatorMK1");
      expect(result).toContain("proliferatorMK2");
    });

    it("setMachineRankの説明を生成", () => {
      const result = generateHistoryDescription("setMachineRank", "mk1", "mk2", mockT, mockData);
      expect(result).toContain("設備ランク");
      expect(result).toContain("mk1");
      expect(result).toContain("mk2");
    });

    it("setConveyorBeltの説明を生成", () => {
      const before = { tier: "mk1" };
      const after = { tier: "mk2" };

      const result = generateHistoryDescription("setConveyorBelt", before, after, mockT, mockData);
      expect(result).toContain("conveyorBelt");
      expect(result).toContain("Mk.I");
      expect(result).toContain("Mk.II");
    });

    it("setSorterの説明を生成", () => {
      const before = { tier: "mk1" };
      const after = { tier: "mk2" };

      const result = generateHistoryDescription("setSorter", before, after, mockT, mockData);
      expect(result).toContain("sorter");
      expect(result).toContain("sorterMkI");
      expect(result).toContain("sorterMkII");
    });

    it("setAlternativeRecipeの説明を生成（変更）", () => {
      const before = { itemId: 1101, recipeSID: 1 };
      const after = { itemId: 1101, recipeSID: 2 };

      const result = generateHistoryDescription(
        "setAlternativeRecipe",
        before,
        after,
        mockT,
        mockData
      );
      expect(result).toContain("alternativeRecipe");
      expect(result).toContain("Iron Ingot");
    });

    it("setAlternativeRecipeの説明を生成（新規設定）", () => {
      const after = { itemId: 1101, recipeSID: 1 };

      const result = generateHistoryDescription(
        "setAlternativeRecipe",
        undefined,
        after,
        mockT,
        mockData
      );
      expect(result).toContain("alternativeRecipe");
      expect(result).toContain("Iron Ingot");
      expect(result).toContain("設定");
    });

    it("setMiningSpeedResearchの説明を生成", () => {
      const result = generateHistoryDescription(
        "setMiningSpeedResearch",
        100,
        150,
        mockT,
        mockData
      );
      expect(result).toContain("miningSpeedResearch");
      expect(result).toContain("100");
      expect(result).toContain("150");
    });

    it("setTargetQuantityの説明を生成", () => {
      const result = generateHistoryDescription("setTargetQuantity", 60, 120, mockT, mockData);
      expect(result).toContain("target");
      expect(result).toContain("60");
      expect(result).toContain("120");
    });

    it("setSelectedRecipeの説明を生成（変更）", () => {
      const before = { name: "Iron Smelting" };
      const after = { name: "Steel Smelting" };

      const result = generateHistoryDescription(
        "setSelectedRecipe",
        before,
        after,
        mockT,
        mockData
      );
      expect(result).toContain("recipe");
      expect(result).toContain("Iron Smelting");
      expect(result).toContain("Steel Smelting");
    });

    it("setSelectedRecipeの説明を生成（新規）", () => {
      const after = { name: "Iron Smelting" };

      const result = generateHistoryDescription("setSelectedRecipe", null, after, mockT, mockData);
      expect(result).toContain("recipe");
      expect(result).toContain("Iron Smelting");
    });

    it("setSelectedRecipeの説明を生成（削除）", () => {
      const before = { name: "Iron Smelting" };

      const result = generateHistoryDescription("setSelectedRecipe", before, null, mockT, mockData);
      expect(result).toContain("recipe");
      expect(result).toContain("Iron Smelting");
      expect(result).toContain("削除");
    });

    it("不明なアクションの場合", () => {
      const result = generateHistoryDescription("unknownAction", null, null, mockT, mockData);
      expect(result).toContain("unknownAction");
      expect(result).toContain("変更");
    });
  });
});
