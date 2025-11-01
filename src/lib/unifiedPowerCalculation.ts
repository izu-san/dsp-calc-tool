import { ICONS } from "../constants/icons";
import type { RecipeTreeNode } from "../types/calculation";
import type { GameData } from "../types/game-data";
import type { GlobalSettings } from "../types/settings";
import type { MiningCalculation } from "./miningCalculation";

/**
 * 電力消費の詳細内訳
 */
export interface PowerConsumption {
  machineId: number;
  machineName: string;
  machineCount: number;
  powerPerMachine: number; // kW
  totalPower: number; // kW
  percentage: number;
}

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
  /** 電力消費の詳細内訳 */
  breakdown: PowerConsumption[];
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
 * @param settings グローバル設定（オプション）
 * @param gameData ゲームデータ（オプション）
 * @returns 統一された電力計算結果
 */
export function calculateUnifiedPower(
  rootNode: RecipeTreeNode,
  miningCalculation?: MiningCalculation,
  settings?: GlobalSettings,
  gameData?: GameData
): UnifiedPowerResult {
  let machinesPower = 0;
  let sortersPower = 0;
  let dysonSpherePower = 0;

  // 電力内訳用のマップ
  const powerMap = new Map<number, { name: string; count: number; powerPerMachine: number }>();
  let totalSorterPower = 0;
  let totalSorterCount = 0;

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
      totalSorterPower += node.power.sorters;

      // ダイソンスフィア電力も記録（参考用）
      dysonSpherePower += node.power.dysonSphere || 0;

      // ソーター数を計算（machineCount > 0の場合のみ）
      if (node.recipe && node.machineCount > 0) {
        const inputItems = node.recipe.Items?.length || 0;
        const outputItems = node.recipe.Results?.length || 0;
        const sortersPerMachine = inputItems + outputItems;
        totalSorterCount += Math.ceil(node.machineCount) * sortersPerMachine;
      }
    } else {
      // 通常の設備：設備電力とソーター電力をカウント
      machinesPower += node.power.machines;
      sortersPower += node.power.sorters;
      totalSorterPower += node.power.sorters;

      // ダイソンスフィア電力も記録（参考用）
      dysonSpherePower += node.power.dysonSphere || 0;

      // 設備の電力内訳を記録（machineCount > 0の場合のみ）
      if (node.machine && node.machineCount > 0) {
        const machineId = node.machine.id;
        const machineName = node.machine.name || "Unknown Machine";
        const machineCount = node.machineCount;
        const powerPerMachine = node.power.machines / machineCount;

        if (powerMap.has(machineId)) {
          const existing = powerMap.get(machineId)!;
          existing.count += machineCount;
          existing.powerPerMachine = Math.max(existing.powerPerMachine, powerPerMachine);
        } else {
          powerMap.set(machineId, {
            name: machineName,
            count: machineCount,
            powerPerMachine,
          });
        }
      }

      // ソーター数を計算（machineCount > 0の場合のみ）
      if (node.recipe && node.machineCount > 0) {
        const inputItems = node.recipe.Items?.length || 0;
        const outputItems = node.recipe.Results?.length || 0;
        const sortersPerMachine = inputItems + outputItems;
        totalSorterCount += Math.ceil(node.machineCount) * sortersPerMachine;
      }
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
  const miningMachineGroups = new Map<
    string,
    { count: number; powerPerMachine: number; machineName: string; machineId: number }
  >();

  if (miningCalculation) {
    miningCalculation.rawMaterials.forEach(material => {
      if (material.orbitCollectorsNeeded) {
        // 軌道採集器は電力消費しない
        return;
      }

      // 採掘機の種類に応じた基本電力
      let basePowerPerMiner: number;
      let machineId: number;

      if (material.machineType === "Water Pump") {
        basePowerPerMiner = 300; // 5000 workEnergyPerTick * 60 / 1000 = 300 kW
        machineId = 2306; // Water Pump ID
      } else if (material.machineType === "Oil Extractor") {
        basePowerPerMiner = 840; // 14000 workEnergyPerTick * 60 / 1000 = 840 kW
        machineId = 2307; // Oil Extractor ID
      } else if (material.machineType === "Advanced Mining Machine") {
        basePowerPerMiner = 630; // 高度採掘機の基本電力
        machineId = 2316; // Advanced Mining Machine ID
      } else {
        basePowerPerMiner = 420; // 通常採掘機の基本電力
        machineId = 2301; // Mining Machine ID
      }

      const powerPerMiner = basePowerPerMiner * material.powerMultiplier;
      const minersPower = material.minersNeeded * powerPerMiner;
      miningPower += minersPower;

      // 採掘機の内訳を記録
      const key = `${material.machineType}-${material.workSpeedMultiplier}%`;
      if (miningMachineGroups.has(key)) {
        const existing = miningMachineGroups.get(key)!;
        existing.count += material.minersNeeded;
      } else {
        miningMachineGroups.set(key, {
          count: material.minersNeeded,
          powerPerMachine: powerPerMiner,
          machineName: `${material.machineType} (${material.workSpeedMultiplier}%)`,
          machineId,
        });
      }
    });
  }

  // 電力内訳の配列を作成
  const breakdown: PowerConsumption[] = [];

  // 設備の電力内訳を追加
  powerMap.forEach((data, machineId) => {
    const total = data.count * data.powerPerMachine;
    breakdown.push({
      machineId,
      machineName: data.name,
      machineCount: data.count,
      powerPerMachine: data.powerPerMachine,
      totalPower: total,
      percentage: 0, // 後で計算
    });
  });

  // ソーターの電力内訳を追加
  if (totalSorterPower > 0) {
    const powerPerSorter = totalSorterCount > 0 ? totalSorterPower / totalSorterCount : 0;
    const sorterTier = settings?.sorter.tier || "mk1";
    const sorterIconId = ICONS.sorter[sorterTier];

    // ゲームデータからソーター名を取得
    let sorterName = "ソーター"; // fallback
    if (gameData?.machines) {
      const sorterMachine = gameData.machines.get(sorterIconId);
      if (sorterMachine?.name) {
        sorterName = sorterMachine.name;
      }
    }

    breakdown.push({
      machineId: sorterIconId,
      machineName: sorterName,
      machineCount: totalSorterCount,
      powerPerMachine: powerPerSorter,
      totalPower: totalSorterPower,
      percentage: 0, // 後で計算
    });
  }

  // 採掘機の電力内訳を追加
  miningMachineGroups.forEach(data => {
    const totalPower = data.count * data.powerPerMachine;

    // ゲームデータから採掘機名を取得
    const baseMachineName = gameData?.machines.get(data.machineId)?.name || data.machineName;

    // 高度採掘機の場合は作業速度を表示（100%以外）
    let displayMachineName = baseMachineName;
    if (data.machineName.includes("Advanced")) {
      const workSpeedMatch = data.machineName.match(/\((\d+)%\)/);
      if (workSpeedMatch && workSpeedMatch[1] !== "100") {
        displayMachineName = `${baseMachineName} (${workSpeedMatch[1]}%)`;
      }
    } else if (
      data.machineName.includes("Water Pump") ||
      data.machineName.includes("Oil Extractor")
    ) {
      // 液体採掘設備は作業速度を表示しない（常に100%）
      displayMachineName = baseMachineName;
    }

    breakdown.push({
      machineId: data.machineId,
      machineName: displayMachineName,
      machineCount: data.count,
      powerPerMachine: data.powerPerMachine,
      totalPower,
      percentage: 0, // 後で計算
    });
  });

  // 総消費電力 = 設備電力 + ソーター電力 + 採掘電力
  const totalConsumption = machinesPower + sortersPower + miningPower;

  // パーセンテージを計算してソート
  breakdown.forEach(item => {
    item.percentage = totalConsumption > 0 ? (item.totalPower / totalConsumption) * 100 : 0;
  });

  breakdown.sort((a, b) => b.totalPower - a.totalPower);

  return {
    totalConsumption,
    machinesPower,
    sortersPower,
    miningPower,
    dysonSpherePower,
    breakdown,
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
    breakdown: result.breakdown.map(item => ({
      ...item,
      powerPerMachine: `${item.powerPerMachine.toFixed(1)} kW`,
      totalPower: `${item.totalPower.toFixed(1)} kW`,
      percentage: `${item.percentage.toFixed(1)}%`,
    })),
  };
}
