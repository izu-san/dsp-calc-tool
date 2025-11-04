/**
 * Data transformer for export functionality
 *
 * CalculationResult を ExportData に変換する
 */

import type { CalculationResult, RecipeTreeNode } from "../../types/calculation";
import type { GlobalSettings } from "../../types/settings";
import type { ExportData } from "../../types/export";
import type { Recipe } from "../../types/game-data";
import type { PowerGeneratorType } from "../../types/power-generation";
import type { GameTemplate } from "../../types/settings/templates";
import type { ProliferatorConfig } from "../../types/settings";
import { EXPORT_VERSION } from "../../constants/exportVersion";
import { calculatePowerGeneration } from "../powerGenerationCalculation";

/**
 * CalculationResult を ExportData に変換する
 *
 * @param calculationResult - 計算結果
 * @param selectedRecipe - 選択されたレシピ
 * @param targetQuantity - 目標生産量
 * @param globalSettings - グローバル設定
 * @param planName - プラン名
 * @param exportDate - エクスポート日時
 * @param powerGenerationSettings - 発電設備設定
 * @param gameData - ゲームデータ
 * @returns ExportData
 */
export function transformToExportData(
  calculationResult: CalculationResult,
  selectedRecipe: Recipe,
  targetQuantity: number,
  globalSettings: GlobalSettings,
  planName: string,
  exportDate: number,
  powerGenerationSettings: {
    template: GameTemplate;
    manualGenerator: PowerGeneratorType | null;
    manualFuel: string | null;
    powerFuelProliferator: ProliferatorConfig;
  },
  gameData: { items: Map<number, { name: string }> }
): ExportData {
  const machines = new Map<number, { name: string; count: number; power: number }>();
  const products = new Map<number, { name: string; produced: number; consumed: number }>();

  // ツリーをトラバースして機械と製品の情報を集計
  traverseTree(calculationResult.rootNode, machines, products);

  // 原材料リスト
  const rawMaterials = Array.from(calculationResult.rawMaterials.entries()).map(
    ([itemId, rate]) => ({
      itemId,
      itemName: gameData.items.get(itemId)?.name || `Item ${itemId}`,
      consumptionRate: rate,
      unit: "/s",
    })
  );

  // 最終製品リスト（ルートノードの出力）
  const finalProducts = calculationResult.multiOutputResults
    ? calculationResult.multiOutputResults.map(output => ({
        itemId: output.itemId,
        itemName: output.itemName,
        productionRate: output.productionRate,
        consumptionRate: 0,
        netProduction: output.productionRate,
        unit: "/s",
      }))
    : [
        {
          itemId: selectedRecipe.Results[0]?.id || 0,
          itemName: selectedRecipe.Results[0]?.name || selectedRecipe.name,
          productionRate: calculationResult.rootNode.targetOutputRate,
          consumptionRate: 0,
          netProduction: calculationResult.rootNode.targetOutputRate,
          unit: "/s",
        },
      ];

  // 中間製品リスト
  const intermediateProducts = Array.from(products.entries())
    .filter(([itemId]) => !calculationResult.rawMaterials.has(itemId))
    .filter(([itemId]) => !finalProducts.some(p => p.itemId === itemId))
    .map(([itemId, data]) => ({
      itemId,
      itemName: data.name,
      productionRate: data.produced,
      consumptionRate: data.consumed,
      netProduction: data.produced - data.consumed,
      unit: "/s",
    }));

  // 全製品リスト
  const allProducts = [...finalProducts, ...intermediateProducts];

  // 機械リスト
  const exportMachines = Array.from(machines.entries()).map(([machineId, data]) => ({
    machineId,
    machineName: data.name,
    count: data.count,
    powerPerMachine: data.power / data.count, // 1台あたりの電力
    totalPower: data.power,
  }));

  // 電力消費
  const exportPowerConsumption = {
    machines: calculationResult.totalPower.machines,
    sorters: calculationResult.totalPower.sorters,
    dysonSphere: calculationResult.totalPower.dysonSphere,
    total: calculationResult.totalPower.total,
    breakdown: exportMachines, // 機械の内訳はそのまま利用
  };

  // コンベアベルト
  const exportConveyorBelts = {
    totalBelts: calculationResult.rootNode.conveyorBelts.total,
    totalLength: 0, // TODO: ベルト長は現在計算されていないため、0とする
    maxSaturation: calculationResult.rootNode.conveyorBelts.saturation || 0,
    bottleneckType: calculationResult.rootNode.conveyorBelts.bottleneckType,
  };

  // 発電設備の計算
  const powerGenerationResult = calculatePowerGeneration(
    calculationResult.totalPower.total,
    powerGenerationSettings.template,
    powerGenerationSettings.manualGenerator,
    powerGenerationSettings.manualFuel,
    powerGenerationSettings.powerFuelProliferator.speedBonus / 100,
    powerGenerationSettings.powerFuelProliferator.productionBonus / 100
  );

  const exportPowerGeneration = {
    totalRequiredPower: calculationResult.totalPower.total,
    totalGeneratedPower: powerGenerationResult.generators.reduce(
      (sum, gen) => sum + gen.totalOutput,
      0
    ),
    generators: powerGenerationResult.generators.map(gen => ({
      generatorId: gen.generator.machineId,
      generatorName: gen.generator.machineName,
      count: gen.count,
      powerPerGenerator: gen.actualOutputPerUnit,
      totalPower: gen.totalOutput,
      fuel: gen.fuel
        ? [
            {
              itemId: gen.fuel.itemId,
              itemName: gen.fuel.itemName,
              consumptionRate: gen.fuelConsumptionRate,
              unit: "/s",
            },
          ]
        : [],
    })),
  };

  return {
    version: EXPORT_VERSION,
    exportDate,
    planInfo: {
      planName,
      recipeSID: selectedRecipe.SID,
      recipeName: selectedRecipe.name,
      targetQuantity,
    },
    settings: globalSettings,
    statistics: {
      totalMachines: calculationResult.totalMachines,
      totalPower: calculationResult.totalPower.total,
      rawMaterialCount: rawMaterials.length,
      itemCount: allProducts.length,
    },
    rawMaterials,
    products: allProducts,
    machines: exportMachines,
    powerConsumption: exportPowerConsumption,
    conveyorBelts: exportConveyorBelts,
    powerGeneration: exportPowerGeneration,
  };
}

/**
 * ツリーを再帰的にトラバースして情報を収集する
 *
 * @param node - ツリーノード
 * @param machines - 機械の集計マップ
 * @param products - 製品の集計マップ
 */
function traverseTree(
  node: RecipeTreeNode,
  machines: Map<number, { name: string; count: number; power: number }>,
  products: Map<number, { name: string; produced: number; consumed: number }>
): void {
  // 機械を集計
  if (node.machine) {
    const existing = machines.get(node.machine.id) || {
      name: node.machine.name,
      count: 0,
      power: 0,
    };
    existing.count += node.machineCount;
    existing.power += node.power.machines;
    machines.set(node.machine.id, existing);
  }

  // 製品を集計
  if (node.recipe) {
    // 出力
    node.recipe.Results.forEach(result => {
      const existing = products.get(result.id) || {
        name: result.name,
        produced: 0,
        consumed: 0,
      };
      existing.produced += node.targetOutputRate * result.count;
      products.set(result.id, existing);
    });

    // 入力
    node.recipe.Items.forEach((item, index) => {
      const existing = products.get(item.id) || {
        name: item.name,
        produced: 0,
        consumed: 0,
      };
      existing.consumed += node.inputs[index]?.requiredRate || 0;
      products.set(item.id, existing);
    });
  }

  // 子ノードを再帰的に処理
  node.children.forEach(child => traverseTree(child, machines, products));
}
