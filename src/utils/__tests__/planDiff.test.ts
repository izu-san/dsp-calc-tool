import { describe, expect, it } from "vitest";
import type { GameData, SavedPlan } from "../../types";
import { PROLIFERATOR_DATA } from "../../types/settings";
import { calculatePlanDiff, formatDiffValue, getPathDisplayName } from "../planDiff";

const createMockPlan = (overrides: Partial<SavedPlan>): SavedPlan => ({
  name: "Test Plan",
  timestamp: 1234567890,
  recipeSID: 1101,
  targetQuantity: 60,
  settings: {
    proliferator: PROLIFERATOR_DATA.none,
    machineRank: {
      Smelt: "arc",
      Assemble: "mk1",
      Chemical: "standard",
      Research: "standard",
      Refine: "standard",
      Particle: "standard",
    },
    conveyorBelt: { tier: "mk1", speed: 6, stackCount: 1 },
    sorter: { tier: "mk1", powerConsumption: 18 },
    alternativeRecipes: new Map(),
    miningSpeedResearch: 100,
    proliferatorMultiplier: { production: 1, speed: 1 },
  },
  alternativeRecipes: {},
  nodeOverrides: {},
  ...overrides,
});

describe("planDiff", () => {
  describe("calculatePlanDiff", () => {
    it("should detect no changes for identical plans", () => {
      const plan = createMockPlan({});
      const diffs = calculatePlanDiff(plan, plan);
      expect(diffs).toHaveLength(0);
    });

    it("should detect name change", () => {
      const before = createMockPlan({ name: "Old Plan" });
      const after = createMockPlan({ name: "New Plan" });
      const diffs = calculatePlanDiff(before, after);

      expect(diffs).toHaveLength(1);
      expect(diffs[0]).toEqual({
        path: "name",
        type: "change",
        before: "Old Plan",
        after: "New Plan",
      });
    });

    it("should detect recipeSID change", () => {
      const before = createMockPlan({ recipeSID: 1101 });
      const after = createMockPlan({ recipeSID: 1102 });
      const diffs = calculatePlanDiff(before, after);

      expect(diffs).toHaveLength(1);
      expect(diffs[0].path).toBe("recipeSID");
      expect(diffs[0].type).toBe("change");
      expect(diffs[0].before).toBe(1101);
      expect(diffs[0].after).toBe(1102);
    });

    it("should detect targetQuantity change", () => {
      const before = createMockPlan({ targetQuantity: 60 });
      const after = createMockPlan({ targetQuantity: 120 });
      const diffs = calculatePlanDiff(before, after);

      expect(diffs).toHaveLength(1);
      expect(diffs[0].path).toBe("targetQuantity");
      expect(diffs[0].type).toBe("change");
      expect(diffs[0].before).toBe(60);
      expect(diffs[0].after).toBe(120);
    });

    it("should detect proliferator type change", () => {
      const before = createMockPlan({ settings: { proliferator: PROLIFERATOR_DATA.none } });
      const after = createMockPlan({ settings: { proliferator: PROLIFERATOR_DATA.mk1 } });
      const diffs = calculatePlanDiff(before, after);

      expect(diffs).toHaveLength(1);
      expect(diffs[0].path).toBe("settings.proliferator.type");
      expect(diffs[0].type).toBe("change");
      expect(diffs[0].before).toBe("none");
      expect(diffs[0].after).toBe("mk1");
    });

    it("should detect proliferator mode change", () => {
      const beforeSettings = {
        ...createMockPlan({}).settings,
        proliferator: { ...PROLIFERATOR_DATA.mk1, mode: "speed" as const },
      };
      const afterSettings = {
        ...createMockPlan({}).settings,
        proliferator: { ...PROLIFERATOR_DATA.mk1, mode: "production" as const },
      };
      const before = createMockPlan({ settings: beforeSettings });
      const after = createMockPlan({ settings: afterSettings });
      const diffs = calculatePlanDiff(before, after);

      expect(diffs).toHaveLength(1);
      expect(diffs[0].path).toBe("settings.proliferator.mode");
      expect(diffs[0].type).toBe("change");
      expect(diffs[0].before).toBe("speed");
      expect(diffs[0].after).toBe("production");
    });

    it("should not detect derived values in proliferator", () => {
      const beforeSettings = {
        ...createMockPlan({}).settings,
        proliferator: PROLIFERATOR_DATA.mk1,
      };
      const afterSettings = {
        ...createMockPlan({}).settings,
        proliferator: {
          type: "mk1",
          mode: "speed" as const,
          productionBonus: 999, // Force different derived value
          speedBonus: 0.25,
          powerIncrease: 0.7,
        },
      };
      const before = createMockPlan({ settings: beforeSettings });
      const after = createMockPlan({ settings: afterSettings });
      const diffs = calculatePlanDiff(before, after);
      // Should not detect productionBonus, speedBonus, powerIncrease changes
      const derivedPaths = diffs.filter(
        d =>
          d.path.includes("productionBonus") ||
          d.path.includes("speedBonus") ||
          d.path.includes("powerIncrease")
      );
      expect(derivedPaths).toHaveLength(0);
    });

    it("should detect machineRank change", () => {
      const before = createMockPlan({
        settings: {
          machineRank: {
            Assemble: "mk1",
            Smelt: "arc" as const,
            Chemical: "standard" as const,
            Research: "standard" as const,
            Refine: "standard" as const,
            Particle: "standard" as const,
          },
        },
      });
      const after = createMockPlan({
        settings: {
          machineRank: {
            Assemble: "mk2",
            Smelt: "arc" as const,
            Chemical: "standard" as const,
            Research: "standard" as const,
            Refine: "standard" as const,
            Particle: "standard" as const,
          },
        },
      });
      const diffs = calculatePlanDiff(before, after);

      expect(diffs).toHaveLength(1);
      expect(diffs[0].path).toBe("settings.machineRank.Assemble");
      expect(diffs[0].type).toBe("change");
      expect(diffs[0].before).toBe("mk1");
      expect(diffs[0].after).toBe("mk2");
    });

    it("should detect conveyorBelt tier change but not derived values", () => {
      const before = createMockPlan({
        settings: { conveyorBelt: { tier: "mk1", speed: 6, stackCount: 1 } },
      });
      const after = createMockPlan({
        settings: { conveyorBelt: { tier: "mk3", speed: 30, stackCount: 4 } },
      });
      const diffs = calculatePlanDiff(before, after);

      expect(diffs).toHaveLength(1);
      expect(diffs[0].path).toBe("settings.conveyorBelt.tier");
      expect(diffs[0].before).toBe("mk1");
      expect(diffs[0].after).toBe("mk3");
      // Should not detect speed or stackCount changes
      const derivedPaths = diffs.filter(
        d => d.path.includes("speed") || d.path.includes("stackCount")
      );
      expect(derivedPaths).toHaveLength(0);
    });

    it("should detect sorter tier change but not derived values", () => {
      const before = createMockPlan({
        settings: { sorter: { tier: "mk1", powerConsumption: 18 } },
      });
      const after = createMockPlan({
        settings: { sorter: { tier: "pile", powerConsumption: 0.54 } },
      });
      const diffs = calculatePlanDiff(before, after);

      expect(diffs).toHaveLength(1);
      expect(diffs[0].path).toBe("settings.sorter.tier");
      expect(diffs[0].before).toBe("mk1");
      expect(diffs[0].after).toBe("pile");
      // Should not detect powerConsumption changes
      const derivedPaths = diffs.filter(d => d.path.includes("powerConsumption"));
      expect(derivedPaths).toHaveLength(0);
    });

    it("should detect multiple changes", () => {
      const before = createMockPlan({ name: "Old Plan", targetQuantity: 60 });
      const after = createMockPlan({ name: "New Plan", targetQuantity: 120 });
      const diffs = calculatePlanDiff(before, after);

      expect(diffs.length).toBeGreaterThanOrEqual(2);
      const nameDiff = diffs.find(d => d.path === "name");
      const quantityDiff = diffs.find(d => d.path === "targetQuantity");
      expect(nameDiff).toBeDefined();
      expect(quantityDiff).toBeDefined();
    });
  });

  describe("formatDiffValue", () => {
    it("should format numbers", () => {
      const formatted = formatDiffValue(123.456, undefined, undefined, undefined);
      expect(formatted).toBe("123.456");
    });

    it("should format strings", () => {
      const formatted = formatDiffValue("test", undefined, undefined, undefined);
      expect(formatted).toBe("test");
    });

    it("should format boolean", () => {
      const formatted = formatDiffValue(true, undefined, undefined, undefined);
      expect(formatted).toBe("true");
    });

    it("should format proliferator none", () => {
      const formatted = formatDiffValue(
        "none",
        "settings.proliferator.type",
        () => "なし",
        undefined
      );
      expect(formatted).toBe("なし");
    });

    it("should format proliferator modes", () => {
      const formattedSpeed = formatDiffValue(
        "speed",
        "settings.proliferator.mode",
        () => "生産速度上昇",
        undefined
      );
      expect(formattedSpeed).toBe("生産速度上昇");

      const formattedProduction = formatDiffValue(
        "production",
        "settings.proliferator.mode",
        () => "追加生産",
        undefined
      );
      expect(formattedProduction).toBe("追加生産");
    });

    it("should format sorter pile", () => {
      const formatted = formatDiffValue(
        "pile",
        "settings.sorter.tier",
        () => "集積ソーター",
        undefined
      );
      expect(formatted).toBe("集積ソーター");
    });

    it("should format undefined/null as em dash", () => {
      expect(formatDiffValue(undefined)).toBe("—");
      expect(formatDiffValue(null)).toBe("—");
    });

    it("should format machineRank with getMachineRankLabel", () => {
      const formatted = formatDiffValue("mk2", "settings.machineRank.Assemble");
      expect(formatted).toContain("mk2"); // getMachineRankLabelの結果を期待
    });

    it("should format recipeSID with GameData", () => {
      const mockData: Partial<GameData> = {
        recipes: new Map([[1101, { sid: 1101, name: "鉄インゴット" } as any]]),
      };
      const formatted = formatDiffValue(1101, "recipeSID", mockData as GameData);
      expect(formatted).toBe("鉄インゴット");
    });

    it("should format recipeSID without GameData", () => {
      const formatted = formatDiffValue(1101, "recipeSID");
      expect(formatted).toBe("1101");
    });

    it("should format alternative recipe with GameData", () => {
      const mockData: Partial<GameData> = {
        recipes: new Map([[2101, { sid: 2101, name: "高純度シリコン" } as any]]),
      };
      const formatted = formatDiffValue(2101, "alternativeRecipes.1105", mockData as GameData);
      expect(formatted).toBe("高純度シリコン");
    });

    it("should format proliferator type with translation function", () => {
      const t = (key: string) => {
        const map: Record<string, string> = {
          none: "なし",
          proliferatorMK1: "増産剤Mk.I",
          proliferatorMK2: "増産剤Mk.II",
          proliferatorMK3: "増産剤Mk.III",
        };
        return map[key] || key;
      };

      expect(formatDiffValue("none", "settings.proliferator.type", null, t)).toBe("なし");
      expect(formatDiffValue("mk1", "settings.proliferator.type", null, t)).toBe("増産剤Mk.I");
      expect(formatDiffValue("mk2", "settings.proliferator.type", null, t)).toBe("増産剤Mk.II");
      expect(formatDiffValue("mk3", "settings.proliferator.type", null, t)).toBe("増産剤Mk.III");
    });

    it("should format proliferator mode with translation function", () => {
      const t = (key: string) => {
        const map: Record<string, string> = {
          speedMode: "生産速度上昇",
          productionMode: "追加生産",
          none: "なし",
        };
        return map[key] || key;
      };

      expect(formatDiffValue("speed", "settings.proliferator.mode", null, t)).toBe("生産速度上昇");
      expect(formatDiffValue("production", "settings.proliferator.mode", null, t)).toBe("追加生産");
      expect(formatDiffValue("none", "settings.proliferator.mode", null, t)).toBe("なし");
    });

    it("should format sorter tier with translation function", () => {
      const t = (key: string) => {
        const map: Record<string, string> = {
          sorterMkI: "ソーターMk.I",
          sorterMkII: "ソーターMk.II",
          sorterMkIII: "ソーターMk.III",
          pilingSorter: "集積ソーター",
        };
        return map[key] || key;
      };

      expect(formatDiffValue("mk1", "settings.sorter.tier", null, t)).toBe("ソーターMk.I");
      expect(formatDiffValue("mk2", "settings.sorter.tier", null, t)).toBe("ソーターMk.II");
      expect(formatDiffValue("mk3", "settings.sorter.tier", null, t)).toBe("ソーターMk.III");
      expect(formatDiffValue("pile", "settings.sorter.tier", null, t)).toBe("集積ソーター");
    });

    it("should format objects as JSON", () => {
      const obj = { key: "value", nested: { num: 123 } };
      const formatted = formatDiffValue(obj);
      expect(formatted).toContain('"key"');
      expect(formatted).toContain('"value"');
      expect(formatted).toContain('"nested"');
    });

    it("should handle unknown value types as string", () => {
      const symbol = Symbol("test");
      const formatted = formatDiffValue(symbol);
      expect(formatted).toContain("Symbol");
    });
  });

  describe("getPathDisplayName", () => {
    const mockT = (key: string) => {
      const map: Record<string, string> = {
        planName: "プラン名",
        recipe: "レシピ",
        targetQuantity: "目標生産量",
        description: "説明",
        proliferator: "増産剤",
        proliferatorMode: "増産剤モード",
        machineRank: "設備ランク",
        conveyorBelt: "ベルト",
        sorter: "ソーター",
        miningSpeedResearch: "採掘速度研究",
        alternativeRecipes: "代替レシピ",
        alternativeRecipe: "代替レシピ",
        nodeOverrides: "ノード上書き",
        "powerGeneration.title": "発電設定",
        smelter: "製錬所",
        assembler: "組立機",
        chemicalPlant: "化学工場",
        matrixLab: "研究所",
        oilRefinery: "精製所",
        particleCollider: "粒子加速器",
      };
      return map[key] || key;
    };

    it("should translate basic fields", () => {
      expect(getPathDisplayName("name", mockT)).toBe("プラン名");
      expect(getPathDisplayName("recipeSID", mockT)).toBe("レシピ");
      expect(getPathDisplayName("targetQuantity", mockT)).toBe("目標生産量");
      expect(getPathDisplayName("description", mockT)).toBe("説明");
    });

    it("should translate settings fields", () => {
      expect(getPathDisplayName("settings.proliferator.type", mockT)).toBe("増産剤");
      expect(getPathDisplayName("settings.proliferator.mode", mockT)).toBe("増産剤モード");
      expect(getPathDisplayName("settings.conveyorBelt.tier", mockT)).toBe("ベルト");
      expect(getPathDisplayName("settings.sorter.tier", mockT)).toBe("ソーター");
      expect(getPathDisplayName("settings.miningSpeedResearch", mockT)).toBe("採掘速度研究");
    });

    it("should translate machineRank fields with recipe type", () => {
      expect(getPathDisplayName("settings.machineRank.Smelt", mockT)).toBe("設備ランク (製錬所)");
      expect(getPathDisplayName("settings.machineRank.Assemble", mockT)).toBe(
        "設備ランク (組立機)"
      );
      expect(getPathDisplayName("settings.machineRank.Chemical", mockT)).toBe(
        "設備ランク (化学工場)"
      );
      expect(getPathDisplayName("settings.machineRank.Research", mockT)).toBe(
        "設備ランク (研究所)"
      );
      expect(getPathDisplayName("settings.machineRank.Refine", mockT)).toBe("設備ランク (精製所)");
      expect(getPathDisplayName("settings.machineRank.Particle", mockT)).toBe(
        "設備ランク (粒子加速器)"
      );
    });

    it("should handle unknown machineRank recipe type", () => {
      const result = getPathDisplayName("settings.machineRank.UnknownType", mockT);
      expect(result).toContain("設備ランク");
      expect(result).toContain("UnknownType");
    });

    it("should translate alternative recipes", () => {
      expect(getPathDisplayName("alternativeRecipes", mockT)).toBe("代替レシピ");
      expect(getPathDisplayName("alternativeRecipes.1105", mockT)).toBe("代替レシピ");
      expect(getPathDisplayName("alternativeRecipes.2301", mockT)).toBe("代替レシピ");
    });

    it("should translate other common paths", () => {
      expect(getPathDisplayName("nodeOverrides", mockT)).toBe("ノード上書き");
      expect(getPathDisplayName("powerGenerationSettings", mockT)).toBe("発電設定");
    });

    it("should fallback to translation function for unknown paths", () => {
      const unknownPath = "unknown.path";
      expect(getPathDisplayName(unknownPath, mockT)).toBe(unknownPath);
    });
  });

  describe("calculatePlanDiff - edge cases", () => {
    it("should detect description change", () => {
      const before = createMockPlan({ description: "Old description" });
      const after = createMockPlan({ description: "New description" });
      const diffs = calculatePlanDiff(before, after);

      const descDiff = diffs.find(d => d.path === "description");
      expect(descDiff).toBeDefined();
      expect(descDiff?.type).toBe("change");
      expect(descDiff?.before).toBe("Old description");
      expect(descDiff?.after).toBe("New description");
    });

    it("should detect description addition", () => {
      const before = createMockPlan({});
      const after = createMockPlan({ description: "New description" });
      const diffs = calculatePlanDiff(before, after);

      const descDiff = diffs.find(d => d.path === "description");
      expect(descDiff).toBeDefined();
      expect(descDiff?.type).toBe("add");
      expect(descDiff?.after).toBe("New description");
    });

    it("should detect description removal", () => {
      const before = createMockPlan({ description: "Old description" });
      const after = createMockPlan({});
      const diffs = calculatePlanDiff(before, after);

      const descDiff = diffs.find(d => d.path === "description");
      expect(descDiff).toBeDefined();
      expect(descDiff?.type).toBe("remove");
      expect(descDiff?.before).toBe("Old description");
    });

    it("should detect alternative recipe change", () => {
      const before = createMockPlan({ alternativeRecipes: { 1105: 2101 } });
      const after = createMockPlan({ alternativeRecipes: { 1105: 2102 } });
      const diffs = calculatePlanDiff(before, after);

      const altRecipeDiff = diffs.find(d => d.path === "alternativeRecipes.1105");
      expect(altRecipeDiff).toBeDefined();
      expect(altRecipeDiff?.type).toBe("change");
      expect(altRecipeDiff?.before).toBe(2101);
      expect(altRecipeDiff?.after).toBe(2102);
    });

    it("should detect alternative recipe addition", () => {
      const before = createMockPlan({ alternativeRecipes: {} });
      const after = createMockPlan({ alternativeRecipes: { 1105: 2101 } });
      const diffs = calculatePlanDiff(before, after);

      const altRecipeDiff = diffs.find(d => d.path === "alternativeRecipes.1105");
      expect(altRecipeDiff).toBeDefined();
      expect(altRecipeDiff?.type).toBe("add");
      expect(altRecipeDiff?.after).toBe(2101);
    });

    it("should detect alternative recipe removal", () => {
      const before = createMockPlan({ alternativeRecipes: { 1105: 2101 } });
      const after = createMockPlan({ alternativeRecipes: {} });
      const diffs = calculatePlanDiff(before, after);

      const altRecipeDiff = diffs.find(d => d.path === "alternativeRecipes.1105");
      expect(altRecipeDiff).toBeDefined();
      expect(altRecipeDiff?.type).toBe("remove");
      expect(altRecipeDiff?.before).toBe(2101);
    });

    it("should detect nodeOverrides change", () => {
      const before = createMockPlan({ nodeOverrides: { "1-2": { targetMachineCount: 5 } as any } });
      const after = createMockPlan({ nodeOverrides: { "1-2": { targetMachineCount: 10 } as any } });
      const diffs = calculatePlanDiff(before, after);

      const nodeOverrideDiff = diffs.find(d => d.path.startsWith("nodeOverrides"));
      expect(nodeOverrideDiff).toBeDefined();
    });

    it("should detect powerGenerationSettings addition", () => {
      const before = createMockPlan({});
      const after = createMockPlan({
        powerGenerationSettings: {
          template: "hydrogen-fuel",
        } as any,
      });
      const diffs = calculatePlanDiff(before, after);

      const powerDiff = diffs.find(d => d.path.startsWith("powerGenerationSettings"));
      expect(powerDiff).toBeDefined();
      expect(powerDiff?.type).toBe("add");
    });

    it("should detect powerGenerationSettings change", () => {
      const before = createMockPlan({
        powerGenerationSettings: {
          template: "hydrogen-fuel",
        } as any,
      });
      const after = createMockPlan({
        powerGenerationSettings: {
          template: "antimatter-fuel",
        } as any,
      });
      const diffs = calculatePlanDiff(before, after);

      const templateDiff = diffs.find(d => d.path === "powerGenerationSettings.template");
      expect(templateDiff).toBeDefined();
      expect(templateDiff?.type).toBe("change");
      expect(templateDiff?.before).toBe("hydrogen-fuel");
      expect(templateDiff?.after).toBe("antimatter-fuel");
    });

    it("should detect miningSpeedResearch change", () => {
      const beforeSettings = {
        ...createMockPlan({}).settings,
        miningSpeedResearch: 100,
      };
      const afterSettings = {
        ...createMockPlan({}).settings,
        miningSpeedResearch: 150,
      };
      const before = createMockPlan({ settings: beforeSettings });
      const after = createMockPlan({ settings: afterSettings });
      const diffs = calculatePlanDiff(before, after);

      const miningDiff = diffs.find(d => d.path === "settings.miningSpeedResearch");
      expect(miningDiff).toBeDefined();
      expect(miningDiff?.type).toBe("change");
      expect(miningDiff?.before).toBe(100);
      expect(miningDiff?.after).toBe(150);
    });
  });

  describe("formatDiffValue - edge cases", () => {
    it("should format proliferator mode 'none' without translation function", () => {
      const formatted = formatDiffValue("none", "settings.proliferator.mode");
      expect(formatted).toBe("なし");
    });

    it("should handle proliferator type 'none' without translation function", () => {
      const formatted = formatDiffValue("none", "settings.proliferator.type");
      expect(formatted).toBe("なし");
    });

    it("should handle unknown sorter tier without translation function", () => {
      const formatted = formatDiffValue("unknown", "settings.sorter.tier");
      expect(formatted).toBe("unknown");
    });
  });

  describe("compareObject - edge cases", () => {
    it("should detect change when before is null and after is object", () => {
      const before = createMockPlan({ powerGenerationSettings: undefined });
      const after = createMockPlan({
        powerGenerationSettings: { template: "test" } as any,
      });
      const diffs = calculatePlanDiff(before, after);

      const powerDiff = diffs.find(d => d.path === "powerGenerationSettings");
      expect(powerDiff).toBeDefined();
      expect(powerDiff?.type).toBe("add");
    });

    it("should detect change when before is object and after is null", () => {
      const before = createMockPlan({
        powerGenerationSettings: { template: "test" } as any,
      });
      const after = createMockPlan({ powerGenerationSettings: undefined });
      const diffs = calculatePlanDiff(before, after);

      const powerDiff = diffs.find(d => d.path === "powerGenerationSettings");
      expect(powerDiff).toBeDefined();
      expect(powerDiff?.type).toBe("remove");
    });

    it("should detect change when before and after are primitive values", () => {
      // This tests the non-object branch in compareObject
      // Achieved through nodeOverrides with non-object values
      const before = createMockPlan({ nodeOverrides: { test: "value1" } as any });
      const after = createMockPlan({ nodeOverrides: { test: "value2" } as any });
      const diffs = calculatePlanDiff(before, after);

      const nodeDiff = diffs.find(d => d.path === "nodeOverrides.test");
      expect(nodeDiff).toBeDefined();
      expect(nodeDiff?.type).toBe("change");
    });
  });
});
