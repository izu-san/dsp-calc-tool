/**
 * PowerGenerationView コンポーネントのテスト
 *
 * 注: このコンポーネントは複雑なストア依存と計算ロジックを持つため、
 * 主要なパスとエッジケースのみをテストします。
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PowerGenerationView } from "../index";
import type { CalculationResult } from "@/types";

// モック
vi.mock("@/stores/settingsStore", () => ({
  useSettingsStore: vi.fn(selector => {
    const store = {
      powerGenerationTemplate: "default",
      manualPowerGenerator: null,
      manualPowerFuel: null,
      powerFuelProliferator: {
        type: "none",
        mode: "production" as const,
        productionBonus: 0,
        speedBonus: 0,
        powerIncrease: 0,
      },
      setPowerGenerationTemplate: vi.fn(),
      setManualPowerGenerator: vi.fn(),
      setManualPowerFuel: vi.fn(),
      setPowerFuelProliferator: vi.fn(),
    };
    return selector ? selector(store) : store;
  }),
}));

vi.mock("@/stores/gameDataStore", () => ({
  useGameDataStore: vi.fn(selector => {
    const store = {
      data: {
        machines: new Map([
          [2203, { name: "風力タービン" }],
          [2204, { name: "火力発電所" }],
          [2213, { name: "地熱発電所" }],
          [2205, { name: "ソーラーパネル" }],
          [2211, { name: "ミニ核融合発電所" }],
          [2210, { name: "人工恒星" }],
        ]),
        items: new Map([
          [1006, { name: "石炭" }],
          [1007, { name: "原油" }],
          [1114, { name: "精製油" }],
          [1109, { name: "高エネルギーグラファイト" }],
          [1120, { name: "水素" }],
          [1128, { name: "燃焼ユニット" }],
          [1129, { name: "爆発ユニット" }],
          [1801, { name: "水素燃料棒" }],
          [1130, { name: "結晶性爆発ユニット" }],
        ]),
      },
    };
    return selector ? selector(store) : store;
  }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "ja" },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
}));

vi.mock("@/components/ItemIcon", () => ({
  ItemIcon: ({ itemId }: { itemId: number }) => (
    <div data-testid={`item-icon-${itemId}`}>Icon {itemId}</div>
  ),
}));

vi.mock("@/lib/powerGenerationCalculation", () => ({
  calculatePowerGeneration: vi.fn(() => ({
    requiredPower: 1100,
    generators: [],
    totalGenerators: 0,
    totalFuelConsumption: new Map(),
  })),
}));

describe("PowerGenerationView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("電力が不要な場合", () => {
    it("totalPowerが存在しない場合はメッセージを表示", () => {
      const mockResult: CalculationResult = {
        rootNode: {
          recipe: null,
          machine: null,
          machineCount: 0,
          power: { machines: 0, sorters: 0, dysonSphere: 0 },
          children: [],
        },
        statistics: {
          totalMachines: 0,
          totalPower: 0,
          itemStatistics: new Map(),
        },
        // totalPowerがない
      };

      render(<PowerGenerationView calculationResult={mockResult} />);

      expect(screen.getByText("powerGeneration.noPowerRequired")).toBeInTheDocument();
    });

    it("totalPowerが0の場合はメッセージを表示", () => {
      const mockResult: CalculationResult = {
        rootNode: {
          recipe: null,
          machine: null,
          machineCount: 0,
          power: { machines: 0, sorters: 0, dysonSphere: 0 },
          children: [],
        },
        statistics: {
          totalMachines: 0,
          totalPower: 0,
          itemStatistics: new Map(),
        },
        totalPower: {
          machines: 0,
          sorters: 0,
          dysonSphere: 0,
        },
      };

      render(<PowerGenerationView calculationResult={mockResult} />);

      expect(screen.getByText("powerGeneration.noPowerRequired")).toBeInTheDocument();
    });
  });

  describe("電力が必要な場合", () => {
    it("テンプレート選択UIが表示される", () => {
      const mockResult: CalculationResult = {
        rootNode: {
          recipe: null,
          machine: null,
          machineCount: 0,
          power: { machines: 1000, sorters: 100, dysonSphere: 0 },
          children: [],
        },
        statistics: {
          totalMachines: 1,
          totalPower: 1100,
          itemStatistics: new Map(),
        },
        totalPower: {
          machines: 1000,
          sorters: 100,
          dysonSphere: 0,
        },
      };

      render(<PowerGenerationView calculationResult={mockResult} />);

      // テンプレート選択セクションが表示される
      expect(screen.getByText("powerGeneration.templateLabel")).toBeInTheDocument();
    });

    it("手動選択UIが表示される", () => {
      const mockResult: CalculationResult = {
        rootNode: {
          recipe: null,
          machine: null,
          machineCount: 0,
          power: { machines: 1000, sorters: 100, dysonSphere: 0 },
          children: [],
        },
        statistics: {
          totalMachines: 1,
          totalPower: 1100,
          itemStatistics: new Map(),
        },
        totalPower: {
          machines: 1000,
          sorters: 100,
          dysonSphere: 0,
        },
      };

      render(<PowerGenerationView calculationResult={mockResult} />);

      // 手動選択セクションが表示される
      expect(screen.getByText("powerGeneration.manualSelection")).toBeInTheDocument();
      expect(screen.getByText("powerGeneration.generatorLabel")).toBeInTheDocument();
    });

    it("必要電力が表示される", () => {
      const mockResult: CalculationResult = {
        rootNode: {
          recipe: null,
          machine: null,
          machineCount: 0,
          power: { machines: 1000, sorters: 100, dysonSphere: 0 },
          children: [],
        },
        statistics: {
          totalMachines: 1,
          totalPower: 1100,
          itemStatistics: new Map(),
        },
        totalPower: {
          machines: 1000,
          sorters: 100,
          dysonSphere: 0,
        },
      };

      render(<PowerGenerationView calculationResult={mockResult} />);

      // 必要電力セクションが表示される
      expect(screen.getByText("powerGeneration.requiredPower")).toBeInTheDocument();
      expect(screen.getByText("1.1 MW")).toBeInTheDocument(); // 1100kW = 1.1MW
    });

    it("サマリーが表示される", () => {
      const mockResult: CalculationResult = {
        rootNode: {
          recipe: null,
          machine: null,
          machineCount: 0,
          power: { machines: 1000, sorters: 100, dysonSphere: 0 },
          children: [],
        },
        statistics: {
          totalMachines: 1,
          totalPower: 1100,
          itemStatistics: new Map(),
        },
        totalPower: {
          machines: 1000,
          sorters: 100,
          dysonSphere: 0,
        },
      };

      render(<PowerGenerationView calculationResult={mockResult} />);

      // サマリーセクションが表示される
      expect(screen.getByText("powerGeneration.summary")).toBeInTheDocument();
    });
  });

  describe("Dyson Sphere電力の除外", () => {
    it("Dyson Sphere電力は必要電力に含まれない", () => {
      const mockResult: CalculationResult = {
        rootNode: {
          recipe: null,
          machine: null,
          machineCount: 0,
          power: { machines: 1000, sorters: 100, dysonSphere: 500 },
          children: [],
        },
        statistics: {
          totalMachines: 1,
          totalPower: 1100, // dysonSphere除外
          itemStatistics: new Map(),
        },
        totalPower: {
          machines: 1000,
          sorters: 100,
          dysonSphere: 500, // この値は除外される
        },
      };

      render(<PowerGenerationView calculationResult={mockResult} />);

      // 必要電力は machines + sorters のみ
      expect(screen.getByText("1.1 MW")).toBeInTheDocument(); // 1100kW = 1.1MW
    });
  });

  describe("Proliferator Settings UI", () => {
    it("should display proliferator settings section", () => {
      const mockResult: CalculationResult = {
        rootNode: {
          recipe: null,
          machine: null,
          machineCount: 0,
          power: { machines: 1000, sorters: 100, dysonSphere: 0 },
          children: [],
        },
        statistics: {
          totalMachines: 1,
          totalPower: 1100,
          itemStatistics: new Map(),
        },
        totalPower: {
          machines: 1000,
          sorters: 100,
          dysonSphere: 0,
        },
      };

      render(<PowerGenerationView calculationResult={mockResult} />);

      // 増産剤設定セクションが表示される
      expect(screen.getByText("powerGeneration.proliferatorSettings")).toBeInTheDocument();
    });

    it("should display proliferator type label", () => {
      const mockResult: CalculationResult = {
        rootNode: {
          recipe: null,
          machine: null,
          machineCount: 0,
          power: { machines: 1000, sorters: 100, dysonSphere: 0 },
          children: [],
        },
        statistics: {
          totalMachines: 1,
          totalPower: 1100,
          itemStatistics: new Map(),
        },
        totalPower: {
          machines: 1000,
          sorters: 100,
          dysonSphere: 0,
        },
      };

      render(<PowerGenerationView calculationResult={mockResult} />);

      // 増産剤タイプラベルが表示される
      expect(screen.getByText("proliferatorType")).toBeInTheDocument();
    });

    it("should display all proliferator type buttons", () => {
      const mockResult: CalculationResult = {
        rootNode: {
          recipe: null,
          machine: null,
          machineCount: 0,
          power: { machines: 1000, sorters: 100, dysonSphere: 0 },
          children: [],
        },
        statistics: {
          totalMachines: 1,
          totalPower: 1100,
          itemStatistics: new Map(),
        },
        totalPower: {
          machines: 1000,
          sorters: 100,
          dysonSphere: 0,
        },
      };

      render(<PowerGenerationView calculationResult={mockResult} />);

      // 全ての増産剤タイプのボタンが表示される
      expect(screen.getByText("none")).toBeInTheDocument();
      expect(screen.getByText("proliferatorMK1")).toBeInTheDocument();
      expect(screen.getByText("proliferatorMK2")).toBeInTheDocument();
      expect(screen.getByText("proliferatorMK3")).toBeInTheDocument();
    });

    it("should display proliferator icons for non-none types", () => {
      const mockResult: CalculationResult = {
        rootNode: {
          recipe: null,
          machine: null,
          machineCount: 0,
          power: { machines: 1000, sorters: 100, dysonSphere: 0 },
          children: [],
        },
        statistics: {
          totalMachines: 1,
          totalPower: 1100,
          itemStatistics: new Map(),
        },
        totalPower: {
          machines: 1000,
          sorters: 100,
          dysonSphere: 0,
        },
      };

      render(<PowerGenerationView calculationResult={mockResult} />);

      // 増産剤のアイコンが表示される（none以外）
      expect(screen.getByTestId("item-icon-1141")).toBeInTheDocument(); // Mk.I
      expect(screen.getByTestId("item-icon-1142")).toBeInTheDocument(); // Mk.II
      expect(screen.getByTestId("item-icon-1143")).toBeInTheDocument(); // Mk.III
    });
  });

  describe("Proliferator Effect Display", () => {
    it("should not display effect description when proliferator is none", () => {
      const mockResult: CalculationResult = {
        rootNode: {
          recipe: null,
          machine: null,
          machineCount: 0,
          power: { machines: 1000, sorters: 100, dysonSphere: 0 },
          children: [],
        },
        statistics: {
          totalMachines: 1,
          totalPower: 1100,
          itemStatistics: new Map(),
        },
        totalPower: {
          machines: 1000,
          sorters: 100,
          dysonSphere: 0,
        },
      };

      render(<PowerGenerationView calculationResult={mockResult} />);

      // 増産剤がnoneの場合は効果説明が表示されない
      expect(screen.queryByText("speedBonus")).not.toBeInTheDocument();
      expect(screen.queryByText("productionBonus")).not.toBeInTheDocument();
    });
  });
});
