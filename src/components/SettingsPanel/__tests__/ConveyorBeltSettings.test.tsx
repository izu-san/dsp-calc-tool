import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConveyorBeltSettings } from '../ConveyorBeltSettings';
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

describe('ConveyorBeltSettings', () => {
  const mockSetConveyorBelt = vi.fn();
  const mockSetSorter = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      settings: {
        conveyorBelt: {
          tier: 'mk1',
          speed: 6,
          stackCount: 1,
        },
        sorter: {
          tier: 'mk1',
          powerConsumption: 18,
        },
      },
      setConveyorBelt: mockSetConveyorBelt,
      setSorter: mockSetSorter,
    });
  });

  describe('Belt Tier Selection', () => {
    it('すべてのベルトTierオプションを表示する', () => {
      render(<ConveyorBeltSettings />);

      expect(screen.getByText('Mk.I')).toBeInTheDocument();
      expect(screen.getByText('Mk.II')).toBeInTheDocument();
      expect(screen.getByText('Mk.III')).toBeInTheDocument();
      expect(screen.getByText('6/s')).toBeInTheDocument();
      expect(screen.getByText('12/s')).toBeInTheDocument();
      expect(screen.getByText('30/s')).toBeInTheDocument();
    });

    it('選択されたTierをハイライト表示する', () => {
      render(<ConveyorBeltSettings />);

      const mk1Button = screen.getByText('Mk.I').closest('button');
      expect(mk1Button).toHaveClass('bg-neon-yellow/30');
      expect(mk1Button).toHaveClass('border-neon-yellow');
    });

    it('Mk.II Tierを選択できる', () => {
      render(<ConveyorBeltSettings />);

      const mk2Button = screen.getByText('Mk.II').closest('button');
      fireEvent.click(mk2Button!);

      expect(mockSetConveyorBelt).toHaveBeenCalledWith('mk2', 1);
    });

    it('Mk.III Tierを選択できる', () => {
      render(<ConveyorBeltSettings />);

      const mk3Button = screen.getByText('Mk.III').closest('button');
      fireEvent.click(mk3Button!);

      expect(mockSetConveyorBelt).toHaveBeenCalledWith('mk3', 1);
    });

    it('Tier変更時に現在のstackCountを保持する', () => {
      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        settings: {
          conveyorBelt: {
            tier: 'mk1',
            speed: 6,
            stackCount: 3,
          },
          sorter: {
            tier: 'mk1',
            powerConsumption: 18,
          },
        },
        setConveyorBelt: mockSetConveyorBelt,
        setSorter: mockSetSorter,
      });

      render(<ConveyorBeltSettings />);

      const mk2Button = screen.getByText('Mk.II').closest('button');
      fireEvent.click(mk2Button!);

      expect(mockSetConveyorBelt).toHaveBeenCalledWith('mk2', 3);
    });
  });

  describe('Stack Count Selection', () => {
    it('すべてのstackCountオプション（1-4）を表示する', () => {
      render(<ConveyorBeltSettings />);

      expect(screen.getByText('×1')).toBeInTheDocument();
      expect(screen.getByText('×2')).toBeInTheDocument();
      expect(screen.getByText('×3')).toBeInTheDocument();
      expect(screen.getByText('×4')).toBeInTheDocument();
    });

    it('選択されたstackCountをハイライト表示する', () => {
      render(<ConveyorBeltSettings />);

      const stackButton = screen.getByText('×1').closest('button');
      expect(stackButton).toHaveClass('bg-neon-green/30');
      expect(stackButton).toHaveClass('border-neon-green');
    });

    it('stackCountを2に変更できる', () => {
      render(<ConveyorBeltSettings />);

      const stack2Button = screen.getByText('×2').closest('button');
      fireEvent.click(stack2Button!);

      expect(mockSetConveyorBelt).toHaveBeenCalledWith('mk1', 2);
    });

    it('stackCountを4に変更できる', () => {
      render(<ConveyorBeltSettings />);

      const stack4Button = screen.getByText('×4').closest('button');
      fireEvent.click(stack4Button!);

      expect(mockSetConveyorBelt).toHaveBeenCalledWith('mk1', 4);
    });
  });

  describe('Total Speed Display', () => {
    it('基本スピード（×1）を正しく表示する', () => {
      render(<ConveyorBeltSettings />);

      expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('スタック数2倍のスピード（6 × 2 = 12）を表示する', () => {
      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        settings: {
          conveyorBelt: {
            tier: 'mk1',
            speed: 6,
            stackCount: 2,
          },
          sorter: {
            tier: 'mk1',
            powerConsumption: 18,
          },
        },
        setConveyorBelt: mockSetConveyorBelt,
        setSorter: mockSetSorter,
      });

      render(<ConveyorBeltSettings />);

      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('(6/s × 2)')).toBeInTheDocument();
    });

    it('Mk.IIベルトのスピード（12 × 3 = 36）を表示する', () => {
      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        settings: {
          conveyorBelt: {
            tier: 'mk2',
            speed: 12,
            stackCount: 3,
          },
          sorter: {
            tier: 'mk1',
            powerConsumption: 18,
          },
        },
        setConveyorBelt: mockSetConveyorBelt,
        setSorter: mockSetSorter,
      });

      render(<ConveyorBeltSettings />);

      expect(screen.getByText('36')).toBeInTheDocument();
      expect(screen.getByText('(12/s × 3)')).toBeInTheDocument();
    });

    it('Mk.IIIベルトのスピード（30 × 4 = 120）を表示する', () => {
      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        settings: {
          conveyorBelt: {
            tier: 'mk3',
            speed: 30,
            stackCount: 4,
          },
          sorter: {
            tier: 'mk1',
            powerConsumption: 18,
          },
        },
        setConveyorBelt: mockSetConveyorBelt,
        setSorter: mockSetSorter,
      });

      render(<ConveyorBeltSettings />);

      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('(30/s × 4)')).toBeInTheDocument();
    });

    it('stackCount=1の場合、計算式を表示しない', () => {
      render(<ConveyorBeltSettings />);

      expect(screen.queryByText(/\(6\/s × 1\)/)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('無効なstackCount（0）の場合にuseEffect内で修正する', () => {
      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        settings: {
          conveyorBelt: {
            tier: 'mk1',
            speed: 6,
            stackCount: 0,
          },
          sorter: {
            tier: 'mk1',
            powerConsumption: 18,
          },
        },
        setConveyorBelt: mockSetConveyorBelt,
        setSorter: mockSetSorter,
      });

      render(<ConveyorBeltSettings />);

      expect(mockSetConveyorBelt).toHaveBeenCalledWith('mk1', 1);
    });

    it('無効なstackCount（5以上）の場合にuseEffect内で修正する', () => {
      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        settings: {
          conveyorBelt: {
            tier: 'mk1',
            speed: 6,
            stackCount: 5,
          },
          sorter: {
            tier: 'mk1',
            powerConsumption: 18,
          },
        },
        setConveyorBelt: mockSetConveyorBelt,
        setSorter: mockSetSorter,
      });

      render(<ConveyorBeltSettings />);

      expect(mockSetConveyorBelt).toHaveBeenCalledWith('mk1', 1);
    });

    it('non-number型のstackCountの場合にuseEffect内で修正する', () => {
      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        settings: {
          conveyorBelt: {
            tier: 'mk1',
            speed: 6,
            stackCount: 'invalid' as any,
          },
          sorter: {
            tier: 'mk1',
            powerConsumption: 18,
          },
        },
        setConveyorBelt: mockSetConveyorBelt,
        setSorter: mockSetSorter,
      });

      render(<ConveyorBeltSettings />);

      expect(mockSetConveyorBelt).toHaveBeenCalledWith('mk1', 1);
    });

    it('無効なspeed値（non-number）の場合に0としてフォールバックする', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        settings: {
          conveyorBelt: {
            tier: 'mk1',
            speed: 'invalid' as any,
            stackCount: 2,
          },
          sorter: {
            tier: 'mk1',
            powerConsumption: 18,
          },
        },
        setConveyorBelt: mockSetConveyorBelt,
        setSorter: mockSetSorter,
      });

      render(<ConveyorBeltSettings />);

      // totalSpeed = 0 * 2 = 0
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[WARN] [DSP-Calc:ConveyorBeltSettings] Invalid values detected',
        expect.objectContaining({
          speed: 'invalid',
          stackCount: 2,
        })
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Icons', () => {
    it('各ベルトTierのアイコンを表示する', () => {
      render(<ConveyorBeltSettings />);

      // ICONS.belt の値を確認（実際の値に応じて調整）
      expect(screen.getByTestId('item-icon-2001')).toBeInTheDocument(); // Mk.I
      expect(screen.getByTestId('item-icon-2002')).toBeInTheDocument(); // Mk.II
      expect(screen.getByTestId('item-icon-2003')).toBeInTheDocument(); // Mk.III
    });
  });

  describe('UI Interaction', () => {
    it('Tier選択ボタンがホバー可能である', () => {
      render(<ConveyorBeltSettings />);

      const mk2Button = screen.getByText('Mk.II').closest('button');
      expect(mk2Button).toHaveClass('hover:scale-105');
    });

    it('stackCountボタンがホバー可能である', () => {
      render(<ConveyorBeltSettings />);

      const stack2Button = screen.getByText('×2').closest('button');
      expect(stack2Button).toHaveClass('hover:scale-110');
    });

    it('選択されたTierが視覚的に強調される（scale-105）', () => {
      render(<ConveyorBeltSettings />);

      const mk1Button = screen.getByText('Mk.I').closest('button');
      expect(mk1Button).toHaveClass('scale-105');
    });

    it('選択されたstackCountが視覚的に強調される（scale-110）', () => {
      render(<ConveyorBeltSettings />);

      const stack1Button = screen.getByText('×1').closest('button');
      expect(stack1Button).toHaveClass('scale-110');
    });
  });

  describe('Sorter Rank Selection', () => {
    it('すべてのソーターランクオプションを表示する', () => {
      render(<ConveyorBeltSettings />);

      expect(screen.getByText('Mk.I')).toBeInTheDocument();
      expect(screen.getByText('Mk.II')).toBeInTheDocument();
      expect(screen.getByText('Mk.III')).toBeInTheDocument();
      expect(screen.getByText('pilingSorter')).toBeInTheDocument(); // i18n key
      expect(screen.getByText('18kW')).toBeInTheDocument();
      expect(screen.getByText('36kW')).toBeInTheDocument();
      expect(screen.getByText('72kW')).toBeInTheDocument();
      expect(screen.getByText('144kW')).toBeInTheDocument();
    });

    it('選択されたソーターランクをハイライト表示する', () => {
      render(<ConveyorBeltSettings />);

      const mk1Button = screen.getByTestId('sorter-button-mk1');
      expect(mk1Button).toHaveClass('bg-neon-yellow/30');
      expect(mk1Button).toHaveClass('border-neon-yellow');
    });

    it('Mk.II ソーターランクを選択できる', () => {
      render(<ConveyorBeltSettings />);

      const mk2Button = screen.getByTestId('sorter-button-mk2');
      fireEvent.click(mk2Button);

      expect(mockSetSorter).toHaveBeenCalledWith('mk2');
    });

    it('Mk.III ソーターランクを選択できる', () => {
      render(<ConveyorBeltSettings />);

      const mk3Button = screen.getByTestId('sorter-button-mk3');
      fireEvent.click(mk3Button);

      expect(mockSetSorter).toHaveBeenCalledWith('mk3');
    });

    it('集積ソーターランクを選択できる', () => {
      render(<ConveyorBeltSettings />);

      const pileButton = screen.getByTestId('sorter-button-pile');
      fireEvent.click(pileButton);

      expect(mockSetSorter).toHaveBeenCalledWith('pile');
    });

    it('異なるソーターランクが選択されている場合の表示', () => {
      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        settings: {
          conveyorBelt: {
            tier: 'mk1',
            speed: 6,
            stackCount: 1,
          },
          sorter: {
            tier: 'mk3',
            powerConsumption: 72,
          },
        },
        setConveyorBelt: mockSetConveyorBelt,
        setSorter: mockSetSorter,
      });

      render(<ConveyorBeltSettings />);

      const mk3Button = screen.getByTestId('sorter-button-mk3');
      expect(mk3Button).toHaveClass('bg-neon-purple/30');
      expect(mk3Button).toHaveClass('border-neon-purple');
    });
  });
});
