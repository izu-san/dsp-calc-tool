import type { CalculationResult, RecipeTreeNode } from "../../types";
import { getLinkColor, getNodeAppearance, getPaletteIndex } from "./node-colors";
import type {
  SankeyBuildOptions,
  SankeyGraphData,
  SankeyLinkDatum,
  SankeyNodeDatum,
  VisualizationNodeType,
} from "./types";

interface InternalItemNodeState {
  id: string;
  label: string;
  type: VisualizationNodeType;
  value: number;
  appearanceIndex: number;
}

const NODE_TYPE_PRIORITY: VisualizationNodeType[] = [
  "raw-material",
  "intermediate",
  "final-product",
];

export function buildSankeyData(
  calculationResult: CalculationResult,
  options: SankeyBuildOptions = {}
): SankeyGraphData {
  const { includeByproducts = true } = options;

  const rawMaterialIds = new Set<number>();
  calculationResult.rawMaterials.forEach((_, itemId) => rawMaterialIds.add(itemId));

  const nodesMap = new Map<string, SankeyNodeDatum>();
  const itemPalette = new Map<number, number>();
  const itemState = new Map<number, InternalItemNodeState>();
  const linkAccumulator = new Map<string, SankeyLinkDatum>();

  const finalItemId = resolveFinalItemId(calculationResult);

  traverseNode(calculationResult.rootNode);

  // 最終製品ノードからシンクノードへのリンクを作成
  if (finalItemId !== undefined) {
    const finalProductNodeId = `item-${finalItemId}`;
    const finalProductNode = nodesMap.get(finalProductNodeId);
    if (finalProductNode && finalProductNode.type === "final-product") {
      // 仮想的なシンクノードを作成（表示はしない）
      const sinkNodeId = "sink";
      if (!nodesMap.has(sinkNodeId)) {
        nodesMap.set(sinkNodeId, {
          id: sinkNodeId,
          label: "",
          type: "final-product",
          value: finalProductNode.value,
        });
      }
      // 最終製品ノードからシンクノードへのリンクを作成
      accumulateLink({
        source: finalProductNodeId,
        target: sinkNodeId,
        value: finalProductNode.value,
        itemId: finalItemId,
        label: finalProductNode.label,
        paletteIndex: itemState.get(finalItemId)?.appearanceIndex ?? 0,
      });
    }
  }

  return {
    nodes: Array.from(nodesMap.values()),
    links: Array.from(linkAccumulator.values()),
  };

  function traverseNode(node: RecipeTreeNode) {
    if (node.isRawMaterial) {
      ensureItemNode({
        itemId: node.itemId!,
        label: node.itemName || String(node.itemId),
        typeHint: rawMaterialIds.has(node.itemId!) ? "raw-material" : "intermediate",
        value: node.targetOutputRate,
      });
      return;
    }

    // 機械ノードを削除し、入力アイテムから出力アイテムへの直接リンクを作成
    const outputs = resolveOutputs(node, includeByproducts, finalItemId);
    const outputNodes = outputs.map(output =>
      ensureItemNode({
        itemId: output.itemId,
        label: output.name,
        typeHint: output.itemId === finalItemId ? "final-product" : "intermediate",
        value: output.rate,
        recipeNode: node, // このアイテムを生産するレシピノードを渡す
      })
    );

    node.children.forEach(child => traverseNode(child));

    // 各入力から各出力へのリンクを作成
    node.inputs.forEach(input => {
      const inputNode = ensureItemNode({
        itemId: input.itemId,
        label: input.itemName,
        typeHint: determineItemTypeForInput(input.itemId, finalItemId, rawMaterialIds),
        value: input.requiredRate,
      });

      // 各出力に対してリンクを作成
      outputs.forEach((_output, index) => {
        const outputNode = outputNodes[index];
        // リンクの値は入力アイテムの消費レート
        const linkValue = input.requiredRate;
        accumulateLink({
          source: inputNode.id,
          target: outputNode.id,
          value: linkValue,
          itemId: input.itemId, // 入力アイテムのID
          label: input.itemName, // 入力アイテムの名前
          paletteIndex: inputNode.appearanceIndex,
        });
      });
    });
  }

  function ensureItemNode({
    itemId,
    label,
    typeHint,
    value,
    recipeNode,
  }: {
    itemId: number;
    label: string;
    typeHint: VisualizationNodeType;
    value: number;
    recipeNode?: RecipeTreeNode; // このアイテムを生産するレシピノード（オプション）
  }): InternalItemNodeState {
    const id = `item-${itemId}`;
    const existingState = itemState.get(itemId);
    if (existingState) {
      existingState.value = Math.max(existingState.value, value);
      const updatedType = prioritizeNodeType(existingState.type, typeHint);
      if (updatedType !== existingState.type) {
        existingState.type = updatedType;
        const appearance = getNodeAppearance(updatedType, existingState.appearanceIndex);
        const registeredNode = nodesMap.get(existingState.id);
        if (registeredNode) {
          registeredNode.type = updatedType;
          registeredNode.appearance = appearance;
        }
      }
      const registeredNode = nodesMap.get(existingState.id);
      if (registeredNode) {
        registeredNode.value = Math.max(registeredNode.value, value);
        // レシピノードの情報があればmetadataを更新
        if (recipeNode && !registeredNode.metadata?.recipeNode) {
          registeredNode.metadata = {
            ...registeredNode.metadata,
            recipeNode: {
              machine: recipeNode.machine,
              machineCount: recipeNode.machineCount,
              proliferator: recipeNode.proliferator,
              power: recipeNode.power,
              recipeType: recipeNode.recipe?.Type,
            },
          };
        }
      }
      return existingState;
    }

    const appearanceIndex = getPaletteIndex(itemId, itemPalette);
    const appearance = getNodeAppearance(typeHint, appearanceIndex);

    const nodeDatum: SankeyNodeDatum = {
      id,
      label,
      type: typeHint,
      itemId,
      value,
      appearance,
      metadata: recipeNode
        ? {
            recipeNode: {
              machine: recipeNode.machine,
              machineCount: recipeNode.machineCount,
              proliferator: recipeNode.proliferator,
              power: recipeNode.power,
              recipeType: recipeNode.recipe?.Type,
            },
          }
        : undefined,
    };

    nodesMap.set(id, nodeDatum);
    const state: InternalItemNodeState = {
      id,
      label,
      type: typeHint,
      value,
      appearanceIndex,
    };
    itemState.set(itemId, state);
    return state;
  }

  function accumulateLink(params: {
    source: string;
    target: string;
    value: number;
    itemId: number;
    label: string;
    paletteIndex: number;
  }) {
    if (params.value <= 0) return;
    const key = `${params.source}__${params.target}__${params.itemId}`;
    const existing = linkAccumulator.get(key);
    if (existing) {
      existing.value += params.value;
      return;
    }

    linkAccumulator.set(key, {
      source: params.source,
      target: params.target,
      value: params.value,
      itemId: params.itemId,
      label: params.label,
      color: getLinkColor(params.paletteIndex),
    });
  }
}

function prioritizeNodeType(
  current: VisualizationNodeType,
  incoming: VisualizationNodeType
): VisualizationNodeType {
  const currentPriority = NODE_TYPE_PRIORITY.indexOf(current as VisualizationNodeType);
  const incomingPriority = NODE_TYPE_PRIORITY.indexOf(incoming as VisualizationNodeType);
  return currentPriority >= incomingPriority ? current : incoming;
}

function resolveFinalItemId(calculationResult: CalculationResult): number | undefined {
  const rootNode = calculationResult.rootNode;
  if (rootNode.targetItemId) return rootNode.targetItemId;
  return rootNode.recipe?.Results[0]?.id;
}

function determineItemTypeForInput(
  itemId: number,
  finalItemId: number | undefined,
  rawMaterialIds: Set<number>
): VisualizationNodeType {
  if (rawMaterialIds.has(itemId)) {
    return "raw-material";
  }
  if (itemId === finalItemId) {
    return "final-product";
  }
  return "intermediate";
}

function resolveOutputs(
  node: RecipeTreeNode,
  includeByproducts: boolean,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _finalItemId: number | undefined
): Array<{ itemId: number; name: string; rate: number }> {
  if (!node.recipe || node.recipe.Results.length === 0) {
    return [];
  }

  const targetItemId = node.targetItemId ?? node.recipe.Results[0].id;
  const targetResult =
    node.recipe.Results.find(result => result.id === targetItemId) ?? node.recipe.Results[0];
  const craftsPerSecond = targetResult.count > 0 ? node.targetOutputRate / targetResult.count : 0;
  if (craftsPerSecond === 0) {
    return [];
  }

  return node.recipe.Results.filter(result => includeByproducts || result.id === targetItemId).map(
    result => ({
      itemId: result.id,
      name: result.name,
      rate: result.count * craftsPerSecond,
    })
  );
}
