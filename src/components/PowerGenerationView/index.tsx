/**
 * 発電設備表示コンポーネント
 */

import { ItemIcon } from "@/components/ItemIcon";
import {
  FUEL_ITEMS,
  POWER_GENERATORS,
  TEMPLATE_POWER_GENERATORS,
} from "@/constants/powerGeneration";
import type { MiningCalculation } from "@/lib/miningCalculation";
import { calculatePowerGeneration } from "@/lib/powerGenerationCalculation";
import { calculateUnifiedPower } from "@/lib/unifiedPowerCalculation";
import { useGameDataStore } from "@/stores/gameDataStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { ICON_GLOW, NEON_GLOW } from "@/constants/theme";
import type { CalculationResult } from "@/types";
import type { PowerGeneratorType } from "@/types/power-generation";
import type { GameTemplate } from "@/types/settings/templates";
import { formatNumber, formatPower, formatRate } from "@/utils/format";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { setInternal } from "@/utils/history/recorder";

// Proliferator item IDs
const PROLIFERATOR_IDS: Record<string, number | null> = {
  none: null,
  mk1: 1141,
  mk2: 1142,
  mk3: 1143,
};

interface PowerGenerationViewProps {
  calculationResult: CalculationResult;
  miningCalculation?: MiningCalculation | null;
}

/**
 * 発電設備表示ビュー
 */
export function PowerGenerationView({
  calculationResult,
  miningCalculation,
}: PowerGenerationViewProps) {
  const { t } = useTranslation();
  const {
    settings,
    setPowerGenerationTemplate,
    setManualPowerGenerator,
    setManualPowerFuel,
    setPowerFuelProliferator,
  } = useSettingsStore();
  const data = useGameDataStore(state => state.data);
  const machines = data?.machines;
  const items = data?.items;

  // Track if this is a mounting effect to skip initial automatic change
  const isFirstRender = useRef(true);

  // 設備名を取得（言語に応じた名前を返す）
  const getGeneratorName = (machineId: number): string => {
    const machine = machines?.get(machineId);
    if (machine?.name) return machine.name;

    // フォールバック: POWER_GENERATORSから取得
    const generator = Object.values(POWER_GENERATORS).find(g => g.machineId === machineId);
    return generator?.machineName || `Machine ${machineId}`;
  };

  // 燃料名を取得（言語に応じた名前を返す）
  const getItemName = (itemId: number): string => {
    const item = items?.get(itemId);
    if (item?.name) return item.name;

    // フォールバック: FUEL_ITEMSから取得
    const fuel = Object.values(FUEL_ITEMS).find(f => f.itemId === itemId);
    return fuel?.itemName || `Item ${itemId}`;
  };
  // 総消費電力を取得 (kW) - unifiedPowerCalculationを使用
  const totalPowerConsumption = useMemo(() => {
    if (!calculationResult.rootNode) return 0;

    const powerResult = calculateUnifiedPower(
      calculationResult.rootNode,
      miningCalculation || undefined, // 採掘計算も含める
      settings,
      data || undefined
    );

    // 発電設備で供給する必要がある電力 = 設備電力 + ソーター電力 + 採掘電力
    return powerResult.totalConsumption;
  }, [calculationResult.rootNode, miningCalculation, settings, data]);

  // 発電設備テンプレートを取得（設定ストアから直接取得）
  const template = useSettingsStore(state => state.powerGenerationTemplate);
  const manualGenerator = useSettingsStore(state => state.manualPowerGenerator);
  const manualFuel = useSettingsStore(state => state.manualPowerFuel);
  const powerFuelProliferator = useSettingsStore(state => state.powerFuelProliferator);

  // 現在選択されている発電設備が人工恒星かどうかを判定
  const isArtificialStar = useMemo(() => {
    if (manualGenerator) {
      return POWER_GENERATORS[manualGenerator]?.type === "artificialStar";
    }
    // テンプレートから自動選択された場合の判定
    const templateGenerators = TEMPLATE_POWER_GENERATORS[template];
    if (templateGenerators && templateGenerators.length > 0) {
      const firstGenerator = POWER_GENERATORS[templateGenerators[0]];
      return firstGenerator?.type === "artificialStar";
    }
    return false;
  }, [manualGenerator, template]);

  // 発電設備が変更された時に増産剤のモードを自動更新
  useEffect(() => {
    // Skip on first render (this is a mount effect)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (powerFuelProliferator.type !== "none") {
      const correctMode = isArtificialStar ? "speed" : "production";
      if (powerFuelProliferator.mode !== correctMode) {
        // Set internal flag to prevent recording this automatic change
        setInternal(true);
        setPowerFuelProliferator(powerFuelProliferator.type, correctMode);
        // Clear internal flag after debounce delay
        setTimeout(() => setInternal(false), 600);
      }
    }
  }, [
    isArtificialStar,
    powerFuelProliferator.type,
    powerFuelProliferator.mode,
    setPowerFuelProliferator,
  ]);

  // 全発電設備リスト（テンプレート関係なく）
  const allGenerators = useMemo(() => {
    return Object.keys(POWER_GENERATORS) as PowerGeneratorType[];
  }, []);

  // 選択された発電設備に応じた利用可能な燃料リスト（全燃料から選択）
  const availableFuels = useMemo(() => {
    // 現在選択されている発電設備（手動選択 or 自動選択の結果）
    let currentGenerator: PowerGeneratorType | null = manualGenerator;
    if (!currentGenerator) {
      // 自動選択の場合はテンプレートから最も高出力の発電設備を取得
      const templateGenerators =
        TEMPLATE_POWER_GENERATORS[template] || TEMPLATE_POWER_GENERATORS.endGame;
      currentGenerator = templateGenerators[0];
    }

    const generator = POWER_GENERATORS[currentGenerator];

    if (!generator || generator.acceptedFuelTypes.length === 0) {
      return [];
    }

    const fuelType = generator.acceptedFuelTypes[0];

    // 全燃料から選択された発電設備の燃料タイプに合うものを抽出
    return Object.entries(FUEL_ITEMS)
      .filter(([, fuel]) => fuel.fuelType === fuelType)
      .map(([key, fuel]) => ({ key, ...fuel }));
  }, [template, manualGenerator]);

  // 発電設備を計算
  const powerGeneration = useMemo(() => {
    return calculatePowerGeneration(
      totalPowerConsumption,
      template,
      manualGenerator,
      manualFuel,
      powerFuelProliferator.speedBonus,
      powerFuelProliferator.productionBonus
    );
  }, [totalPowerConsumption, template, manualGenerator, manualFuel, powerFuelProliferator]);

  if (totalPowerConsumption <= 0) {
    return (
      <div className="text-center py-8 text-space-300">
        <p>{t("powerGeneration.noPowerRequired")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 発電設備テンプレート選択 */}
      <div className="hologram-card p-4 border border-neon-blue/30 rounded-lg bg-dark-800/50">
        <h3 className="text-sm font-medium text-neon-cyan mb-3">
          {t("powerGeneration.templateLabel")}
        </h3>
        <select
          data-testid="power-generation-template-select"
          value={template}
          onChange={e => setPowerGenerationTemplate(e.target.value as GameTemplate)}
          className="w-full px-3 py-2 border border-neon-blue/40 rounded-lg bg-dark-700/50 text-white text-sm focus:border-neon-blue focus:${ICON_GLOW.blue} transition-all"
          style={{
            backgroundColor: "rgba(30, 41, 59, 0.5)",
            color: "#FFFFFF",
          }}
        >
          <option value="default" style={{ backgroundColor: "#1E293B", color: "#FFFFFF" }}>
            {t("powerGeneration.templateDefault")}
          </option>
          <option value="earlyGame" style={{ backgroundColor: "#1E293B", color: "#FFFFFF" }}>
            {t("powerGeneration.templateEarlyGame")}
          </option>
          <option value="midGame" style={{ backgroundColor: "#1E293B", color: "#FFFFFF" }}>
            {t("powerGeneration.templateMidGame")}
          </option>
          <option value="lateGame" style={{ backgroundColor: "#1E293B", color: "#FFFFFF" }}>
            {t("powerGeneration.templateLateGame")}
          </option>
          <option value="endGame" style={{ backgroundColor: "#1E293B", color: "#FFFFFF" }}>
            {t("powerGeneration.templateEndGame")}
          </option>
        </select>
      </div>

      {/* 燃料の増産剤設定 */}
      <div className="hologram-card p-4 border border-neon-green/30 rounded-lg bg-dark-800/50">
        <h3 className="text-sm font-medium text-neon-cyan mb-3">
          {t("powerGeneration.proliferatorSettings")}
        </h3>

        <div className="space-y-4">
          {/* 増産剤タイプ選択 */}
          <div>
            <label className="block text-xs text-space-300 mb-2">{t("proliferatorType")}</label>
            <div className="grid grid-cols-4 gap-3">
              {(["none", "mk1", "mk2", "mk3"] as const).map(type => {
                const iconId = PROLIFERATOR_IDS[type];
                const getProliferatorLabel = (pType: string) => {
                  if (pType === "none") return t("none");
                  return t(`proliferator${pType.toUpperCase()}`);
                };
                return (
                  <button
                    key={type}
                    data-testid={`power-generation-proliferator-button-${type}`}
                    onClick={() => {
                      // 発電設備に応じて自動でモードを決定
                      const mode = isArtificialStar ? "speed" : "production";
                      setPowerFuelProliferator(type, mode);
                    }}
                    className={`
                      px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105
                      ${
                        powerFuelProliferator.type === type
                          ? "bg-neon-green/30 text-white border-neon-green ${NEON_GLOW.greenStrong},inset_0_0_20px_rgba(16,185,129,0.2) backdrop-blur-sm font-bold scale-105"
                          : "bg-dark-700/50 text-space-200 border-neon-green/20 hover:bg-neon-green/10 hover:border-neon-green/50 hover:text-neon-green"
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {iconId && <ItemIcon itemId={iconId} size={24} />}
                      <span className="text-xs leading-tight text-center">
                        {getProliferatorLabel(type)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 増産剤の効果説明 */}
          {powerFuelProliferator.type !== "none" && (
            <div className="p-3 bg-neon-green/10 border border-neon-green/30 rounded text-xs text-space-200">
              <div className="space-y-1">
                <div>
                  <span className="text-neon-green font-semibold">{t("speedBonus")}:</span>
                  <span className="ml-2">
                    +{(powerFuelProliferator.speedBonus * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-neon-green font-semibold">{t("productionBonus")}:</span>
                  <span className="ml-2">
                    +{(powerFuelProliferator.productionBonus * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-neon-green/20 text-yellow-200">
                  ℹ️{" "}
                  {isArtificialStar
                    ? t("powerGeneration.proliferatorEffectSpeed")
                    : t("powerGeneration.proliferatorEffectProduction")}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 発電設備と燃料の手動選択 */}
      <div className="hologram-card p-4 border border-neon-purple/30 rounded-lg bg-dark-800/50">
        <h3 className="text-sm font-medium text-neon-cyan mb-3">
          {t("powerGeneration.manualSelection")}
        </h3>

        <div className="space-y-4">
          {/* 発電設備選択 */}
          <div>
            <label className="block text-xs text-space-300 mb-2">
              {t("powerGeneration.generatorLabel")}
            </label>

            <div className="grid grid-cols-7 gap-2">
              {/* 自動選択ボタン */}
              <button
                data-testid="power-generation-generator-auto-button"
                onClick={() => {
                  setManualPowerGenerator(null);
                  // Fuel reset is internal change, skip recording
                  setInternal(true);
                  setManualPowerFuel(null);
                  setTimeout(() => setInternal(false), 600);
                }}
                className={`
                  px-1.5 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105
                  ${
                    manualGenerator === null
                      ? "bg-neon-purple/30 text-white border-neon-purple ${NEON_GLOW.purpleStrong},inset_0_0_20px_rgba(168,85,247,0.2) backdrop-blur-sm font-bold scale-105"
                      : "bg-dark-700/50 text-space-200 border-neon-purple/20 hover:bg-neon-purple/10 hover:border-neon-purple/50 hover:text-neon-purple"
                  }
                `}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl">🤖</span>
                  <span className="text-xs leading-tight text-center">
                    {t("powerGeneration.automatic")}
                  </span>
                </div>
              </button>

              {/* 各発電設備ボタン */}
              {allGenerators.map(generatorType => {
                const generator = POWER_GENERATORS[generatorType];
                const isSelected = manualGenerator === generatorType;

                return (
                  <button
                    key={generatorType}
                    data-testid={`power-generation-generator-button-${generatorType}`}
                    onClick={() => {
                      setManualPowerGenerator(generatorType);
                      // Fuel reset is internal change, skip recording
                      setInternal(true);
                      setManualPowerFuel(null);
                      setTimeout(() => setInternal(false), 600);
                    }}
                    className={`
                      px-1.5 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105
                      ${
                        isSelected
                          ? "bg-neon-purple/30 text-white border-neon-purple ${NEON_GLOW.purpleStrong},inset_0_0_20px_rgba(168,85,247,0.2) backdrop-blur-sm font-bold scale-105"
                          : "bg-dark-700/50 text-space-200 border-neon-purple/20 hover:bg-neon-purple/10 hover:border-neon-purple/50 hover:text-neon-purple"
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <ItemIcon itemId={generator.machineId} size={32} />
                      <span className="text-xs leading-tight text-center">
                        {getGeneratorName(generator.machineId)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 燃料選択（燃料が2種類以上ある場合のみ表示） */}
          {availableFuels.length > 1 && (
            <div>
              <label className="block text-xs text-space-300 mb-2">
                {t("powerGeneration.fuelLabel")}
              </label>

              <div className="grid grid-cols-8 gap-2">
                {/* 自動選択ボタン */}
                <button
                  data-testid="power-generation-fuel-auto-button"
                  onClick={() => setManualPowerFuel(null)}
                  className={`
                    px-1.5 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105
                    ${
                      manualFuel === null
                        ? "bg-neon-purple/30 text-white border-neon-purple ${NEON_GLOW.purpleStrong},inset_0_0_20px_rgba(168,85,247,0.2) backdrop-blur-sm font-bold scale-105"
                        : "bg-dark-700/50 text-space-200 border-neon-purple/20 hover:bg-neon-purple/10 hover:border-neon-purple/50 hover:text-neon-purple"
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl">🤖</span>
                    <span className="text-xs leading-tight text-center">
                      {t("powerGeneration.automatic")}
                    </span>
                  </div>
                </button>

                {/* 各燃料ボタン */}
                {availableFuels.map(fuel => {
                  const isSelected = manualFuel === fuel.key;

                  return (
                    <button
                      key={fuel.key}
                      data-testid={`power-generation-fuel-button-${fuel.key}`}
                      onClick={() => setManualPowerFuel(fuel.key)}
                      className={`
                        px-1.5 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105
                        ${
                          isSelected
                            ? "bg-neon-purple/30 text-white border-neon-purple ${NEON_GLOW.purpleStrong},inset_0_0_20px_rgba(168,85,247,0.2) backdrop-blur-sm font-bold scale-105"
                            : "bg-dark-700/50 text-space-200 border-neon-purple/20 hover:bg-neon-purple/10 hover:border-neon-purple/50 hover:text-neon-purple"
                        }
                      `}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <ItemIcon itemId={fuel.itemId} size={24} />
                        <span className="text-xs leading-tight text-center">
                          {getItemName(fuel.itemId)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 必要電力 */}
      <div
        data-testid="power-generation-required-power"
        className="hologram-card p-4 border border-neon-blue/30 rounded-lg bg-dark-800/50"
      >
        <h3 className="text-sm font-medium text-neon-cyan mb-2">
          {t("powerGeneration.requiredPower")}
        </h3>
        <p
          data-testid="power-generation-required-power-value"
          className="text-2xl font-bold text-white"
        >
          {formatPower(totalPowerConsumption)}
        </p>
      </div>

      {/* 発電設備リスト */}
      <div data-testid="power-generation-generators" className="space-y-3">
        <h3 className="text-sm font-medium text-neon-cyan">
          {t("powerGeneration.generatorAllocation")}
        </h3>

        {powerGeneration.generators.map((allocation, index) => (
          <div
            key={index}
            data-testid={`power-generation-generator-${allocation.generator.machineId}`}
            className="hologram-card p-4 border border-neon-blue/30 rounded-lg bg-dark-800/50 hover:bg-dark-700/50 transition-colors"
          >
            {/* 発電設備名 */}
            <div className="flex items-center gap-2 mb-3">
              <ItemIcon itemId={allocation.generator.machineId} size={32} />
              <h4 data-testid="power-generator-name" className="text-base font-semibold text-white">
                {getGeneratorName(allocation.generator.machineId)}
              </h4>
            </div>

            {/* 発電設備情報 */}
            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div>
                <span className="text-space-300">{t("powerGeneration.baseOutput")}:</span>
                <span className="ml-2 text-white font-medium">
                  {formatPower(allocation.generator.baseOutput)}
                </span>
              </div>
              <div>
                <span className="text-space-300">{t("powerGeneration.operatingRate")}:</span>
                <span className="ml-2 text-white font-medium">
                  {(allocation.generator.operatingRate * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-space-300">{t("powerGeneration.count")}:</span>
                <span data-testid="power-generator-count" className="ml-2 text-neon-cyan font-bold">
                  {allocation.count} {t("powerGeneration.units")}
                </span>
              </div>
              <div>
                <span className="text-space-300">{t("powerGeneration.totalOutput")}:</span>
                <span className="ml-2 text-white font-medium">
                  {formatPower(allocation.totalOutput)}
                </span>
              </div>
            </div>

            {/* 燃料情報 */}
            {allocation.fuel && (
              <div className="border-t border-neon-blue/20 pt-3 mt-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-space-300">{t("powerGeneration.fuel")}:</span>
                    <ItemIcon itemId={allocation.fuel.itemId} size={24} />
                    <span data-testid="power-fuel-name" className="text-white font-medium">
                      {getItemName(allocation.fuel.itemId)}
                    </span>
                  </div>
                  <div>
                    <span className="text-space-300">{t("powerGeneration.energyPerItem")}:</span>
                    <span className="ml-2 text-white font-medium">
                      {formatNumber(allocation.fuel.energyPerItem)} MJ
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-space-300">{t("powerGeneration.fuelConsumption")}:</span>
                    <span
                      data-testid="power-fuel-consumption"
                      className="ml-2 text-neon-cyan font-bold"
                    >
                      {formatRate(allocation.fuelConsumptionRate)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 注意書き（出力変動設備） */}
            {allocation.generator.isVariableOutput && (
              <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-200">
                ⚠️{" "}
                {t("powerGeneration.variableOutputWarning", {
                  name: getGeneratorName(allocation.generator.machineId),
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* サマリー */}
      <div
        data-testid="power-generation-summary"
        className="hologram-card p-4 border border-neon-cyan/50 rounded-lg bg-dark-800/50"
      >
        <h3 className="text-sm font-medium text-neon-cyan mb-3">{t("powerGeneration.summary")}</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-space-300">{t("powerGeneration.totalGenerators")}:</span>
            <span className="ml-2 text-white font-bold">
              {powerGeneration.totalGenerators} {t("powerGeneration.units")}
            </span>
          </div>
          {powerGeneration.totalFuelConsumption.size > 0 && (
            <div>
              <div className="text-space-300 mb-2">
                {t("powerGeneration.totalFuelConsumption")}:
              </div>
              {Array.from(powerGeneration.totalFuelConsumption.entries()).map(([itemId, rate]) => {
                return (
                  <div key={itemId} className="flex items-center gap-2 ml-2">
                    <ItemIcon itemId={itemId} size={24} />
                    <span className="text-white font-bold">
                      {getItemName(itemId)}: {formatRate(rate)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
