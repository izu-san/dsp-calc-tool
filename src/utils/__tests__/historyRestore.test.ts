import { describe, it, expect, beforeEach, vi } from "vitest";
import { restoreStateFromHistory } from "../historyRestore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useNodeOverrideStore } from "../../stores/nodeOverrideStore";
import { useRecipeSelectionStore } from "../../stores/recipeSelectionStore";
import { useGameDataStore } from "../../stores/gameDataStore";
import { useMiningSettingsStore } from "../../stores/miningSettingsStore";
import { PROLIFERATOR_DATA } from "../../types/settings";
import type { HistoryEntry } from "../../types/history";
import { generateUUID, HISTORY_VERSION } from "../historyUtils";
import { setRestoring } from "../historyRecorder";
import { serializeSettings } from "../storageSerializer";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock as Storage;

describe("historyRestore", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.getState().resetSettings();
    useNodeOverrideStore.getState().clearAllOverrides();
    useRecipeSelectionStore.setState({
      selectedRecipe: null,
      targetQuantity: 1,
      calculationResult: null,
    });
    useMiningSettingsStore.setState({
      settings: {
        machineType: "Advanced Mining Machine",
        workSpeedMultiplier: 100,
      },
    });
    setRestoring(false);
  });

  describe("restoreStateFromHistory - settings", () => {
    it("should restore proliferator settings", () => {
      const before = useSettingsStore.getState().settings;
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "増産剤変更",
        changes: {
          "settings.proliferator.type": "mk1",
          "settings.proliferator.mode": "production",
        },
        previousChanges: {
          "settings.proliferator.type": before.proliferator.type,
          "settings.proliferator.mode": before.proliferator.mode,
        },
        version: HISTORY_VERSION,
      };

      // First apply changes (simulate forward change)
      restoreStateFromHistory(entry, false);

      let settings = useSettingsStore.getState().settings;
      expect(settings.proliferator.type).toBe("mk1");
      expect(settings.proliferator.mode).toBe("production");

      // Then undo
      restoreStateFromHistory(entry, true);

      settings = useSettingsStore.getState().settings;
      expect(settings.proliferator.type).toBe("none");
      expect(settings.proliferator.mode).toBe("speed");
    });

    it("should restore machine rank settings", () => {
      const before = useSettingsStore.getState().settings;
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "機械ランク変更",
        changes: {
          "settings.machineRank.Assemble": "mk2",
        },
        previousChanges: {
          "settings.machineRank.Assemble": before.machineRank.Assemble,
        },
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const settings = useSettingsStore.getState().settings;
      expect(settings.machineRank.Assemble).toBe("mk2");
    });

    it("should restore alternative recipes Map", () => {
      const before = useSettingsStore.getState().settings;
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "代替レシピ変更",
        changes: {
          "settings.alternativeRecipes": {
            "1001": 2001,
          },
        },
        previousChanges: {
          "settings.alternativeRecipes": {},
        },
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const settings = useSettingsStore.getState().settings;
      expect(settings.alternativeRecipes.get(1001)).toBe(2001);
    });

    it("should restore multiple nested settings", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "複数設定変更",
        changes: {
          "settings.proliferator.type": "mk2",
          "settings.proliferator.mode": "speed",
          "settings.machineRank.Chemical": "quantum",
          "settings.conveyorBelt.tier": "mk2",
        },
        previousChanges: {},
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const settings = useSettingsStore.getState().settings;
      expect(settings.proliferator.type).toBe("mk2");
      expect(settings.proliferator.mode).toBe("speed");
      expect(settings.machineRank.Chemical).toBe("quantum");
      expect(settings.conveyorBelt.tier).toBe("mk2");
    });

    it("should restore sorter settings", () => {
      const before = useSettingsStore.getState().settings;
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "ソーター設定変更",
        changes: {
          "settings.sorter": "mk2",
        },
        previousChanges: {
          "settings.sorter": before.sorter,
        },
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const settings = useSettingsStore.getState().settings;
      expect(settings.sorter).toBe("mk2");
    });

    it("should restore mining speed research bonus", () => {
      const before = useSettingsStore.getState().settings;
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "採掘速度研究ボーナス変更",
        changes: {
          "settings.miningSpeedResearch": 150,
        },
        previousChanges: {
          "settings.miningSpeedResearch": before.miningSpeedResearch,
        },
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const settings = useSettingsStore.getState().settings;
      expect(settings.miningSpeedResearch).toBe(150);
    });

    it("should restore proliferator multiplier", () => {
      const before = useSettingsStore.getState().settings;
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "増産剤倍率変更",
        changes: {
          "settings.proliferatorMultiplier.production": 2,
          "settings.proliferatorMultiplier.speed": 1.5,
        },
        previousChanges: {
          "settings.proliferatorMultiplier.production": before.proliferatorMultiplier.production,
          "settings.proliferatorMultiplier.speed": before.proliferatorMultiplier.speed,
        },
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const settings = useSettingsStore.getState().settings;
      expect(settings.proliferatorMultiplier.production).toBe(2);
      expect(settings.proliferatorMultiplier.speed).toBe(1.5);
    });

    it("should restore photon generation settings", () => {
      const before = useSettingsStore.getState().settings;
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "光子生成設定変更",
        changes: {
          "settings.photonGeneration.enabled": true,
          "settings.photonGeneration.mode": "rayReceiver",
        },
        previousChanges: {
          "settings.photonGeneration.enabled": before.photonGeneration.enabled,
          "settings.photonGeneration.mode": before.photonGeneration.mode,
        },
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const settings = useSettingsStore.getState().settings;
      expect(settings.photonGeneration.enabled).toBe(true);
      expect(settings.photonGeneration.mode).toBe("rayReceiver");
    });
  });

  describe("restoreStateFromHistory - nodeOverrides", () => {
    it("should restore node override", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "nodeOverride",
        description: "ノード設定変更",
        changes: {
          "nodeOverrides.node-1": {
            machineRank: "mk2",
            proliferator: { ...PROLIFERATOR_DATA.mk1, mode: "speed" },
          },
        },
        previousChanges: {},
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const overrides = useNodeOverrideStore.getState().nodeOverrides;
      expect(overrides.has("node-1")).toBe(true);
      expect(overrides.get("node-1")?.machineRank).toBe("mk2");
    });

    it("should restore nested node override property", () => {
      // First create an override
      useNodeOverrideStore.getState().setNodeOverride("node-1", {
        machineRank: "mk1",
        proliferator: { ...PROLIFERATOR_DATA.none, mode: "speed" },
      });

      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "nodeOverride",
        description: "ノード機械ランク変更",
        changes: {
          "nodeOverrides.node-1.machineRank": "mk2",
        },
        previousChanges: {
          "nodeOverrides.node-1.machineRank": "mk1",
        },
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const overrides = useNodeOverrideStore.getState().nodeOverrides;
      expect(overrides.get("node-1")?.machineRank).toBe("mk2");
    });

    it("should delete node override when value is undefined", () => {
      // First create an override
      useNodeOverrideStore.getState().setNodeOverride("node-1", {
        machineRank: "mk1",
      });

      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "nodeOverride",
        description: "ノード設定削除",
        changes: {
          "nodeOverrides.node-1": undefined,
        },
        previousChanges: {},
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const overrides = useNodeOverrideStore.getState().nodeOverrides;
      expect(overrides.has("node-1")).toBe(false);
    });
  });

  describe("restoreStateFromHistory - plan changes", () => {
    it("should restore target quantity", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "plan",
        description: "目標生産量変更",
        changes: {
          targetQuantity: 10,
        },
        previousChanges: {
          targetQuantity: 1,
        },
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const targetQuantity = useRecipeSelectionStore.getState().targetQuantity;
      expect(targetQuantity).toBe(10);
    });

    it("should restore selected recipe", () => {
      // Create a mock recipe in game data
      const mockRecipe = {
        SID: 1001,
        name: "Test Recipe",
        TimeSpend: 1,
        Items: [],
        Results: [{ id: 1, name: "Test Item", count: 1, Type: "Item", isRaw: false }],
        Type: "Assemble" as const,
        Explicit: false,
        GridIndex: "1001",
        productive: true,
      };

      useGameDataStore.setState({
        data: {
          recipes: new Map([[1001, mockRecipe]]),
          items: new Map(),
          machines: new Map(),
          recipesByItemId: new Map(),
          allItems: new Map(),
        },
      });

      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "plan",
        description: "レシピ選択変更",
        changes: {
          "selectedRecipe.recipeSID": 1001,
        },
        previousChanges: {
          "selectedRecipe.recipeSID": null,
        },
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const selectedRecipe = useRecipeSelectionStore.getState().selectedRecipe;
      expect(selectedRecipe).not.toBeNull();
      expect(selectedRecipe?.SID).toBe(1001);
    });

    it("should clear selected recipe when recipeSID is null", () => {
      // First set a recipe
      const mockRecipe = {
        SID: 1001,
        name: "Test Recipe",
        TimeSpend: 1,
        Items: [],
        Results: [{ id: 1, name: "Test Item", count: 1, Type: "Item", isRaw: false }],
        Type: "Assemble" as const,
        Explicit: false,
        GridIndex: "1001",
        productive: true,
      };

      useGameDataStore.setState({
        data: {
          recipes: new Map([[1001, mockRecipe]]),
          items: new Map(),
          machines: new Map(),
          recipesByItemId: new Map(),
          allItems: new Map(),
        },
      });

      useRecipeSelectionStore.setState({ selectedRecipe: mockRecipe });

      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "plan",
        description: "レシピ選択クリア",
        changes: {
          "selectedRecipe.recipeSID": null,
        },
        previousChanges: {
          "selectedRecipe.recipeSID": 1001,
        },
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const selectedRecipe = useRecipeSelectionStore.getState().selectedRecipe;
      expect(selectedRecipe).toBeNull();
    });
  });

  describe("restoreStateFromHistory - miningSettings", () => {
    it("should restore mining machine type", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "採掘機械タイプ変更",
        changes: {
          "miningSettings.machineType": "Mining Machine",
        },
        previousChanges: {
          "miningSettings.machineType": "Advanced Mining Machine",
        },
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const settings = useMiningSettingsStore.getState().settings;
      expect(settings.machineType).toBe("Mining Machine");
    });

    it("should restore mining work speed multiplier", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "作業速度変更",
        changes: {
          "miningSettings.workSpeedMultiplier": 200,
        },
        previousChanges: {
          "miningSettings.workSpeedMultiplier": 100,
        },
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const settings = useMiningSettingsStore.getState().settings;
      expect(settings.workSpeedMultiplier).toBe(200);
    });
  });

  describe("restoreStateFromHistory - powerGeneration", () => {
    it("should restore power generation template", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "powerGeneration",
        description: "発電設備テンプレート変更",
        changes: {
          powerGenerationTemplate: "earlyGame",
        },
        previousChanges: {
          powerGenerationTemplate: "default",
        },
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const template = useSettingsStore.getState().powerGenerationTemplate;
      expect(template).toBe("earlyGame");
    });

    it("should restore manual power generator", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "powerGeneration",
        description: "手動発電設備選択",
        changes: {
          manualPowerGenerator: "SolarPanel",
        },
        previousChanges: {
          manualPowerGenerator: null,
        },
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const generator = useSettingsStore.getState().manualPowerGenerator;
      expect(generator).toBe("SolarPanel");
    });

    it("should restore manual power fuel", () => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "powerGeneration",
        description: "手動燃料選択",
        changes: {
          manualPowerFuel: "Coal",
        },
        previousChanges: {
          manualPowerFuel: null,
        },
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const fuel = useSettingsStore.getState().manualPowerFuel;
      expect(fuel).toBe("Coal");
    });

    it("should restore power fuel proliferator", () => {
      const before = useSettingsStore.getState().powerFuelProliferator;
      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "powerGeneration",
        description: "燃料増産剤設定変更",
        changes: {
          "powerFuelProliferator.type": "mk1",
          "powerFuelProliferator.mode": "production",
        },
        previousChanges: {
          "powerFuelProliferator.type": before.type,
          "powerFuelProliferator.mode": before.mode,
        },
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const proliferator = useSettingsStore.getState().powerFuelProliferator;
      expect(proliferator.type).toBe("mk1");
      expect(proliferator.mode).toBe("production");
    });
  });

  describe("restoreStateFromHistory - restoring flag", () => {
    it("should set restoring flag during restoration", async () => {
      const historyRecorder = await import("../historyRecorder");

      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "テスト",
        changes: { "settings.proliferator.type": "mk1" },
        version: HISTORY_VERSION,
      };

      // Check flag is false before
      expect(historyRecorder.isRestoring()).toBe(false);

      restoreStateFromHistory(entry, false);

      // Should be reset after restoration
      expect(historyRecorder.isRestoring()).toBe(false);
    });
  });

  describe("restoreStateFromHistory - calculation result", () => {
    it("should clear calculation result when settings change", () => {
      // Set a calculation result first
      useRecipeSelectionStore.setState({
        calculationResult: {
          rootNode: {
            nodeId: "root",
            itemName: "Test",
            itemId: 1,
            targetCount: 60,
            productionRate: 60,
            consumptionRate: 0,
            netRate: 60,
            machineCount: 1,
            machineId: "mk1",
            powerConsumption: 100,
            children: [],
          },
          totalPower: { total: 100, idle: 0, work: 100 },
          totalMachines: 1,
          totalBeltSaturation: 0,
          rawMaterials: new Map(),
          bottlenecks: [],
        },
      });

      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "設定変更",
        changes: { "settings.proliferator.type": "mk1" },
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const calculationResult = useRecipeSelectionStore.getState().calculationResult;
      expect(calculationResult).toBeNull();
    });
  });

  describe("restoreStateFromHistory - customTemplates", () => {
    beforeEach(() => {
      // Clear custom templates before each test
      useSettingsStore.setState({ customTemplates: {} });
    });

    it("should restore customTemplates when template is created", () => {
      const templateId = "test-template-id";
      const templateSettings = {
        proliferator: { ...PROLIFERATOR_DATA.mk3, mode: "production" as const },
        machineRank: {
          Smelt: "arc",
          Assemble: "mk1",
          Chemical: "standard",
          Research: "standard",
          Refine: "standard",
          Particle: "standard",
        },
        conveyorBelt: { tier: "mk3", speed: 30, stackCount: 1 },
        sorter: { tier: "mk3", powerConsumption: 72 },
        alternativeRecipes: new Map([[1001, 2001]]),
        miningSpeedResearch: 150,
        proliferatorMultiplier: { production: 1, speed: 1 },
        photonGeneration: {
          useGravitonLens: false,
          rayTransmissionEfficiency: 0,
          gravitonLensProliferator: { ...PROLIFERATOR_DATA.none, mode: "speed" as const },
        },
      };

      const template = {
        meta: {
          id: templateId,
          name: "Test Template",
          note: "Test Note",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        settings: serializeSettings(templateSettings), // Serialize settings (Map → Array)
      };

      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "カスタムテンプレート作成",
        changes: {
          customTemplates: {
            [templateId]: template,
          },
        },
        previousChanges: {
          customTemplates: {},
        },
        version: HISTORY_VERSION,
      };

      restoreStateFromHistory(entry, false);

      const customTemplates = useSettingsStore.getState().customTemplates;
      expect(Object.keys(customTemplates).length).toBe(1);
      expect(customTemplates[templateId]).toBeDefined();
      expect(customTemplates[templateId].meta.name).toBe("Test Template");
      expect(customTemplates[templateId].settings.proliferator.type).toBe("mk3");
      expect(customTemplates[templateId].settings.alternativeRecipes.get(1001)).toBe(2001);
    });

    it("should restore customTemplates when template is deleted", () => {
      const templateId = "test-template-id";
      const templateSettings = {
        proliferator: { ...PROLIFERATOR_DATA.mk3, mode: "production" as const },
        machineRank: {
          Smelt: "arc",
          Assemble: "mk1",
          Chemical: "standard",
          Research: "standard",
          Refine: "standard",
          Particle: "standard",
        },
        conveyorBelt: { tier: "mk3", speed: 30, stackCount: 1 },
        sorter: { tier: "mk3", powerConsumption: 72 },
        alternativeRecipes: new Map([[1001, 2001]]),
        miningSpeedResearch: 150,
        proliferatorMultiplier: { production: 1, speed: 1 },
        photonGeneration: {
          useGravitonLens: false,
          rayTransmissionEfficiency: 0,
          gravitonLensProliferator: { ...PROLIFERATOR_DATA.none, mode: "speed" as const },
        },
      };

      const template = {
        meta: {
          id: templateId,
          name: "Test Template",
          note: "Test Note",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        settings: serializeSettings(templateSettings), // Serialize settings (Map → Array)
      };

      // First create template
      useSettingsStore.setState({
        customTemplates: { [templateId]: { meta: template.meta, settings: templateSettings } },
      });

      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "カスタムテンプレート削除",
        changes: {
          customTemplates: {},
        },
        previousChanges: {
          customTemplates: {
            [templateId]: template,
          },
        },
        version: HISTORY_VERSION,
      };

      // Undo deletion (restore template)
      restoreStateFromHistory(entry, true);

      const customTemplates = useSettingsStore.getState().customTemplates;
      expect(Object.keys(customTemplates).length).toBe(1);
      expect(customTemplates[templateId]).toBeDefined();
      expect(customTemplates[templateId].meta.name).toBe("Test Template");
      expect(customTemplates[templateId].settings.proliferator.type).toBe("mk3");
      expect(customTemplates[templateId].settings.alternativeRecipes.get(1001)).toBe(2001);
    });

    it("should restore selectedTemplate when custom template is deleted", () => {
      const templateId = "test-template-id";
      const template = {
        meta: {
          id: templateId,
          name: "Test Template",
          note: "Test Note",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        settings: {
          proliferator: { ...PROLIFERATOR_DATA.mk3, mode: "production" as const },
          machineRank: {
            Smelt: "arc",
            Assemble: "mk1",
            Chemical: "standard",
            Research: "standard",
            Refine: "standard",
            Particle: "standard",
          },
          conveyorBelt: { tier: "mk3", speed: 30, stackCount: 1 },
          sorter: { tier: "mk3", powerConsumption: 72 },
          alternativeRecipes: new Map(),
          miningSpeedResearch: 100,
          proliferatorMultiplier: { production: 1, speed: 1 },
          photonGeneration: {
            useGravitonLens: false,
            rayTransmissionEfficiency: 0,
            gravitonLensProliferator: { ...PROLIFERATOR_DATA.none, mode: "speed" as const },
          },
        },
      };

      // First create template and select it
      useSettingsStore.setState({
        customTemplates: { [templateId]: template },
        selectedTemplate: `custom:${templateId}` as import("../../types").CustomTemplateId,
      });

      const entry: HistoryEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: "settings",
        description: "カスタムテンプレート削除",
        changes: {
          customTemplates: {},
          selectedTemplate: null,
        },
        previousChanges: {
          customTemplates: {
            [templateId]: template,
          },
          selectedTemplate: `custom:${templateId}`,
        },
        version: HISTORY_VERSION,
      };

      // Undo deletion (restore template and selectedTemplate)
      restoreStateFromHistory(entry, true);

      const customTemplates = useSettingsStore.getState().customTemplates;
      const selectedTemplate = useSettingsStore.getState().selectedTemplate;
      expect(Object.keys(customTemplates).length).toBe(1);
      expect(customTemplates[templateId]).toBeDefined();
      expect(selectedTemplate).toBe(`custom:${templateId}`);
    });
  });
});
