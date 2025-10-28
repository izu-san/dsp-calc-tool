import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductionResultsPanel } from '../ProductionResultsPanel';
import type { Recipe, CalculationResult } from '../../../types';

// i18nextをモック
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        productionTree: 'Production Tree',
        statistics: 'Statistics',
        buildingCost: 'Building Cost',
        expandAll: 'Expand All',
        collapseAll: 'Collapse All',
        calculating: 'Calculating...',
        noRecipeSelected: 'No recipe selected',
        loading: 'Loading...',
        multiOutputResults: 'Multi-Output Items',
        itemsPerSecond: 'items/second',
      };
      return translations[key] || key;
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

describe('ProductionResultsPanel', () => {
  const mockRecipe: Recipe = {
    SID: 1,
    name: 'Iron Ingot',
    Type: 'Smelt',
    Explicit: false,
    TimeSpend: 60,
    Items: [],
    Results: [{ id: 1101, name: 'Iron Ingot', count: 1 }],
    GridIndex: '0101',
    iconPath: '/path/to/icon.png',
    productive: false,
  };

  const mockCalculationResult: CalculationResult = {
    rootNode: {
      itemId: 1101,
      itemName: 'Iron Ingot',
      targetOutputRate: 10,
      recipe: mockRecipe,
      machine: {} as any,
      machineCount: 5,
      proliferator: { type: 'none', mode: 'speed' } as any,
      proliferatorMultiplier: { production: 1, speed: 1 },
      power: { machines: 100, sorters: 10, total: 110 },
      conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
      children: [],
      isRawMaterial: false,
    },
    totalMachines: new Map(),
    totalPower: 110,
    rawMaterials: [],
  };

  const mockHandleToggleCollapse = vi.fn();
  const mockHandleToggleAll = vi.fn();

  it('calculationResultがnullでselectedRecipeもnullの場合、"No recipe selected"が表示される', () => {
    render(
      <ProductionResultsPanel
        calculationResult={null}
        selectedRecipe={null}
        collapsedNodes={new Set()}
        isTreeExpanded={false}
        handleToggleCollapse={mockHandleToggleCollapse}
        handleToggleAll={mockHandleToggleAll}
      />
    );

    expect(screen.getByText('No recipe selected')).toBeInTheDocument();
  });

  it('calculationResultがnullでselectedRecipeがある場合、"Calculating..."が表示される', () => {
    render(
      <ProductionResultsPanel
        calculationResult={null}
        selectedRecipe={mockRecipe}
        collapsedNodes={new Set()}
        isTreeExpanded={false}
        handleToggleCollapse={mockHandleToggleCollapse}
        handleToggleAll={mockHandleToggleAll}
      />
    );

    expect(screen.getByText('Calculating...')).toBeInTheDocument();
  });

  it('calculationResultがある場合、タブが表示される', () => {
    render(
      <ProductionResultsPanel
        calculationResult={mockCalculationResult}
        selectedRecipe={mockRecipe}
        collapsedNodes={new Set()}
        isTreeExpanded={false}
        handleToggleCollapse={mockHandleToggleCollapse}
        handleToggleAll={mockHandleToggleAll}
      />
    );

    expect(screen.getByRole('button', { name: 'Production Tree' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Statistics' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Building Cost' })).toBeInTheDocument();
  });

  it('統計タブをクリックすると表示が切り替わる', () => {
    render(
      <ProductionResultsPanel
        calculationResult={mockCalculationResult}
        selectedRecipe={mockRecipe}
        collapsedNodes={new Set()}
        isTreeExpanded={false}
        handleToggleCollapse={mockHandleToggleCollapse}
        handleToggleAll={mockHandleToggleAll}
      />
    );

    const statisticsButton = screen.getByRole('button', { name: 'Statistics' });
    fireEvent.click(statisticsButton);

    // 統計タブがアクティブになることを確認（クラスで判定）
    expect(statisticsButton).toHaveClass('border-neon-blue');
  });

  it('建設コストタブをクリックすると表示が切り替わる', () => {
    render(
      <ProductionResultsPanel
        calculationResult={mockCalculationResult}
        selectedRecipe={mockRecipe}
        collapsedNodes={new Set()}
        isTreeExpanded={false}
        handleToggleCollapse={mockHandleToggleCollapse}
        handleToggleAll={mockHandleToggleAll}
      />
    );

    const buildingCostButton = screen.getByRole('button', { name: 'Building Cost' });
    fireEvent.click(buildingCostButton);

    expect(buildingCostButton).toHaveClass('border-neon-blue');
  });

  it('生産ツリータブでは展開/折りたたみボタンが表示される', () => {
    render(
      <ProductionResultsPanel
        calculationResult={mockCalculationResult}
        selectedRecipe={mockRecipe}
        collapsedNodes={new Set()}
        isTreeExpanded={false}
        handleToggleCollapse={mockHandleToggleCollapse}
        handleToggleAll={mockHandleToggleAll}
      />
    );

    expect(screen.getByText('Expand All')).toBeInTheDocument();
  });

  it('統計タブでは展開/折りたたみボタンが表示されない', () => {
    render(
      <ProductionResultsPanel
        calculationResult={mockCalculationResult}
        selectedRecipe={mockRecipe}
        collapsedNodes={new Set()}
        isTreeExpanded={false}
        handleToggleCollapse={mockHandleToggleCollapse}
        handleToggleAll={mockHandleToggleAll}
      />
    );

    const statisticsButton = screen.getByText('Statistics');
    fireEvent.click(statisticsButton);

    expect(screen.queryByText('Expand All')).not.toBeInTheDocument();
    expect(screen.queryByText('Collapse All')).not.toBeInTheDocument();
  });

  it('展開/折りたたみボタンをクリックするとhandleToggleAllが呼ばれる', () => {
    render(
      <ProductionResultsPanel
        calculationResult={mockCalculationResult}
        selectedRecipe={mockRecipe}
        collapsedNodes={new Set()}
        isTreeExpanded={false}
        handleToggleCollapse={mockHandleToggleCollapse}
        handleToggleAll={mockHandleToggleAll}
      />
    );

    const toggleButton = screen.getByText('Expand All');
    fireEvent.click(toggleButton);

    expect(mockHandleToggleAll).toHaveBeenCalledTimes(1);
  });

  it('isTreeExpanded=trueの場合、"Collapse All"が表示される', () => {
    render(
      <ProductionResultsPanel
        calculationResult={mockCalculationResult}
        selectedRecipe={mockRecipe}
        collapsedNodes={new Set()}
        isTreeExpanded={true}
        handleToggleCollapse={mockHandleToggleCollapse}
        handleToggleAll={mockHandleToggleAll}
      />
    );

    expect(screen.getByText('Collapse All')).toBeInTheDocument();
    expect(screen.queryByText('Expand All')).not.toBeInTheDocument();
  });

  it('hologram-panelクラスが適用されている', () => {
    const { container } = render(
      <ProductionResultsPanel
        calculationResult={mockCalculationResult}
        selectedRecipe={mockRecipe}
        collapsedNodes={new Set()}
        isTreeExpanded={false}
        handleToggleCollapse={mockHandleToggleCollapse}
        handleToggleAll={mockHandleToggleAll}
      />
    );

    const panel = container.querySelector('.hologram-panel');
    expect(panel).toBeInTheDocument();
  });

  it('タイトルが表示される', () => {
    render(
      <ProductionResultsPanel
        calculationResult={mockCalculationResult}
        selectedRecipe={mockRecipe}
        collapsedNodes={new Set()}
        isTreeExpanded={false}
        handleToggleCollapse={mockHandleToggleCollapse}
        handleToggleAll={mockHandleToggleAll}
      />
    );

    const title = screen.getByRole('heading', { level: 2 });
    expect(title).toHaveTextContent('Production Tree');
  });

  it('タブ間の切り替えが正しく動作する', () => {
    render(
      <ProductionResultsPanel
        calculationResult={mockCalculationResult}
        selectedRecipe={mockRecipe}
        collapsedNodes={new Set()}
        isTreeExpanded={false}
        handleToggleCollapse={mockHandleToggleCollapse}
        handleToggleAll={mockHandleToggleAll}
      />
    );

    // 初期状態: Production Treeがアクティブ
    const productionTreeButton = screen.getByRole('button', { name: 'Production Tree' });
    expect(productionTreeButton).toHaveClass('border-neon-blue');

    // Statisticsに切り替え
    const statisticsButton = screen.getByRole('button', { name: 'Statistics' });
    fireEvent.click(statisticsButton);
    expect(statisticsButton).toHaveClass('border-neon-blue');

    // Production Treeに戻る
    fireEvent.click(productionTreeButton);
    expect(productionTreeButton).toHaveClass('border-neon-blue');
  });

  it('複数出力レシピの場合、Multi-Output Itemsセクションを表示する', () => {
    const multiOutputResult = {
      ...mockCalculationResult,
      multiOutputResults: [
        {
          itemId: 1101,
          itemName: 'Iron Ingot',
          productionRate: 10,
          count: 1,
        },
        {
          itemId: 1102,
          itemName: 'Copper Ingot',
          productionRate: 5,
          count: 0.5,
        },
      ],
    };

    render(
      <ProductionResultsPanel
        calculationResult={multiOutputResult}
        selectedRecipe={mockRecipe}
        collapsedNodes={new Set()}
        isTreeExpanded={false}
        handleToggleCollapse={mockHandleToggleCollapse}
        handleToggleAll={mockHandleToggleAll}
      />
    );

    expect(screen.getByText('Multi-Output Items')).toBeInTheDocument();
    expect(screen.getByText('Iron Ingot')).toBeInTheDocument();
    expect(screen.getByText('Copper Ingot')).toBeInTheDocument();
    expect(screen.getByText('10.0/s')).toBeInTheDocument();
    expect(screen.getByText('5.0/s')).toBeInTheDocument();
  });

  it('単一出力レシピの場合、Multi-Output Itemsセクションを表示しない', () => {
    const singleOutputResult = {
      ...mockCalculationResult,
      multiOutputResults: undefined,
    };

    render(
      <ProductionResultsPanel
        calculationResult={singleOutputResult}
        selectedRecipe={mockRecipe}
        collapsedNodes={new Set()}
        isTreeExpanded={false}
        handleToggleCollapse={mockHandleToggleCollapse}
        handleToggleAll={mockHandleToggleAll}
      />
    );

    expect(screen.queryByText('Multi-Output Items')).not.toBeInTheDocument();
  });
});

