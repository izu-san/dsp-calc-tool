import { useState, useEffect, useCallback, useRef } from 'react';
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

// 全てのノードIDを収集する（原材料ノードとPhotonGenerationの子ノードを除外するオプション付き）
const collectAllNodeIds = (node: RecipeTreeNode, depth: number, parentId: string, excludeUnstableNodes = false): Set<string> => {
  const allNodeIds = new Set<string>();
  const nodeId = depth === 0 ? 'root' : generateNodeId(node, parentId, depth);
  
  // PhotonGenerationレシピの場合、その子ノードは不安定（設定変更で変わる）なので除外
  const parentIsPhotonGeneration = node.recipe?.Type === 'PhotonGeneration';
  
  // 不安定なノードを除外する場合はスキップ
  if (!excludeUnstableNodes || (!node.isRawMaterial && !parentIsPhotonGeneration)) {
    allNodeIds.add(nodeId);
  }
  
  // PhotonGenerationレシピの子ノードは構造が不安定なので、子の探索をスキップ
  if (!parentIsPhotonGeneration) {
    node.children?.forEach((child: RecipeTreeNode) => {
      const childNodeIds = collectAllNodeIds(child, depth + 1, nodeId, excludeUnstableNodes);
      childNodeIds.forEach(id => allNodeIds.add(id));
    });
  }
  
  return allNodeIds;
};

/**
 * ツリーの折りたたみ状態を管理するカスタムフック
 */
export function useTreeCollapse(calculationResult: CalculationResult | null) {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [isTreeExpanded, setIsTreeExpanded] = useState(false);
  const prevNodeIdsRef = useRef<string>(''); // useRefを使用してレンダリング間で値を保持

  // 計算結果が変更されたら、デフォルトで深さ1以降を折りたたむ
  // ただし、既存のノードIDは維持する
  useEffect(() => {
    if (calculationResult?.rootNode) {
      // 現在のツリーの全ノードIDを取得して文字列化
      // 原材料ノードとPhotonGenerationの子ノードは設定変更で変わるため、構造比較から除外
      const currentNodeIds = collectAllNodeIds(calculationResult.rootNode, 0, 'root', true);
      const currentNodeIdsStr = Array.from(currentNodeIds).sort().join(',');
      
      // ノードIDのセットが変わっていない場合は何もしない（設定変更のみの場合）
      if (currentNodeIdsStr === prevNodeIdsRef.current) {
        return;
      }
      
      // ノードIDのセットが変わった場合のみ、折りたたみ状態を更新
      prevNodeIdsRef.current = currentNodeIdsStr;
      
      // queueMicrotaskで状態更新を遅延させ、カスケードレンダリングを回避
      queueMicrotask(() => {
        const depthOneAndBeyond = collectNodeIdsFromDepth(calculationResult.rootNode, 0, 1);
        
        setCollapsedNodes(prev => {
          // 既存の折りたたみ状態を維持しつつ、新しいノードのみデフォルト折りたたみを適用
          const newCollapsed = new Set<string>();
          
          // 全ノードID（原材料含む）を取得
          const allCurrentNodeIds = collectAllNodeIds(calculationResult.rootNode, 0, 'root', false);
          
          // 既存の折りたたみ状態を維持（ノードIDが新しいツリーにも存在する場合）
          prev.forEach(nodeId => {
            if (allCurrentNodeIds.has(nodeId)) {
              newCollapsed.add(nodeId);
            }
          });
          
          // 新規ノード（深さ1以降）でまだ折りたたみ状態にないものをデフォルト折りたたみ
          depthOneAndBeyond.forEach(nodeId => {
            if (!prev.has(nodeId)) {
              newCollapsed.add(nodeId);
            }
          });
          
          return newCollapsed;
        });
        
        // 全展開状態はリセット（部分的な変更の可能性があるため）
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

