import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatisticsView } from '../index';
import type { CalculationResult } from '../../../types/calculation';
import type { ProductionStatistics } from '../../../lib/statistics';

// Mock dependencies
vi.mock('../../../lib/statistics');
vi.mock('../../../utils/format', () => ({
  formatRate: (val: number) => `${val.toFixed(1)}/s`,
  formatPower: (val: number) => val > 1000 ? `${(val / 1000).toFixed(2)} MW` : `${val.toFixed(0)} kW`,
  formatBuildingCount: (val: number) => Math.ceil(val).toString(),
}));
vi.mock('../../ItemIcon', () => ({
  ItemIcon: ({ itemId }: { itemId: number }) => <div data-testid={`item-icon-${itemId}`} />,
}));
vi.mock('../../PowerGraphView', () => ({
  PowerGraphView: () => <div data-testid="power-graph-view">PowerGraphView</div>,
}));

// Mock useGameDataStore
const mockUseGameDataStore = vi.fn();
vi.mock('../../../stores/gameDataStore', () => ({
  useGameDataStore: () => mockUseGameDataStore(),
}));

// Import mocked functions
import * as statisticsLib from '../../../lib/statistics';

describe('StatisticsView', () => {
  const mockCalculationResult: CalculationResult = {
    rootNode: {} as any,
    rawMaterials: new Map(),
    totalPower: {
      machines: 1500,
      sorters: 100,
      total: 1600,
    },
    totalMachines: 25,
  };

  const mockStatistics: ProductionStatistics = {
    items: new Map([
      [1001, { itemId: 1001, totalProduction: 60, totalConsumption: 0, netProduction: 60, isRawMaterial: false }], // Final product
      [1002, { itemId: 1002, totalProduction: 0, totalConsumption: 30, netProduction: -30, isRawMaterial: true }], // Raw material
      [1003, { itemId: 1003, totalProduction: 45, totalConsumption: 45, netProduction: 0, isRawMaterial: false }], // Intermediate
    ]),
    totalMachines: 25.5,
    totalPower: 1600,
  };

  const mockGameData = {
    items: new Map([
      [1001, { id: 1001, name: 'Electromagnetic Matrix', description: '', gridPos: 0, iconPath: '/icons/1001.png' }],
      [1002, { id: 1002, name: 'Iron Ore', description: '', gridPos: 0, iconPath: '/icons/1002.png' }],
      [1003, { id: 1003, name: 'Iron Ingot', description: '', gridPos: 0, iconPath: '/icons/1003.png' }],
    ]),
    recipes: new Map(),
    machines: new Map(),
  };

  const mockRawMaterials = [
    { itemId: 1002, itemName: 'Iron Ore', totalProduction: 0, totalConsumption: 30, netProduction: -30 },
  ];

  const mockIntermediateProducts = [
    { itemId: 1003, itemName: 'Iron Ingot', totalProduction: 45, totalConsumption: 45, netProduction: 0 },
  ];

  const mockFinalProducts = [
    { itemId: 1001, itemName: 'Electromagnetic Matrix', totalProduction: 60, totalConsumption: 0, netProduction: 60 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGameDataStore.mockReturnValue({
      data: mockGameData,
    });
    (statisticsLib.calculateItemStatistics as any).mockReturnValue(mockStatistics);
    (statisticsLib.getRawMaterials as any).mockReturnValue(mockRawMaterials);
    (statisticsLib.getIntermediateProducts as any).mockReturnValue(mockIntermediateProducts);
    (statisticsLib.getFinalProducts as any).mockReturnValue(mockFinalProducts);
  });

  describe('Rendering - Empty State', () => {
    it('should render empty message when calculationResult is null', () => {
      render(<StatisticsView calculationResult={null} />);
      expect(screen.getByText(/productionStatistics/i)).toBeInTheDocument();
      expect(screen.getByText(/selectRecipeToSeeStats/i)).toBeInTheDocument();
    });

    it('should render empty message when statistics is null', () => {
      (statisticsLib.calculateItemStatistics as any).mockReturnValue(null);
      render(<StatisticsView calculationResult={mockCalculationResult} />);
      expect(screen.getByText(/selectRecipeToSeeStats/i)).toBeInTheDocument();
    });
  });

  describe('Rendering - Overview Section', () => {
    it('should render production overview with all stats', () => {
      render(<StatisticsView calculationResult={mockCalculationResult} />);

      expect(screen.getByText(/productionOverview/i)).toBeInTheDocument();
      expect(screen.getByText(/totalMachines/i)).toBeInTheDocument();
      expect(screen.getByText(/totalPower/i)).toBeInTheDocument();
      expect(screen.getByText(/itemsProduced/i)).toBeInTheDocument();
      
      // rawMaterials appears twice (overview card + section title)
      const rawMaterialsElements = screen.getAllByText(/rawMaterials/i);
      expect(rawMaterialsElements.length).toBeGreaterThan(0);
    });

    it('should display correct overview numbers', () => {
      render(<StatisticsView calculationResult={mockCalculationResult} />);

      // Total machines: 25.5 -> 26 (ceiling)
      expect(screen.getByText('26')).toBeInTheDocument();
      
      // Total power: 1600 kW -> 1.60 MW
      expect(screen.getByText(/1\.60 MW/i)).toBeInTheDocument();
      
      // Raw materials count: 1
      expect(screen.getByText('1')).toBeInTheDocument();
      
      // Items produced: 3
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should render power graph toggle button', () => {
      render(<StatisticsView calculationResult={mockCalculationResult} />);

      const toggleButton = screen.getByRole('button', { name: /show.*powerGraph/i });
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('PowerGraph Toggle', () => {
    it('should not show PowerGraphView initially', () => {
      render(<StatisticsView calculationResult={mockCalculationResult} />);

      expect(screen.queryByTestId('power-graph-view')).not.toBeInTheDocument();
    });

    it('should show PowerGraphView when toggle button is clicked', () => {
      render(<StatisticsView calculationResult={mockCalculationResult} />);

      const toggleButton = screen.getByRole('button', { name: /show.*powerGraph/i });
      fireEvent.click(toggleButton);

      expect(screen.getByTestId('power-graph-view')).toBeInTheDocument();
    });

    it('should hide PowerGraphView when toggle button is clicked again', () => {
      render(<StatisticsView calculationResult={mockCalculationResult} />);

      const toggleButton = screen.getByRole('button', { name: /show.*powerGraph/i });
      
      // Show
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('power-graph-view')).toBeInTheDocument();
      
      // Hide
      fireEvent.click(toggleButton);
      expect(screen.queryByTestId('power-graph-view')).not.toBeInTheDocument();
    });

    it('should update button text when toggled', () => {
      render(<StatisticsView calculationResult={mockCalculationResult} />);

      const toggleButton = screen.getByRole('button', { name: /show.*powerGraph/i });
      
      // Initially shows "show"
      expect(toggleButton.textContent).toMatch(/show/i);
      
      // After click, shows "hide"
      fireEvent.click(toggleButton);
      expect(toggleButton.textContent).toMatch(/hide/i);
    });
  });

  describe('Raw Materials Section', () => {
    it('should render raw materials table with correct data', () => {
      render(<StatisticsView calculationResult={mockCalculationResult} />);

      // Section title appears multiple times
      const rawMaterialsElements = screen.getAllByText(/rawMaterials/i);
      expect(rawMaterialsElements.length).toBeGreaterThan(0);
      
      expect(screen.getByText('Iron Ore')).toBeInTheDocument();
      expect(screen.getByText('30.0/s')).toBeInTheDocument(); // Required rate
    });

    it('should render item icons in raw materials', () => {
      render(<StatisticsView calculationResult={mockCalculationResult} />);

      expect(screen.getByTestId('item-icon-1002')).toBeInTheDocument();
    });

    it('should not render raw materials section when empty', () => {
      (statisticsLib.getRawMaterials as any).mockReturnValue([]);
      render(<StatisticsView calculationResult={mockCalculationResult} />);

      // Title should only appear once (in overview)
      const elements = screen.queryAllByText(/🔨/);
      expect(elements.length).toBe(0); // Section icon shouldn't appear
    });
  });

  describe('Intermediate Products Section', () => {
    it('should render intermediate products table with correct data', () => {
      render(<StatisticsView calculationResult={mockCalculationResult} />);

      expect(screen.getByText(/intermediateProducts/i)).toBeInTheDocument();
      expect(screen.getByText('Iron Ingot')).toBeInTheDocument();
      
      // "production" appears in multiple headers (intermediate + final), use getAllByText
      const productionElements = screen.getAllByText(/production/i);
      expect(productionElements.length).toBeGreaterThan(0);
      
      expect(screen.getByText(/consumption/i)).toBeInTheDocument();
      
      // "net" might appear in item names too, use getAllByText
      const netElements = screen.getAllByText(/^net$/i); // Exact match for "net" header
      expect(netElements.length).toBeGreaterThan(0);
    });

    it('should display production, consumption, and net values', () => {
      render(<StatisticsView calculationResult={mockCalculationResult} />);

      // Iron Ingot: production 45, consumption 45, net 0
      const rateElements = screen.getAllByText('45.0/s');
      expect(rateElements.length).toBe(2); // production + consumption
      
      const netElements = screen.getAllByText('0.0/s');
      expect(netElements.length).toBeGreaterThan(0); // net
    });

    it('should not render intermediate products section when empty', () => {
      (statisticsLib.getIntermediateProducts as any).mockReturnValue([]);
      render(<StatisticsView calculationResult={mockCalculationResult} />);

      const elements = screen.queryAllByText(/⚙️/);
      expect(elements.length).toBe(0); // Section icon shouldn't appear
    });
  });

  describe('Final Products Section', () => {
    it('should render final products table with correct data', () => {
      render(<StatisticsView calculationResult={mockCalculationResult} />);

      expect(screen.getByText(/finalProducts/i)).toBeInTheDocument();
      expect(screen.getByText('Electromagnetic Matrix')).toBeInTheDocument();
      expect(screen.getByText(/productionRate/i)).toBeInTheDocument();
      expect(screen.getByText('60.0/s')).toBeInTheDocument();
    });

    it('should render item icons in final products', () => {
      render(<StatisticsView calculationResult={mockCalculationResult} />);

      expect(screen.getByTestId('item-icon-1001')).toBeInTheDocument();
    });

    it('should not render final products section when empty', () => {
      (statisticsLib.getFinalProducts as any).mockReturnValue([]);
      render(<StatisticsView calculationResult={mockCalculationResult} />);

      const elements = screen.queryAllByText(/📦/);
      expect(elements.length).toBe(0); // Section icon shouldn't appear
    });
  });

  describe('Item Name Resolution', () => {
    it('should display item names from gameData', () => {
      render(<StatisticsView calculationResult={mockCalculationResult} />);

      expect(screen.getByText('Electromagnetic Matrix')).toBeInTheDocument();
      expect(screen.getByText('Iron Ore')).toBeInTheDocument();
      expect(screen.getByText('Iron Ingot')).toBeInTheDocument();
    });

    it('should fallback to "Item {id}" when gameData is null', () => {
      mockUseGameDataStore.mockReturnValue({ data: null });
      
      // Update mocks to return items with fallback names
      (statisticsLib.getRawMaterials as any).mockReturnValue([
        { itemId: 1002, itemName: 'Item 1002', totalProduction: 0, totalConsumption: 30, netProduction: -30 },
      ]);
      (statisticsLib.getIntermediateProducts as any).mockReturnValue([
        { itemId: 1003, itemName: 'Item 1003', totalProduction: 45, totalConsumption: 45, netProduction: 0 },
      ]);
      (statisticsLib.getFinalProducts as any).mockReturnValue([
        { itemId: 1001, itemName: 'Item 1001', totalProduction: 60, totalConsumption: 0, netProduction: 60 },
      ]);
      
      render(<StatisticsView calculationResult={mockCalculationResult} />);

      expect(screen.getByText(/Item 1001/)).toBeInTheDocument();
      expect(screen.getByText(/Item 1002/)).toBeInTheDocument();
      expect(screen.getByText(/Item 1003/)).toBeInTheDocument();
    });

    it('should fallback to "Item {id}" when item not found in gameData', () => {
      const limitedGameData = {
        ...mockGameData,
        items: new Map([[1001, mockGameData.items.get(1001)!]]), // Only one item
      };
      mockUseGameDataStore.mockReturnValue({ data: limitedGameData });
      
      // Update mocks to return items with fallback names for missing items
      (statisticsLib.getRawMaterials as any).mockReturnValue([
        { itemId: 1002, itemName: 'Item 1002', totalProduction: 0, totalConsumption: 30, netProduction: -30 },
      ]);
      (statisticsLib.getIntermediateProducts as any).mockReturnValue([
        { itemId: 1003, itemName: 'Item 1003', totalProduction: 45, totalConsumption: 45, netProduction: 0 },
      ]);
      (statisticsLib.getFinalProducts as any).mockReturnValue([
        { itemId: 1001, itemName: 'Electromagnetic Matrix', totalProduction: 60, totalConsumption: 0, netProduction: 60 },
      ]);
      
      render(<StatisticsView calculationResult={mockCalculationResult} />);

      expect(screen.getByText('Electromagnetic Matrix')).toBeInTheDocument();
      expect(screen.getByText(/Item 1002/)).toBeInTheDocument(); // Fallback
      expect(screen.getByText(/Item 1003/)).toBeInTheDocument(); // Fallback
    });
  });

  describe('Edge Cases', () => {
    it('should handle single item in each category', () => {
      render(<StatisticsView calculationResult={mockCalculationResult} />);

      // Each category should render correctly with single item
      expect(screen.getByText('Iron Ore')).toBeInTheDocument();
      expect(screen.getByText('Iron Ingot')).toBeInTheDocument();
      expect(screen.getByText('Electromagnetic Matrix')).toBeInTheDocument();
    });

    it('should handle large numbers correctly', () => {
      const largeStatistics: ProductionStatistics = {
        items: new Map([
          [1001, { itemId: 1001, totalProduction: 12345, totalConsumption: 0, netProduction: 12345, isRawMaterial: false }],
        ]),
        totalMachines: 999.9,
        totalPower: 5000000, // 5000 MW
      };

      (statisticsLib.calculateItemStatistics as any).mockReturnValue(largeStatistics);
      (statisticsLib.getFinalProducts as any).mockReturnValue([
        { itemId: 1001, itemName: 'Electromagnetic Matrix', totalProduction: 12345, totalConsumption: 0, netProduction: 12345 },
      ]);

      render(<StatisticsView calculationResult={mockCalculationResult} />);

      // Large machine count: 999.9 -> 1000 (ceiling)
      expect(screen.getByText('1000')).toBeInTheDocument();
      
      // Large power: 5000000 kW -> 5000.00 MW
      expect(screen.getByText(/5000\.00 MW/i)).toBeInTheDocument();
      
      // Large production rate
      expect(screen.getByText('12345.0/s')).toBeInTheDocument();
    });
  });
});
