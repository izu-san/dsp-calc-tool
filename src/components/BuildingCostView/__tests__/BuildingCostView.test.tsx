import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDataPath } from '../../../utils/paths';
import { render, screen } from '@testing-library/react';
import { BuildingCostView } from '../index';
import type { CalculationResult } from '../../../types/calculation';
import type { BuildingCost } from '../../../lib/buildingCost';

// Mock dependencies
vi.mock('../../../lib/miningCalculation');
vi.mock('../../../stores/settingsStore');
vi.mock('../../MiningCalculator', () => ({
  MiningCalculator: () => <div data-testid="mining-calculator">Mocked MiningCalculator</div>,
}));
vi.mock('../../../utils/format', () => ({
  formatNumber: (val: number) => val.toLocaleString('en-US'),
  formatBuildingCount: (val: number) => Math.ceil(val).toString(),
}));

// Mock useGameDataStore
const mockUseGameDataStore = vi.fn();
vi.mock('../../../stores/gameDataStore', () => ({
  useGameDataStore: () => mockUseGameDataStore(),
}));

// Mock calculateBuildingCost
const mockCalculateBuildingCost = vi.fn();
vi.mock('../../../lib/buildingCost', () => ({
  calculateBuildingCost: (...args: unknown[]) => mockCalculateBuildingCost(...args),
}));

describe('BuildingCostView', () => {
  const mockCalculationResult: CalculationResult = {
    rootNode: {} as any,
    rawMaterials: new Map(),
    totalPower: {
      machines: 1000,
      sorters: 100,
      total: 1100,
    },
    totalMachines: 10,
  };

  const mockBuildingCost: BuildingCost = {
    machines: [
      { machineId: 2303, count: 10 },
    ],
    sorters: 30,
    belts: 20,
  };

  const mockGameData = {
    items: new Map(),
    recipes: new Map(),
    machines: new Map([
      [
        2303,
        {
          id: 2303,
          name: 'Assembling Machine Mk.I',
          description: '',
          type: 'assembler',
          gridPos: 0,
          speed: 0.75,
          prefabId: 2303,
            iconPath: getDataPath('data/Machines/Icons/2303.png'),
        },
      ],
      [
        2304,
        {
          id: 2304,
          name: 'Assembling Machine Mk.II',
          description: '',
          type: 'assembler',
          gridPos: 0,
          speed: 1.0,
          prefabId: 2304,
            iconPath: getDataPath('data/Machines/Icons/2304.png'),
        },
      ],
    ]),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGameDataStore.mockReturnValue({
      data: mockGameData,
    });
    mockCalculateBuildingCost.mockReturnValue(mockBuildingCost);
  });

  describe('Rendering - Empty State', () => {
    it('should render empty message when buildingCost is null', () => {
      mockCalculateBuildingCost.mockReturnValue(null);
      render(<BuildingCostView calculationResult={mockCalculationResult} />);
      expect(screen.getByText(/selectRecipeForBuildingReqs/i)).toBeInTheDocument();
    });
  });

  describe('Rendering - Valid Data', () => {
    it('should render header and machines section', () => {
      render(<BuildingCostView calculationResult={mockCalculationResult} />);

      expect(screen.getByText(/buildingCost/i)).toBeInTheDocument();
      
      // productionMachines appears multiple times (header + summary)
      const productionMachinesElements = screen.getAllByText(/productionMachines/i);
      expect(productionMachinesElements.length).toBeGreaterThan(0);
    });

    it('should render logistics section with sorters and belts', () => {
      render(<BuildingCostView calculationResult={mockCalculationResult} />);

      const logisticsElements = screen.getAllByText(/logistics/i);
      expect(logisticsElements.length).toBeGreaterThan(0);
      
      const sortersElements = screen.getAllByText(/sorters/i);
      expect(sortersElements.length).toBeGreaterThan(0);
      
      const conveyorBeltsElements = screen.getAllByText(/conveyorBelts/i);
      expect(conveyorBeltsElements.length).toBeGreaterThan(0);
    });

    it('should render summary section with totals', () => {
      render(<BuildingCostView calculationResult={mockCalculationResult} />);

      expect(screen.getByText(/totalBuildingRequirements/i)).toBeInTheDocument();
    });

    it('should render MiningCalculator child component', () => {
      render(<BuildingCostView calculationResult={mockCalculationResult} />);

      expect(screen.getByTestId('mining-calculator')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display machine names and counts from gameData', () => {
      render(<BuildingCostView calculationResult={mockCalculationResult} />);

      expect(screen.getByText('Assembling Machine Mk.I')).toBeInTheDocument();
      
      // formatNumber returns "10" with en-US locale
      expect(screen.getByText(/×10/)).toBeInTheDocument();
    });

    it('should display logistics counts (sorters and belts)', () => {
      render(<BuildingCostView calculationResult={mockCalculationResult} />);

      // Check for numeric values with formatNumber (30, 20)
      expect(screen.getByText(/×30/)).toBeInTheDocument();
      expect(screen.getByText(/×20/)).toBeInTheDocument();
    });

    it('should display summary totals with reduce sum', () => {
      render(<BuildingCostView calculationResult={mockCalculationResult} />);

      // Total machines should be sum of all machine counts
      expect(screen.getByText(/totalBuildingRequirements/i)).toBeInTheDocument();
      expect(screen.getByText(/10\s+units/i)).toBeInTheDocument(); // Total of 10 machines
    });

    it('should fallback to machineId when gameData getMachineName not available', () => {
      mockUseGameDataStore.mockReturnValue({ data: null });
      render(<BuildingCostView calculationResult={mockCalculationResult} />);

      // When gameData is null, should display "Machine {id}"
      expect(screen.getByText(/Machine 2303/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty machines array', () => {
      mockCalculateBuildingCost.mockReturnValue({
        machines: [],
        sorters: 30,
        belts: 20,
      });
      render(<BuildingCostView calculationResult={mockCalculationResult} />);

      // Should still render logistics section even with no machines
      const logisticsElements = screen.queryAllByText(/logistics/i);
      expect(logisticsElements.length).toBeGreaterThan(0);
    });

    it('should handle single machine', () => {
      mockCalculateBuildingCost.mockReturnValue({
        machines: [{ machineId: 2303, count: 1 }],
        sorters: 2,
        belts: 1,
      });
      render(<BuildingCostView calculationResult={mockCalculationResult} />);

      expect(screen.getByText('Assembling Machine Mk.I')).toBeInTheDocument();
      
      // ×1 appears multiple times (machines + belts), use getAllByText
      const countElements = screen.getAllByText(/×1/);
      expect(countElements.length).toBeGreaterThan(0);
    });

    it('should handle multiple machines with different types', () => {
      mockCalculateBuildingCost.mockReturnValue({
        machines: [
          { machineId: 2303, count: 10 },
          { machineId: 2304, count: 5 },
        ],
        sorters: 45,
        belts: 30,
      });
      render(<BuildingCostView calculationResult={mockCalculationResult} />);

      expect(screen.getByText('Assembling Machine Mk.I')).toBeInTheDocument();
      expect(screen.getByText('Assembling Machine Mk.II')).toBeInTheDocument();
    });
  });

  describe('i18n & Formatting', () => {
    it('should use all required translation keys', () => {
      render(<BuildingCostView calculationResult={mockCalculationResult} />);

      // Check that translation keys are used (they appear as-is in test environment)
      expect(screen.getByText(/buildingCost/i)).toBeInTheDocument();
      
      const productionMachinesElements = screen.getAllByText(/productionMachines/i);
      expect(productionMachinesElements.length).toBeGreaterThan(0);
      
      const logisticsElements = screen.getAllByText(/logistics/i);
      expect(logisticsElements.length).toBeGreaterThan(0);
      
      expect(screen.getByText(/totalBuildingRequirements/i)).toBeInTheDocument();
    });

    it('should format numbers correctly with formatBuildingCount', () => {
      mockCalculateBuildingCost.mockReturnValue({
        machines: [{ machineId: 2303, count: 1234 }],
        sorters: 5678,
        belts: 9012,
      });
      render(<BuildingCostView calculationResult={mockCalculationResult} />);

      // formatBuildingCount should display integers without commas
      expect(screen.getByText(/×1234/)).toBeInTheDocument();
      expect(screen.getByText(/×5678/)).toBeInTheDocument();
      expect(screen.getByText(/×9012/)).toBeInTheDocument();
    });
  });
});
