import { useState, useEffect, useCallback } from 'react';
import type { RecipeTreeNode, CalculationResult } from '../types';

// ノードIDを生成する（ResultTreeコンポーネントと一致させる必要がある）
const generateNodeId = (node: RecipeTreeNode, parentNodeId: string, depth: number): string => {
  if (node.isRawMaterial) {
    return `${parentNodeId}-raw-${node.itemId}-${depth}`;
  }
  return `${parentNodeId}-${node.recipe?.SID}-${depth}`;
};

// 指定された深さ以降のノードIDを収集する
const collectNodeIdsFromDepth = (node: RecipeTreeNode, currentDepth: number, targetDepth: number, parentNodeId: string = 'root'): Set<string> => {
  const nodeIds = new Set<string>();
  
  const traverse = (n: RecipeTreeNode, depth: number, parentId: string) => {
    if (depth >= targetDepth) {
      const nodeId = depth === 0 ? 'root' : generateNodeId(n, parentId, depth);
      nodeIds.add(nodeId);
    }
    n.children?.forEach((child: RecipeTreeNode) => {
      const currentNodeId = depth === 0 ? 'root' : generateNodeId(n, parentId, depth);
      traverse(child, depth + 1, currentNodeId);
    });
  };
  
  traverse(node, currentDepth, parentNodeId);
  return nodeIds;
};

// 全てのノードIDを収集する
const collectAllNodeIds = (node: RecipeTreeNode, depth: number, parentId: string): Set<string> => {
  const allNodeIds = new Set<string>();
  const nodeId = depth === 0 ? 'root' : generateNodeId(node, parentId, depth);
  allNodeIds.add(nodeId);
  node.children?.forEach((child: RecipeTreeNode) => {
    const childNodeIds = collectAllNodeIds(child, depth + 1, nodeId);
    childNodeIds.forEach(id => allNodeIds.add(id));
  });
  return allNodeIds;
};

/**
 * ツリーの折りたたみ状態を管理するカスタムフック
 */
export function useTreeCollapse(calculationResult: CalculationResult | null) {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [isTreeExpanded, setIsTreeExpanded] = useState(false);

  // 計算結果が変更されたら、デフォルトで深さ1以降を折りたたむ
  useEffect(() => {
    if (calculationResult?.rootNode) {
      // queueMicrotaskで状態更新を遅延させ、カスケードレンダリングを回避
      queueMicrotask(() => {
        const depthOneAndBeyond = collectNodeIdsFromDepth(calculationResult.rootNode, 0, 1);
        setCollapsedNodes(depthOneAndBeyond);
        setIsTreeExpanded(false);
      });
    }
  }, [calculationResult]);

  // 単一ノードの折りたたみ状態をトグル
  const handleToggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // 全展開/全折りたたみをトグル
  const handleToggleAll = useCallback(() => {
    if (isTreeExpanded) {
      // 全折りたたみ
      if (calculationResult?.rootNode) {
        const allNodeIds = collectAllNodeIds(calculationResult.rootNode, 0, 'root');
        setCollapsedNodes(allNodeIds);
        setIsTreeExpanded(false);
      }
    } else {
      // 全展開
      setCollapsedNodes(new Set());
      setIsTreeExpanded(true);
    }
  }, [isTreeExpanded, calculationResult]);

  return {
    collapsedNodes,
    isTreeExpanded,
    handleToggleCollapse,
    handleToggleAll,
  };
}

