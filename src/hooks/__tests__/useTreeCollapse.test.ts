import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTreeCollapse } from '../useTreeCollapse';
import type { CalculationResult, RecipeTreeNode } from '../../types';

describe('useTreeCollapse', () => {
  const createMockNode = (id: number, children?: RecipeTreeNode[]): RecipeTreeNode => ({
    itemId: id,
    itemName: `Item ${id}`,
    targetOutputRate: 1,
    recipe: { SID: id, name: `Recipe ${id}` } as any,
    machine: {} as any,
    machineCount: 1,
    proliferator: { type: 'none', mode: 'speed' } as any,
    proliferatorMultiplier: { production: 1, speed: 1 },
    power: { machines: 0, sorters: 0, total: 0 },
    conveyorBelts: { inputs: 0, outputs: 0, total: 0 },
    children: children || [],
    isRawMaterial: false,
  });

  const createMockCalculationResult = (rootNode: RecipeTreeNode): CalculationResult => ({
    rootNode,
    totalMachines: new Map(),
    totalPower: 0,
    rawMaterials: [],
  });

  it('初期状態では深さ1以降のノードが折りたたまれる', async () => {
    const child1 = createMockNode(2);
    const child2 = createMockNode(3);
    const rootNode = createMockNode(1, [child1, child2]);
    const calculationResult = createMockCalculationResult(rootNode);

    const { result } = renderHook(() => useTreeCollapse(calculationResult));

    // queueMicrotaskの処理を待つため、少し待機
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // 深さ1以降のノードが折りたたまれていることを確認
    expect(result.current.collapsedNodes.size).toBeGreaterThan(0);
    expect(result.current.isTreeExpanded).toBe(false);
  });

  it('calculationResultがnullの場合、空のSetを返す', () => {
    const { result } = renderHook(() => useTreeCollapse(null));

    expect(result.current.collapsedNodes.size).toBe(0);
    expect(result.current.isTreeExpanded).toBe(false);
  });

  it('handleToggleCollapseでノードの折りたたみ状態をトグルできる', async () => {
    const child = createMockNode(2);
    const rootNode = createMockNode(1, [child]);
    const calculationResult = createMockCalculationResult(rootNode);

    const { result } = renderHook(() => useTreeCollapse(calculationResult));

    // 初期状態を待つ
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    const initialSize = result.current.collapsedNodes.size;
    const testNodeId = 'test-node-id';

    // ノードを折りたたむ
    act(() => {
      result.current.handleToggleCollapse(testNodeId);
    });

    expect(result.current.collapsedNodes.has(testNodeId)).toBe(true);
    expect(result.current.collapsedNodes.size).toBe(initialSize + 1);

    // 再度トグルで展開
    act(() => {
      result.current.handleToggleCollapse(testNodeId);
    });

    expect(result.current.collapsedNodes.has(testNodeId)).toBe(false);
    expect(result.current.collapsedNodes.size).toBe(initialSize);
  });

  it('handleToggleAllで全展開できる', async () => {
    const child = createMockNode(2);
    const rootNode = createMockNode(1, [child]);
    const calculationResult = createMockCalculationResult(rootNode);

    const { result } = renderHook(() => useTreeCollapse(calculationResult));

    // 初期状態は折りたたまれている（queueMicrotaskで遅延されるため待つ）
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    expect(result.current.isTreeExpanded).toBe(false);

    // 全展開
    act(() => {
      result.current.handleToggleAll();
    });

    expect(result.current.isTreeExpanded).toBe(true);
    expect(result.current.collapsedNodes.size).toBe(0);
  });

  it('handleToggleAllで全折りたたみできる', async () => {
    const child = createMockNode(2);
    const rootNode = createMockNode(1, [child]);
    const calculationResult = createMockCalculationResult(rootNode);

    const { result } = renderHook(() => useTreeCollapse(calculationResult));

    // 初期状態を待つ
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // まず全展開
    act(() => {
      result.current.handleToggleAll();
    });

    expect(result.current.isTreeExpanded).toBe(true);
    expect(result.current.collapsedNodes.size).toBe(0);

    // 全折りたたみ
    act(() => {
      result.current.handleToggleAll();
    });

    expect(result.current.isTreeExpanded).toBe(false);
    expect(result.current.collapsedNodes.size).toBeGreaterThan(0);
  });

  it('calculationResultが変更されると折りたたみ状態がリセットされる', async () => {
    const child1 = createMockNode(2);
    const rootNode1 = createMockNode(1, [child1]);
    const calculationResult1 = createMockCalculationResult(rootNode1);

    const { result, rerender } = renderHook(
      ({ calcResult }) => useTreeCollapse(calcResult),
      { initialProps: { calcResult: calculationResult1 } }
    );

    // 全展開
    act(() => {
      result.current.handleToggleAll();
    });

    expect(result.current.isTreeExpanded).toBe(true);

    // 新しい計算結果に変更
    const child2 = createMockNode(3);
    const rootNode2 = createMockNode(4, [child2]);
    const calculationResult2 = createMockCalculationResult(rootNode2);

    rerender({ calcResult: calculationResult2 });

    // queueMicrotaskで遅延されるため、少し待機
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.isTreeExpanded).toBe(false);
  });

  it('深いネストされたツリーを正しく処理する', async () => {
    const grandChild = createMockNode(3);
    const child = createMockNode(2, [grandChild]);
    const rootNode = createMockNode(1, [child]);
    const calculationResult = createMockCalculationResult(rootNode);

    const { result } = renderHook(() => useTreeCollapse(calculationResult));

    // 深さ1以降のノードが折りたたまれている（queueMicrotaskで遅延されるため待つ）
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    expect(result.current.isTreeExpanded).toBe(false);

    // 全展開（初期状態では折りたたまれているので、トグルで全展開になる）
    act(() => {
      result.current.handleToggleAll();
    });

    expect(result.current.isTreeExpanded).toBe(true);
    expect(result.current.collapsedNodes.size).toBe(0);
  });

  it('原材料ノードを正しく処理する', async () => {
    const rawMaterialNode: RecipeTreeNode = {
      itemId: 100,
      itemName: 'Iron Ore',
      targetOutputRate: 10,
      recipe: null,
      machine: null,
      machineCount: 0,
      proliferator: { type: 'none', mode: 'speed' } as any,
      proliferatorMultiplier: { production: 1, speed: 1 },
      power: { machines: 0, sorters: 0, total: 0 },
      conveyorBelts: { inputs: 0, outputs: 0, total: 0 },
      children: [],
      isRawMaterial: true,
    };

    const rootNode = createMockNode(1, [rawMaterialNode]);
    const calculationResult = createMockCalculationResult(rootNode);

    const { result } = renderHook(() => useTreeCollapse(calculationResult));

    // 原材料ノードも正しく処理される（queueMicrotaskで遅延されるため待つ）
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // 原材料ノードは折りたたまれない（深さ1以降のみ折りたたまれる）
    expect(result.current.collapsedNodes.size).toBeGreaterThan(0);
  });
});

