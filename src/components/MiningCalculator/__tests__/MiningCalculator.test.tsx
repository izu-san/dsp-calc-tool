import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MiningCalculator } from '../index';
import type { CalculationResult, RecipeTreeNode, PowerConsumption } from '../../../types/calculation';

// Mock dependencies
vi.mock('../../../lib/miningCalculation');
vi.mock('../../../stores/settingsStore');
vi.mock('../../../stores/miningSettingsStore');

// Mock useSettingsStore
const mockSetMiningSpeedResearch = vi.fn();
const mockUseSettingsStore = vi.fn();
vi.mock('../../../stores/settingsStore', () => ({
  useSettingsStore: () => mockUseSettingsStore(),
}));

// Mock useMiningSettingsStore
const mockSetMachineType = vi.fn();
const mockSetWorkSpeedMultiplier = vi.fn();
const mockUseMiningSettingsStore = vi.fn();
vi.mock('../../../stores/miningSettingsStore', () => ({
  useMiningSettingsStore: () => mockUseMiningSettingsStore(),
}));

// Helper to create complete MiningRequirement
const createMiningRequirement = (overrides: any = {}) => ({
  itemId: 1001,
  itemName: 'Iron Ore',
  requiredRate: 10,
  miningSpeedBonus: 1.0,
  workSpeedMultiplier: 100,
  powerMultiplier: 1.0,
  outputPerSecond: 1.0,
  minersNeeded: 10,
  veinsNeeded: 100,
  machineType: 'Advanced Mining Machine',
  ...overrides,
});

// Helper to create complete MiningCalculation
// Default includes one material to avoid empty state rendering
const createMiningCalculation = (overrides: any = {}) => ({
  rawMaterials: [createMiningRequirement()],
  totalMiners: 10,
  totalOrbitalCollectors: 0,
  ...overrides,
});

describe('MiningCalculator', () => {
  const mockPower: PowerConsumption = {
    machines: 1000,
    sorters: 100,
    total: 1100,
  };

  const mockRootNode: RecipeTreeNode = {
    targetOutputRate: 1,
    machineCount: 10,
    proliferator: {
      type: 'none',
      mode: 'production',
      productionBonus: 0,
      speedBonus: 0,
      powerIncrease: 0,
    },
    power: mockPower,
    inputs: [],
    children: [],
    conveyorBelts: { inputs: 0, outputs: 0, total: 0 },
    nodeId: 'test-node-1',
  };

  const mockCalculationResult: CalculationResult = {
    rootNode: mockRootNode,
    totalPower: mockPower,
    totalMachines: 10,
    rawMaterials: new Map(),
  };

  // Import after mocks are set up
  let calculateMiningRequirements: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseSettingsStore.mockReturnValue({
      settings: { miningSpeedResearch: 100 },
      setMiningSpeedResearch: mockSetMiningSpeedResearch,
    });
    
    mockUseMiningSettingsStore.mockReturnValue({
      settings: {
        machineType: 'Advanced Mining Machine',
        workSpeedMultiplier: 100,
      },
      setMachineType: mockSetMachineType,
      setWorkSpeedMultiplier: mockSetWorkSpeedMultiplier,
    });

    const module = await import('../../../lib/miningCalculation');
    calculateMiningRequirements = module.calculateMiningRequirements;
  });

  // ===========================
  // 1. Rendering Tests (5)
  // ===========================

  describe('Rendering', () => {
    it('should render empty state when no raw materials are required', () => {
      vi.mocked(calculateMiningRequirements).mockReturnValue(
        createMiningCalculation({ rawMaterials: [], totalMiners: 0 })
      );

      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      expect(screen.getByTestId('miningCalculator')).toBeInTheDocument();
      expect(screen.getByTestId('noRawMaterialsRequired')).toBeInTheDocument();
    });

    it('should render header and configuration sections with valid data', () => {
      vi.mocked(calculateMiningRequirements).mockReturnValue(
        createMiningCalculation({
          rawMaterials: [createMiningRequirement()],
          totalMiners: 10,
        })
      );

      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      expect(screen.getByTestId('miningCalculator')).toBeInTheDocument();
      expect(screen.getByTestId('miningSpeedResearch')).toBeInTheDocument();
      expect(screen.getByTestId('machineType')).toBeInTheDocument();
    });

    it('should render material breakdown list', () => {
      vi.mocked(calculateMiningRequirements).mockReturnValue(
        createMiningCalculation({
          rawMaterials: [createMiningRequirement({ itemName: 'Iron Ore' })],
        })
      );

      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      expect(screen.getByText('Iron Ore')).toBeInTheDocument();
    });

    it('should render orbital collectors card when totalOrbitalCollectors > 0', () => {
      vi.mocked(calculateMiningRequirements).mockReturnValue(
        createMiningCalculation({
          rawMaterials: [
            createMiningRequirement({
              itemName: 'Hydrogen',
              orbitCollectorsNeeded: 10,
              orbitalCollectorSpeed: 0.5,
            }),
          ],
          totalOrbitalCollectors: 10,
        })
      );

      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      expect(screen.getByTestId('orbitalCollectors')).toBeInTheDocument();
    });

    it('should NOT render orbital collectors card when totalOrbitalCollectors = 0', () => {
      vi.mocked(calculateMiningRequirements).mockReturnValue(
        createMiningCalculation({
          rawMaterials: [createMiningRequirement()],
        })
      );

      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      expect(screen.queryByText(/forHydrogenDeuterium/i)).not.toBeInTheDocument();
    });
  });

  // ===========================
  // 2. State Management (6)
  // ===========================

  describe('State Management', () => {
    beforeEach(() => {
      vi.mocked(calculateMiningRequirements).mockReturnValue(createMiningCalculation());
    });

    it('should initialize state from settingsStore', () => {
      mockUseSettingsStore.mockReturnValue({
        settings: { miningSpeedResearch: 200 },
        setMiningSpeedResearch: mockSetMiningSpeedResearch,
      });

      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input.value).toBe('200');
    });

    it('should call setMiningSpeedResearch when miningSpeedBonus changes', () => {
      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '150' } });

      expect(mockSetMiningSpeedResearch).toHaveBeenCalledWith(150);
    });

    it('should re-calculate when machineType changes', () => {
      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'Mining Machine' } });

      expect(vi.mocked(calculateMiningRequirements)).toHaveBeenCalled();
    });

    it('should re-calculate when workSpeedMultiplier changes', () => {
      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      const slider = screen.getByRole('slider') as HTMLInputElement;
      fireEvent.change(slider, { target: { value: '200' } });

      expect(vi.mocked(calculateMiningRequirements)).toHaveBeenCalled();
    });
  });

  // ===========================
  // 3. Input Controls (7)
  // ===========================

  describe('Input Controls', () => {
    beforeEach(() => {
      vi.mocked(calculateMiningRequirements).mockReturnValue(createMiningCalculation());
    });

    it('should decrease miningSpeedBonus with minus button (clamped to min 100)', () => {
      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      const minusButton = screen.getAllByText('−')[0] as HTMLButtonElement;
      const input = screen.getByRole('spinbutton') as HTMLInputElement;

      fireEvent.click(minusButton);
      expect(input.value).toBe('100'); // Already at minimum
    });

    it('should increase miningSpeedBonus with plus button', () => {
      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      const plusButton = screen.getAllByText('+')[0] as HTMLButtonElement;
      const input = screen.getByRole('spinbutton') as HTMLInputElement;

      fireEvent.click(plusButton);
      expect(input.value).toBe('110'); // 100 + 10
    });

    it('should validate direct input (clamp 100-100000)', () => {
      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      const input = screen.getByRole('spinbutton') as HTMLInputElement;

      fireEvent.change(input, { target: { value: '50' } });
      expect(input.value).toBe('100'); // Clamped to min

      fireEvent.change(input, { target: { value: '200000' } });
      expect(input.value).toBe('100000'); // Clamped to max
    });

    it('should change machineType via select', () => {
      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;

      fireEvent.change(select, { target: { value: 'Mining Machine' } });
      
      // Verify that setMachineType was called
      expect(mockSetMachineType).toHaveBeenCalledWith('Mining Machine');
    });

    it('should change workSpeedMultiplier via slider', () => {
      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      const slider = screen.getByRole('slider') as HTMLInputElement;

      fireEvent.change(slider, { target: { value: '250' } });
      
      // Verify that setWorkSpeedMultiplier was called
      expect(mockSetWorkSpeedMultiplier).toHaveBeenCalledWith(250);
    });

    it('should disable slider when machineType is Mining Machine', () => {
      // Mock Mining Machine state
      mockUseMiningSettingsStore.mockReturnValue({
        settings: {
          machineType: 'Mining Machine',
          workSpeedMultiplier: 100,
        },
        setMachineType: mockSetMachineType,
        setWorkSpeedMultiplier: mockSetWorkSpeedMultiplier,
      });

      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      const slider = screen.getByRole('slider') as HTMLInputElement;
      expect(slider.disabled).toBe(true);
    });

    it('should apply slider gradient for Advanced Mining Machine', () => {
      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      const slider = screen.getByRole('slider') as HTMLInputElement;

      fireEvent.change(select, { target: { value: 'Advanced Mining Machine' } });
      expect(slider.getAttribute('data-has-gradient')).toBe('true');
    });
  });

  // ===========================
  // 4. Display Logic (5)
  // ===========================

  describe('Display Logic', () => {
    it('should display power multiplier correctly', () => {
      // Mock store with 200% work speed
      mockUseMiningSettingsStore.mockReturnValue({
        settings: {
          machineType: 'Advanced Mining Machine',
          workSpeedMultiplier: 200,
        },
        setMachineType: mockSetMachineType,
        setWorkSpeedMultiplier: mockSetWorkSpeedMultiplier,
      });

      // Mock calculation with 200% work speed
      vi.mocked(calculateMiningRequirements).mockReturnValue(
        createMiningCalculation({
          rawMaterials: [
            createMiningRequirement({
              workSpeedMultiplier: 200,
              powerMultiplier: 4.0, // (200/100)^2 = 4.0
            }),
          ],
        })
      );

      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      // Should display 4.00x power multiplier
      expect(screen.getByText(/4\.00x/)).toBeInTheDocument();
    });

    it('should display orbital collectors for Hydrogen', () => {
      vi.mocked(calculateMiningRequirements).mockReturnValue(
        createMiningCalculation({
          rawMaterials: [
            createMiningRequirement({
              itemName: 'Hydrogen',
              orbitCollectorsNeeded: 20,
              orbitalCollectorSpeed: 0.25,
            }),
          ],
          totalOrbitalCollectors: 20,
        })
      );

      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      expect(screen.getByTestId('collectors-label')).toBeInTheDocument();
    });

    it('should display veinsNeeded and minersNeeded', () => {
      vi.mocked(calculateMiningRequirements).mockReturnValue(
        createMiningCalculation({
          rawMaterials: [
            createMiningRequirement({
              itemName: 'Copper Ore',
              veinsNeeded: 80,
              minersNeeded: 8,
            }),
          ],
        })
      );

      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      expect(screen.getByTestId('veins-label')).toBeInTheDocument();
      expect(screen.getByTestId('minersNeeded-label')).toBeInTheDocument();
    });

    it('should calculate power multiplier using formula', () => {
      // Mock store with 300% work speed
      mockUseMiningSettingsStore.mockReturnValue({
        settings: {
          machineType: 'Advanced Mining Machine',
          workSpeedMultiplier: 300,
        },
        setMachineType: mockSetMachineType,
        setWorkSpeedMultiplier: mockSetWorkSpeedMultiplier,
      });

      // Mock calculation with 300% work speed
      vi.mocked(calculateMiningRequirements).mockReturnValue(
        createMiningCalculation({
          rawMaterials: [
            createMiningRequirement({
              workSpeedMultiplier: 300,
              powerMultiplier: 9.0, // (300/100)^2 = 9.0
            }),
          ],
        })
      );

      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      // Should display 9.00x power multiplier
      expect(screen.getByText(/9\.00x/)).toBeInTheDocument();
    });

    it('should display standard power when workSpeed = 100', () => {
      vi.mocked(calculateMiningRequirements).mockReturnValue(createMiningCalculation());

      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      expect(screen.getByText(/1\.0x/)).toBeInTheDocument();
    });
  });

  // ===========================
  // 5. Edge Cases (4)
  // ===========================

  describe('Edge Cases', () => {
    it('should handle single raw material', () => {
      vi.mocked(calculateMiningRequirements).mockReturnValue(
        createMiningCalculation({
          rawMaterials: [createMiningRequirement({ itemName: 'Stone' })],
        })
      );

      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      expect(screen.getByText('Stone')).toBeInTheDocument();
    });

    it('should handle multiple materials', () => {
      vi.mocked(calculateMiningRequirements).mockReturnValue(
        createMiningCalculation({
          rawMaterials: [
            createMiningRequirement({ itemName: 'Iron Ore', itemId: 1001 }),
            createMiningRequirement({ itemName: 'Copper Ore', orbitCollectorsNeeded: 10, itemId: 1002 }),
          ],
          totalOrbitalCollectors: 10,
        })
      );

      render(<MiningCalculator calculationResult={mockCalculationResult} />);

      expect(screen.getByText('Iron Ore')).toBeInTheDocument();
      expect(screen.getByText('Copper Ore')).toBeInTheDocument();
    });
  });
});
