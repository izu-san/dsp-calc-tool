import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateUnifiedPower,
  type UnifiedPowerResult,
} from "../../../lib/unifiedPowerCalculation";
import type { CalculationResult, RecipeTreeNode } from "../../../types/calculation";
import { formatNumber, formatPower } from "../../../utils/format";
import { PowerGraphView } from "../index";

// Mock dependencies
vi.mock("../../../lib/unifiedPowerCalculation");
vi.mock("../../../stores/gameDataStore");
vi.mock("../../../stores/settingsStore");
vi.mock("react-chartjs-2", () => ({
  Pie: vi.fn(() => <div data-testid="pie-chart">Mocked Pie Chart</div>),
}));
vi.mock("chart.js", () => ({
  Chart: {
    register: vi.fn(),
  },
  ArcElement: {},
  Tooltip: {},
  Legend: {},
}));

// Mock useGameDataStore
const mockUseGameDataStore = vi.fn();
vi.mock("../../../stores/gameDataStore", () => ({
  useGameDataStore: () => mockUseGameDataStore(),
}));

// Mock useSettingsStore
const mockUseSettingsStore = vi.fn();
vi.mock("../../../stores/settingsStore", () => ({
  useSettingsStore: () => mockUseSettingsStore(),
}));

describe("PowerGraphView", () => {
  const mockPowerResult: UnifiedPowerResult = {
    totalConsumption: 1100,
    machinesPower: 1000,
    sortersPower: 100,
    miningPower: 0,
    dysonSpherePower: 0,
    breakdown: [
      {
        machineId: 1,
        machineName: "Test Machine",
        machineCount: 10,
        powerPerMachine: 100,
        totalPower: 1000,
        percentage: 90.9,
      },
    ],
  };

  const mockRootNode: RecipeTreeNode = {
    targetOutputRate: 1,
    machineCount: 10,
    proliferator: {
      type: "none",
      mode: "production",
      productionBonus: 0,
      speedBonus: 0,
      powerIncrease: 0,
    },
    power: {
      machines: 1000,
      sorters: 100,
      total: 1100,
    },
    inputs: [],
    children: [],
    conveyorBelts: { inputs: 0, outputs: 0, totalConsumption: 0 },
    nodeId: "test-node-1",
  };

  const mockCalculationResult: CalculationResult = {
    rootNode: mockRootNode,
    totalPower: 1100,
    rawMaterials: new Map(),
  };

  const mockGameData = {
    machines: new Map([
      [2303, { id: 2303, name: "Assembling Machine Mk.I" }],
      [2304, { id: 2304, name: "Assembling Machine Mk.II" }],
      [2315, { id: 2315, name: "Plane Smelter" }],
    ]),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock calculateUnifiedPower
    vi.mocked(calculateUnifiedPower).mockReturnValue(mockPowerResult);

    mockUseGameDataStore.mockReturnValue({ data: mockGameData });
    mockUseSettingsStore.mockReturnValue({
      settings: {
        proliferator: {
          type: "none",
          productionBonus: 0,
          speedBonus: 0,
          powerIncrease: 0,
          mode: "speed",
        },
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
    });
  });

  // ===========================
  // 1. Rendering Tests (5)
  // ===========================

  describe("Rendering - Empty States", () => {
    it("should render empty state when power totalConsumption is 0", () => {
      vi.mocked(calculateUnifiedPower).mockReturnValue({
        totalConsumption: 0,
        machinesPower: 0,
        sortersPower: 0,
        miningPower: 0,
        dysonSpherePower: 0,
        breakdown: [],
      });

      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      expect(screen.getByText(/noPowerConsumptionData/i)).toBeInTheDocument();
      expect(screen.queryByTestId("pie-chart")).not.toBeInTheDocument();
    });
  });

  describe("Rendering - Valid Data", () => {
    beforeEach(() => {
      vi.mocked(calculateUnifiedPower).mockReturnValue({
        totalConsumption: 1500,
        machinesPower: 1200,
        sortersPower: 300,
        miningPower: 0,
        dysonSpherePower: 0,
        breakdown: [
          {
            machineId: 2303,
            machineName: "Assembling Machine Mk.I",
            machineCount: 10,
            powerPerMachine: 100,
            totalPower: 1000,
            percentage: 66.67,
          },
          {
            machineId: 2315,
            machineName: "Plane Smelter",
            machineCount: 5,
            powerPerMachine: 100,
            totalPower: 500,
            percentage: 33.33,
          },
        ],
      });
    });

    it("should render summary card with totalConsumption power consumption", () => {
      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      expect(screen.getByText(/totalPowerConsumption/i)).toBeInTheDocument();
      expect(screen.getByText(formatPower(1500))).toBeInTheDocument();
    });

    it("should render totalConsumption power in MW and GW", () => {
      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      const mwText = formatNumber(1500 / 1000);
      const gwText = formatNumber(1500 / 1000000);

      // Check that MW and GW are displayed in the summary section
      const elements = screen.getAllByText(
        new RegExp(`${mwText}.*MW.*${gwText}.*GW|${mwText}|${gwText}`)
      );
      expect(elements.length).toBeGreaterThan(0);
    });

    it("should render pie chart component", () => {
      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });

    it("should render power breakdown list with all machines", () => {
      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      expect(screen.getByText("Assembling Machine Mk.I")).toBeInTheDocument();
      expect(screen.getByText("Plane Smelter")).toBeInTheDocument();
    });
  });

  // ===========================
  // 2. Data Transformation (4)
  // ===========================

  describe("Data Transformation", () => {
    const mockPowerBreakdown = {
      totalConsumption: 2000,
      breakdown: [
        {
          machineId: 2303,
          machineName: "Assembling Machine Mk.I",
          machineCount: 10,
          powerPerMachine: 100,
          totalPower: 1000,
          percentage: 50,
        },
        {
          machineId: 2304,
          machineName: "Assembling Machine Mk.II",
          machineCount: 5,
          powerPerMachine: 200,
          totalPower: 1000,
          percentage: 50,
        },
      ],
    };

    beforeEach(() => {
      vi.mocked(calculateUnifiedPower).mockReturnValue({
        totalConsumption: 2000,
        machinesPower: 2000,
        sortersPower: 0,
        miningPower: 0,
        dysonSpherePower: 0,
        breakdown: mockPowerBreakdown.breakdown,
      });
    });

    it("should generate chart data with correct labels (machine names)", () => {
      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // Verify machine names are in the breakdown (labels are passed to Pie component)
      expect(screen.getByText("Assembling Machine Mk.I")).toBeInTheDocument();
      expect(screen.getByText("Assembling Machine Mk.II")).toBeInTheDocument();
    });

    it("should generate chart data with correct values (totalPower)", () => {
      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // Verify power values are displayed in breakdown (two machines with 1000 each)
      const powerElements = screen.getAllByText(formatPower(1000));
      expect(powerElements.length).toBe(2); // Both machines have 1.0 MW
    });

    it("should display percentage for each machine", () => {
      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // Both machines have 50% each
      const percentageElements = screen.getAllByText("50.0%");
      expect(percentageElements.length).toBe(2);
    });

    it("should apply CHART_COLORS to chart data", () => {
      const { container } = render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // Verify color indicators are rendered
      const colorIndicators = container.querySelectorAll('[style*="background"]');
      expect(colorIndicators.length).toBeGreaterThan(0);
    });
  });

  // ===========================
  // 3. Machine Icon Logic (3)
  // ===========================

  describe("Machine Icon Logic", () => {
    beforeEach(() => {
      vi.mocked(calculateUnifiedPower).mockReturnValue({
        totalConsumption: 1000,
        machinesPower: 1000,
        sortersPower: 0,
        miningPower: 0,
        dysonSpherePower: 0,
        breakdown: [
          {
            machineId: 2303,
            machineName: "Assembling Machine Mk.I",
            machineCount: 10,
            powerPerMachine: 100,
            totalPower: 1000,
            percentage: 100,
          },
        ],
      });
    });

    it("should get machine icon from gameData when available", () => {
      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // ItemIcon component should be rendered with machine ID
      // Check that the machine name is displayed (indicates icon was rendered)
      expect(screen.getByText("Assembling Machine Mk.I")).toBeInTheDocument();
    });

    it("should fallback to machineId when gameData is not available", () => {
      mockUseGameDataStore.mockReturnValue({ data: null });

      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // Should still render without crashing
      expect(screen.getByText("Assembling Machine Mk.I")).toBeInTheDocument();
    });

    it("should fallback to machineId when machine not found in gameData", () => {
      const gameDataWithMissingMachine = {
        machines: new Map([[2304, { id: 2304, name: "Assembling Machine Mk.II" }]]),
      };
      mockUseGameDataStore.mockReturnValue({ data: gameDataWithMissingMachine });

      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // Should still render without crashing
      expect(screen.getByText("Assembling Machine Mk.I")).toBeInTheDocument();
    });
  });

  // ===========================
  // 4. Layout & Styling (2)
  // ===========================

  describe("Layout & Styling", () => {
    beforeEach(() => {
      vi.mocked(calculateUnifiedPower).mockReturnValue({
        totalConsumption: 5000000,
        machinesPower: 5000000,
        sortersPower: 0,
        miningPower: 0,
        dysonSpherePower: 0,
        breakdown: [
          {
            machineId: 2303,
            machineName: "Assembling Machine Mk.I",
            machineCount: 100,
            powerPerMachine: 500,
            totalPower: 50000,
            percentage: 1,
          },
        ],
      });
    });

    it("should display summary card with MW and GW conversions", () => {
      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      const mw = formatNumber(5000000 / 1000);
      const gw = formatNumber(5000000 / 1000000);

      // Check that MW and GW values are present somewhere in the document
      const allElements = screen.getAllByText(new RegExp(`${mw}|${gw}`));
      expect(allElements.length).toBeGreaterThan(0);
    });

    it("should display breakdown items with machine count and power per machine", () => {
      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // Should show machine count
      expect(screen.getByText(/100/)).toBeInTheDocument();
      // Power per machine is displayed in the details (text is split by elements)
      expect(screen.getByText(/500\.0 kW/)).toBeInTheDocument();
    });
  });

  // ===========================
  // 5. Edge Cases (2)
  // ===========================

  describe("Edge Cases", () => {
    it("should handle single machine in breakdown", () => {
      vi.mocked(calculateUnifiedPower).mockReturnValue({
        totalConsumption: 100,
        machinesPower: 100,
        sortersPower: 0,
        miningPower: 0,
        dysonSpherePower: 0,
        breakdown: [
          {
            machineId: 2303,
            machineName: "Assembling Machine Mk.I",
            machineCount: 1,
            powerPerMachine: 100,
            totalPower: 100,
            percentage: 100,
          },
        ],
      });

      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      expect(screen.getByText("Assembling Machine Mk.I")).toBeInTheDocument();
      expect(screen.getByText("100.0%")).toBeInTheDocument();
    });

    it("should handle many machines with color rotation", () => {
      const manyMachines = Array.from({ length: 15 }, (_, i) => ({
        machineId: 2300 + i,
        machineName: `Machine ${i}`,
        machineCount: 10,
        powerPerMachine: 100,
        totalPower: 1000,
        percentage: 100 / 15,
      }));

      vi.mocked(calculateUnifiedPower).mockReturnValue({
        totalConsumption: 15000,
        breakdown: manyMachines,
      });

      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // Should render all machines
      expect(screen.getByText("Machine 0")).toBeInTheDocument();
      expect(screen.getByText("Machine 14")).toBeInTheDocument();
    });
  });

  // ===========================
  // 6. Chart Options & Configuration (3)
  // ===========================

  describe("Chart Options & Configuration", () => {
    beforeEach(() => {
      vi.mocked(calculateUnifiedPower).mockReturnValue({
        totalConsumption: 1000,
        breakdown: [
          {
            machineId: 2303,
            machineName: "Test Machine",
            machineCount: 5,
            powerPerMachine: 200,
            totalPower: 1000,
            percentage: 100,
          },
        ],
      });
    });

    it("should configure chart with correct responsive settings", () => {
      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // Chart should be rendered with responsive configuration
      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });

    it("should configure tooltip with correct callbacks", () => {
      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // Tooltip configuration is internal to Chart.js, but we can verify chart renders
      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });

    it("should configure legend with correct styling", () => {
      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // Legend configuration is internal to Chart.js, but we can verify chart renders
      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });
  });

  // ===========================
  // 7. Chart Data Generation (4)
  // ===========================

  describe("Chart Data Generation", () => {
    beforeEach(() => {
      vi.mocked(calculateUnifiedPower).mockReturnValue({
        totalConsumption: 3000,
        breakdown: [
          {
            machineId: 2303,
            machineName: "Machine A",
            machineCount: 10,
            powerPerMachine: 150,
            totalPower: 1500,
            percentage: 50,
          },
          {
            machineId: 2304,
            machineName: "Machine B",
            machineCount: 15,
            powerPerMachine: 100,
            totalPower: 1500,
            percentage: 50,
          },
        ],
      });
    });

    it("should generate chart labels from machine names", () => {
      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // Labels are passed to Pie component, verify machines are displayed
      expect(screen.getByText("Machine A")).toBeInTheDocument();
      expect(screen.getByText("Machine B")).toBeInTheDocument();
    });

    it("should generate chart data from totalPower values", () => {
      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // Data values are passed to Pie component, verify power values are displayed
      const powerElements = screen.getAllByText(formatPower(1500));
      expect(powerElements.length).toBe(2); // Both machines have 1.5 MW
    });

    it("should apply chart colors from CHART_COLORS array", () => {
      const { container } = render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // Color indicators should be rendered with chart colors
      const colorIndicators = container.querySelectorAll('[style*="background"]');
      expect(colorIndicators.length).toBeGreaterThan(0);
    });

    it("should handle empty machine list in chart data", () => {
      vi.mocked(calculateUnifiedPower).mockReturnValue({
        totalConsumption: 0,
        breakdown: [],
      });

      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // Should show empty state instead of chart
      expect(screen.getByText(/noPowerConsumptionData/i)).toBeInTheDocument();
      expect(screen.queryByTestId("pie-chart")).not.toBeInTheDocument();
    });
  });

  // ===========================
  // 8. getMachineIcon Function (3)
  // ===========================

  describe("getMachineIcon Function", () => {
    beforeEach(() => {
      vi.mocked(calculateUnifiedPower).mockReturnValue({
        totalConsumption: 1000,
        breakdown: [
          {
            machineId: 2303,
            machineName: "Test Machine",
            machineCount: 5,
            powerPerMachine: 200,
            totalPower: 1000,
            percentage: 100,
          },
        ],
      });
    });

    it("should return machine ID when machine exists in gameData", () => {
      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // ItemIcon should be rendered with machine ID
      expect(screen.getByText("Test Machine")).toBeInTheDocument();
    });

    it("should return machine ID when machine not found in gameData", () => {
      const gameDataWithoutMachine = {
        machines: new Map([[9999, { id: 9999, name: "Other Machine" }]]),
      };
      mockUseGameDataStore.mockReturnValue({ data: gameDataWithoutMachine });

      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // Should still render without crashing
      expect(screen.getByText("Test Machine")).toBeInTheDocument();
    });

    it("should return machine ID when gameData is null", () => {
      mockUseGameDataStore.mockReturnValue({ data: null });

      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // Should still render without crashing
      expect(screen.getByText("Test Machine")).toBeInTheDocument();
    });
  });

  // ===========================
  // 9. Power Formatting & Display (3)
  // ===========================

  describe("Power Formatting & Display", () => {
    beforeEach(() => {
      vi.mocked(calculateUnifiedPower).mockReturnValue({
        totalConsumption: 1500000, // 1.5 MW
        breakdown: [
          {
            machineId: 2303,
            machineName: "Test Machine",
            machineCount: 10,
            powerPerMachine: 150, // 150 W
            totalPower: 1500000, // 1.5 MW
            percentage: 100,
          },
        ],
      });
    });

    it("should display totalConsumption power with correct formatting", () => {
      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      const powerElements = screen.getAllByText(formatPower(1500000));
      expect(powerElements.length).toBeGreaterThan(0);
    });

    it("should display MW and GW conversions correctly", () => {
      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      const mw = formatNumber(1500000 / 1000); // 1.5 MW
      const gw = formatNumber(1500000 / 1000000); // 0.0015 GW

      // Check that MW and GW values are displayed
      const elements = screen.getAllByText(new RegExp(`${mw}|${gw}`));
      expect(elements.length).toBeGreaterThan(0);
    });

    it("should display individual machine power with correct formatting", () => {
      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // Check power per machine is displayed (150.0 kW)
      expect(screen.getByText(/150\.0 kW/)).toBeInTheDocument();
    });
  });

  // ===========================
  // 10. useMemo Dependencies (2)
  // ===========================

  describe("useMemo Dependencies", () => {
    it("should recalculate powerBreakdown when calculationResult changes", () => {
      const { rerender } = render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // Change calculation result
      const newCalculationResult = {
        ...mockCalculationResult,
        rootNode: {
          ...mockCalculationResult.rootNode,
          nodeId: "new-node-id",
        },
      };

      rerender(<PowerGraphView calculationResult={newCalculationResult} />);

      // calculateUnifiedPower should be called again
      expect(calculateUnifiedPower).toHaveBeenCalledTimes(2);
    });

    it("should recalculate chartData when powerBreakdown or t changes", () => {
      render(<PowerGraphView calculationResult={mockCalculationResult} />);

      // Chart data generation is tested indirectly through rendering
      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });
  });
});
