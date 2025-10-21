import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MachineRankSettings } from '../MachineRankSettings';
import { useSettingsStore } from '../../../stores/settingsStore';

// i18nextのモック
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// ストアのモック
vi.mock('../../../stores/settingsStore');

// ItemIconコンポーネントのモック
vi.mock('../../ItemIcon', () => ({
  ItemIcon: ({ itemId }: { itemId: number }) => <div data-testid={`item-icon-${itemId}`} />,
}));

describe('MachineRankSettings', () => {
  const mockSetMachineRank = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      settings: {
        machineRank: {
          Smelt: 'arc',
          Assemble: 'mk1',
          Chemical: 'standard',
          Research: 'standard',
          Refine: 'standard',
          Particle: 'standard',
        },
      },
      setMachineRank: mockSetMachineRank,
    });
  });

  describe('Smelt (Smelter) Settings', () => {
    it('すべてのSmelterオプションを表示する', () => {
      render(<MachineRankSettings />);

      expect(screen.getByText('arcSmelter')).toBeInTheDocument();
      expect(screen.getByText('planeSmelter')).toBeInTheDocument();
      expect(screen.getByText('negentropySmelter')).toBeInTheDocument();
    });

    it('選択されたSmelter (arc) をハイライト表示する', () => {
      render(<MachineRankSettings />);

      const arcButton = screen.getByText('arcSmelter').closest('button');
      expect(arcButton).toHaveClass('bg-neon-orange/30');
      expect(arcButton).toHaveClass('border-neon-orange');
    });

    it('Plane Smelterを選択できる', () => {
      render(<MachineRankSettings />);

      const planeButton = screen.getByText('planeSmelter').closest('button');
      fireEvent.click(planeButton!);

      expect(mockSetMachineRank).toHaveBeenCalledWith('Smelt', 'plane');
    });

    it('Negentropy Smelterを選択できる', () => {
      render(<MachineRankSettings />);

      const negentropyButton = screen.getByText('negentropySmelter').closest('button');
      fireEvent.click(negentropyButton!);

      expect(mockSetMachineRank).toHaveBeenCalledWith('Smelt', 'negentropy');
    });

    it('Smelterアイコンを表示する', () => {
      render(<MachineRankSettings />);

      expect(screen.getByTestId('item-icon-2302')).toBeInTheDocument(); // Arc
      expect(screen.getByTestId('item-icon-2315')).toBeInTheDocument(); // Plane
      expect(screen.getByTestId('item-icon-2319')).toBeInTheDocument(); // Negentropy
    });
  });

  describe('Assemble (Assembler) Settings', () => {
    it('すべてのAssemblerオプションを表示する', () => {
      render(<MachineRankSettings />);

      expect(screen.getByText('assemblingMachineMk1')).toBeInTheDocument();
      expect(screen.getByText('assemblingMachineMk2')).toBeInTheDocument();
      expect(screen.getByText('assemblingMachineMk3')).toBeInTheDocument();
      expect(screen.getByText('recomposingAssembler')).toBeInTheDocument();
    });

    it('選択されたAssembler (mk1) をハイライト表示する', () => {
      render(<MachineRankSettings />);

      const mk1Button = screen.getByText('assemblingMachineMk1').closest('button');
      expect(mk1Button).toHaveClass('bg-neon-blue/30');
      expect(mk1Button).toHaveClass('border-neon-blue');
    });

    it('Assembler Mk.IIを選択できる', () => {
      render(<MachineRankSettings />);

      const mk2Button = screen.getByText('assemblingMachineMk2').closest('button');
      fireEvent.click(mk2Button!);

      expect(mockSetMachineRank).toHaveBeenCalledWith('Assemble', 'mk2');
    });

    it('Assembler Mk.IIIを選択できる', () => {
      render(<MachineRankSettings />);

      const mk3Button = screen.getByText('assemblingMachineMk3').closest('button');
      fireEvent.click(mk3Button!);

      expect(mockSetMachineRank).toHaveBeenCalledWith('Assemble', 'mk3');
    });

    it('Re-composing Assemblerを選択できる', () => {
      render(<MachineRankSettings />);

      const recomposingButton = screen.getByText('recomposingAssembler').closest('button');
      fireEvent.click(recomposingButton!);

      expect(mockSetMachineRank).toHaveBeenCalledWith('Assemble', 'recomposing');
    });

    it('Assemblerアイコンを表示する', () => {
      render(<MachineRankSettings />);

      expect(screen.getByTestId('item-icon-2303')).toBeInTheDocument(); // Mk.I
      expect(screen.getByTestId('item-icon-2304')).toBeInTheDocument(); // Mk.II
      expect(screen.getByTestId('item-icon-2305')).toBeInTheDocument(); // Mk.III
      expect(screen.getByTestId('item-icon-2318')).toBeInTheDocument(); // Recomposing
    });
  });

  describe('Chemical Plant Settings', () => {
    it('すべてのChemical Plantオプションを表示する', () => {
      render(<MachineRankSettings />);

      expect(screen.getByText('chemicalPlantStandard')).toBeInTheDocument();
      expect(screen.getByText('quantumChemicalPlant')).toBeInTheDocument();
    });

    it('選択されたChemical Plant (standard) をハイライト表示する', () => {
      render(<MachineRankSettings />);

      const standardButton = screen.getByText('chemicalPlantStandard').closest('button');
      expect(standardButton).toHaveClass('bg-neon-green/30');
      expect(standardButton).toHaveClass('border-neon-green');
    });

    it('Quantum Chemical Plantを選択できる', () => {
      render(<MachineRankSettings />);

      const quantumButton = screen.getByText('quantumChemicalPlant').closest('button');
      fireEvent.click(quantumButton!);

      expect(mockSetMachineRank).toHaveBeenCalledWith('Chemical', 'quantum');
    });

    it('Chemical Plantアイコンを表示する', () => {
      render(<MachineRankSettings />);

      expect(screen.getByTestId('item-icon-2309')).toBeInTheDocument(); // Standard
      expect(screen.getByTestId('item-icon-2317')).toBeInTheDocument(); // Quantum
    });
  });

  describe('Research (Matrix Lab) Settings', () => {
    it('すべてのMatrix Labオプションを表示する', () => {
      render(<MachineRankSettings />);

      expect(screen.getByText('matrixLabStandard')).toBeInTheDocument();
      expect(screen.getByText('selfEvolutionLab')).toBeInTheDocument();
    });

    it('選択されたMatrix Lab (standard) をハイライト表示する', () => {
      render(<MachineRankSettings />);

      const standardButton = screen.getByText('matrixLabStandard').closest('button');
      expect(standardButton).toHaveClass('bg-neon-purple/30');
      expect(standardButton).toHaveClass('border-neon-purple');
    });

    it('Self-evolution Labを選択できる', () => {
      render(<MachineRankSettings />);

      const selfEvoButton = screen.getByText('selfEvolutionLab').closest('button');
      fireEvent.click(selfEvoButton!);

      expect(mockSetMachineRank).toHaveBeenCalledWith('Research', 'self-evolution');
    });

    it('Matrix Labアイコンを表示する', () => {
      render(<MachineRankSettings />);

      expect(screen.getByTestId('item-icon-2901')).toBeInTheDocument(); // Standard
      expect(screen.getByTestId('item-icon-2902')).toBeInTheDocument(); // Self-evolution
    });
  });

  describe('Speed Descriptions', () => {
    it('各マシンのスピード説明を表示する', () => {
      render(<MachineRankSettings />);

      // Assembler speeds
      expect(screen.getByText('0.75x speed')).toBeInTheDocument();
      expect(screen.getByText('1.5x speed')).toBeInTheDocument();
      // 全マシンの説明数: Smelt 3 + Assemble 4 + Chemical 2 + Research 2 = 11
      expect(screen.getAllByText(/\dx speed/)).toHaveLength(11);
    });
  });

  describe('UI Interaction', () => {
    it('すべてのボタンがホバー可能である', () => {
      render(<MachineRankSettings />);

      const arcButton = screen.getByText('arcSmelter').closest('button');
      expect(arcButton).toHaveClass('hover:scale-105');
    });

    it('選択されたボタンが視覚的に強調される（scale-105）', () => {
      render(<MachineRankSettings />);

      const arcButton = screen.getByText('arcSmelter').closest('button');
      expect(arcButton).toHaveClass('scale-105');
    });

    it('複数のmachineTypeを独立して設定できる', () => {
      render(<MachineRankSettings />);

      // Smelt を plane に変更
      const planeButton = screen.getByText('planeSmelter').closest('button');
      fireEvent.click(planeButton!);
      expect(mockSetMachineRank).toHaveBeenCalledWith('Smelt', 'plane');

      // Assemble を mk3 に変更
      const mk3Button = screen.getByText('assemblingMachineMk3').closest('button');
      fireEvent.click(mk3Button!);
      expect(mockSetMachineRank).toHaveBeenCalledWith('Assemble', 'mk3');

      // Chemical を quantum に変更
      const quantumButton = screen.getByText('quantumChemicalPlant').closest('button');
      fireEvent.click(quantumButton!);
      expect(mockSetMachineRank).toHaveBeenCalledWith('Chemical', 'quantum');

      // Research を self-evolution に変更
      const selfEvoButton = screen.getByText('selfEvolutionLab').closest('button');
      fireEvent.click(selfEvoButton!);
      expect(mockSetMachineRank).toHaveBeenCalledWith('Research', 'self-evolution');

      expect(mockSetMachineRank).toHaveBeenCalledTimes(4);
    });
  });

  describe('Different Initial States', () => {
    it('Plane Smelterが初期選択されている場合のハイライト', () => {
      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        settings: {
          machineRank: {
            Smelt: 'plane',
            Assemble: 'mk1',
            Chemical: 'standard',
            Research: 'standard',
            Refine: 'standard',
            Particle: 'standard',
          },
        },
        setMachineRank: mockSetMachineRank,
      });

      render(<MachineRankSettings />);

      const planeButton = screen.getByText('planeSmelter').closest('button');
      expect(planeButton).toHaveClass('bg-neon-orange/30');
    });

    it('すべて最高ランクが選択されている場合', () => {
      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        settings: {
          machineRank: {
            Smelt: 'negentropy',
            Assemble: 'recomposing',
            Chemical: 'quantum',
            Research: 'self-evolution',
            Refine: 'standard',
            Particle: 'standard',
          },
        },
        setMachineRank: mockSetMachineRank,
      });

      render(<MachineRankSettings />);

      expect(screen.getByText('negentropySmelter').closest('button')).toHaveClass('bg-neon-orange/30');
      expect(screen.getByText('recomposingAssembler').closest('button')).toHaveClass('bg-neon-blue/30');
      expect(screen.getByText('quantumChemicalPlant').closest('button')).toHaveClass('bg-neon-green/30');
      expect(screen.getByText('selfEvolutionLab').closest('button')).toHaveClass('bg-neon-purple/30');
    });
  });

  describe('Section Labels', () => {
    it('各セクションのラベルを表示する', () => {
      const { container } = render(<MachineRankSettings />);

      // labelタグから正確に検索
      const labels = container.querySelectorAll('label');
      const labelTexts = Array.from(labels).map(label => label.textContent);

      expect(labelTexts.some(text => text?.includes('smelter'))).toBe(true);
      expect(labelTexts.some(text => text?.includes('assembler'))).toBe(true);
      expect(labelTexts.some(text => text?.includes('chemicalPlant'))).toBe(true);
      expect(labelTexts.some(text => text?.includes('matrixLab'))).toBe(true);
    });

    it('各セクションのラベルに絵文字が含まれる', () => {
      const { container } = render(<MachineRankSettings />);

      // labelタグ内に絵文字が含まれていることを確認
      const labels = container.querySelectorAll('label');
      const labelTexts = Array.from(labels).map(label => label.textContent);

      expect(labelTexts.some(text => text?.includes('🔥'))).toBe(true); // Smelt
      expect(labelTexts.some(text => text?.includes('⚙️'))).toBe(true); // Assemble
      expect(labelTexts.some(text => text?.includes('🧪'))).toBe(true); // Chemical
      expect(labelTexts.some(text => text?.includes('🔬'))).toBe(true); // Research
    });
  });
});
