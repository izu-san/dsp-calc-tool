import type { RecipeTreeNode } from "../types/calculation";
import type { MiningCalculation } from "./miningCalculation";

/**
 * 統一された電力計算結果
 */
export interface UnifiedPowerResult {
  /** 総消費電力 (kW) - 発電設備で供給する必要がある電力 */
  totalConsumption: number;
  /** 設備電力 (kW) - 生産設備の消費電力 */
  machinesPower: number;
  /** ソーター電力 (kW) - ソーターの消費電力 */
  sortersPower: number;
  /** 採掘電力 (kW) - 採掘機の消費電力 */
  miningPower: number;
  /** ダイソンスフィア電力 (kW) - ダイソンスフィアで供給される電力（消費電力ではない） */
  dysonSpherePower: number;
}

/**
 * 統一された電力計算関数
 *
 * この関数は以下の原則に従って電力を計算します：
 * 1. 総消費電力 = 設備電力 + ソーター電力 + 採掘電力
 * 2. ダイソンスフィア電力は消費電力に含めない（供給される電力）
 * 3. レイレシーバーはダイソンスフィア電力を使用するため、設備電力から除外
 *
 * @param rootNode レシピツリーのルートノード
 * @param miningCalculation 採掘計算結果（オプション）
 * @returns 統一された電力計算結果
 */
export function calculateUnifiedPower(
  rootNode: RecipeTreeNode,
  miningCalculation?: MiningCalculation
): UnifiedPowerResult {
  let machinesPower = 0;
  let sortersPower = 0;
  let dysonSpherePower = 0;

  // レシピツリーを再帰的に走査して電力を計算
  function traverse(node: RecipeTreeNode) {
    // ノードの電力情報が存在しない場合はスキップ
    if (!node.power) {
      // 子ノードを再帰的に処理（childrenが存在する場合のみ）
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          traverse(child);
        }
      }
      return;
    }

    // レイレシーバー（ID: 2208）の特別処理
    if (node.machine?.id === 2208) {
      // レイレシーバーはダイソンスフィア電力を使用するため、設備電力は除外
      // ソーター電力のみをカウント
      sortersPower += node.power.sorters;
      // ダイソンスフィア電力も記録（参考用）
      dysonSpherePower += node.power.dysonSphere || 0;
    } else {
      // 通常の設備：設備電力とソーター電力をカウント
      machinesPower += node.power.machines;
      sortersPower += node.power.sorters;
      // ダイソンスフィア電力も記録（参考用）
      dysonSpherePower += node.power.dysonSphere || 0;
    }

    // 子ノードを再帰的に処理（childrenが存在する場合のみ）
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  // レシピツリーを走査
  traverse(rootNode);

  // 採掘電力の計算
  let miningPower = 0;
  if (miningCalculation) {
    miningCalculation.rawMaterials.forEach(material => {
      if (material.orbitCollectorsNeeded) {
        // 軌道採集器は電力消費しない
        return;
      }

      // 採掘機の種類に応じた基本電力
      let basePowerPerMiner: number;
      if (material.machineType === "Water Pump") {
        basePowerPerMiner = 300; // 5000 workEnergyPerTick * 60 / 1000 = 300 kW
      } else if (material.machineType === "Oil Extractor") {
        basePowerPerMiner = 840; // 14000 workEnergyPerTick * 60 / 1000 = 840 kW
      } else if (material.machineType === "Advanced Mining Machine") {
        basePowerPerMiner = 630; // 高度採掘機の基本電力
      } else {
        basePowerPerMiner = 420; // 通常採掘機の基本電力
      }

      // 電力倍率を適用
      const powerPerMiner = basePowerPerMiner * material.powerMultiplier;
      const minersPower = material.minersNeeded * powerPerMiner;
      miningPower += minersPower;
    });
  }

  // 総消費電力 = 設備電力 + ソーター電力 + 採掘電力
  const totalConsumption = machinesPower + sortersPower + miningPower;

  return {
    totalConsumption,
    machinesPower,
    sortersPower,
    miningPower,
    dysonSpherePower,
  };
}

/**
 * 電力計算結果をフォーマット用の文字列に変換
 */
export function formatUnifiedPowerResult(result: UnifiedPowerResult) {
  return {
    totalConsumption: `${result.totalConsumption.toFixed(1)} kW`,
    machinesPower: `${result.machinesPower.toFixed(1)} kW`,
    sortersPower: `${result.sortersPower.toFixed(1)} kW`,
    miningPower: `${result.miningPower.toFixed(1)} kW`,
    dysonSpherePower: `${result.dysonSpherePower.toFixed(1)} kW`,
  };
}
