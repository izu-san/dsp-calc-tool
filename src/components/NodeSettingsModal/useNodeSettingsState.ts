import { useState, useEffect, useCallback } from "react";
import type { RecipeTreeNode, NodeOverrideSettings, GlobalSettings } from "../../types";
import type { ProliferatorType, ProliferatorMode } from "../../types/settings";

/**
 * ノード設定モーダルの状態を管理するカスタムフック
 */
export function useNodeSettingsState(
  node: RecipeTreeNode,
  isOpen: boolean,
  nodeOverrides: Map<string, NodeOverrideSettings>,
  settings: GlobalSettings
) {
  /**
   * 現在の設定から状態を初期化
   */
  const initializeState = useCallback(() => {
    const override = nodeOverrides.get(node.nodeId);
    const recipeType = node.recipe?.Type;

    // 型推論を助けるために、明示的にProliferatorTypeとProliferatorModeを取得
    const proliferatorType: ProliferatorType =
      override?.proliferator?.type ?? settings.proliferator.type;
    const proliferatorMode: ProliferatorMode =
      override?.proliferator?.mode ?? settings.proliferator.mode;

    // machineRankの取得（型安全に）
    let machineRank = "";
    if (override?.machineRank) {
      machineRank = override.machineRank;
    } else if (recipeType && recipeType in settings.machineRank) {
      const key = recipeType as keyof typeof settings.machineRank;
      machineRank = settings.machineRank[key] || "";
    }

    return {
      useOverride: !!override,
      proliferatorType,
      proliferatorMode,
      machineRank,
    };
  }, [node.nodeId, node.recipe?.Type, nodeOverrides, settings]);

  const [state, setState] = useState(initializeState);

  /**
   * モーダルが開いたときに状態を再初期化
   * queueMicrotaskを使用することで、React の batch update と競合を避ける
   */
  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setState(initializeState());
      });
    }
  }, [isOpen, initializeState]);

  return {
    state,
    setUseOverride: (value: boolean) => setState(prev => ({ ...prev, useOverride: value })),
    setProliferatorType: (value: ProliferatorType) =>
      setState(prev => ({ ...prev, proliferatorType: value })),
    setProliferatorMode: (value: ProliferatorMode) =>
      setState(prev => ({ ...prev, proliferatorMode: value })),
    setMachineRank: (value: string) => setState(prev => ({ ...prev, machineRank: value })),
    resetState: () => setState(initializeState()),
  };
}
