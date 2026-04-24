import { useEffect } from "react";
import { useSettingsStore } from "../../stores/settingsStore";
import { ICONS } from "../../constants/icons";
import { useTranslation } from "react-i18next";
import type { ConveyorBeltTier, SorterTier } from "../../types/settings";
import { ItemIcon } from "../ItemIcon";
import { createLogger } from "../../utils/logger";
import { cn } from "../../utils/classNames";
import { CARD_GLOW, NEON_GLOW } from "../../constants/theme";

const logger = createLogger("ConveyorBeltSettings");

const CONVEYOR_BELT_OPTIONS = [
  {
    tier: "mk1" as ConveyorBeltTier,
    label: "Mk.I",
    speed: "6/s",
    color: "yellow",
    iconId: ICONS.belt.mk1,
  },
  {
    tier: "mk2" as ConveyorBeltTier,
    label: "Mk.II",
    speed: "12/s",
    color: "blue",
    iconId: ICONS.belt.mk2,
  },
  {
    tier: "mk3" as ConveyorBeltTier,
    label: "Mk.III",
    speed: "30/s",
    color: "purple",
    iconId: ICONS.belt.mk3,
  },
];

const SORTER_OPTIONS = [
  {
    tier: "mk1" as SorterTier,
    labelKey: "sorterMkI",
    power: "18kW",
    color: "yellow",
    iconId: ICONS.sorter.mk1,
  },
  {
    tier: "mk2" as SorterTier,
    labelKey: "sorterMkII",
    power: "36kW",
    color: "blue",
    iconId: ICONS.sorter.mk2,
  },
  {
    tier: "mk3" as SorterTier,
    labelKey: "sorterMkIII",
    power: "72kW",
    color: "purple",
    iconId: ICONS.sorter.mk3,
  },
  {
    tier: "pile" as SorterTier,
    labelKey: "pilingSorter",
    power: "144kW",
    color: "green",
    iconId: ICONS.sorter.pile,
  },
];

export function ConveyorBeltSettings() {
  const { t } = useTranslation();
  const { settings, setConveyorBelt, setSorter } = useSettingsStore();
  const { conveyorBelt, sorter } = settings;

  // Ensure stackCount is initialized on component mount
  useEffect(() => {
    if (
      typeof conveyorBelt.stackCount !== "number" ||
      conveyorBelt.stackCount < 1 ||
      conveyorBelt.stackCount > 4
    ) {
      setConveyorBelt(conveyorBelt.tier, 1);
    }
  }, [conveyorBelt.stackCount, conveyorBelt.tier, setConveyorBelt]);

  const handleStackCountChange = (count: number) => {
    setConveyorBelt(conveyorBelt.tier, count);
  };

  // Calculate total throughput (items/second) with null checks to prevent NaN
  const speed = typeof conveyorBelt.speed === "number" ? conveyorBelt.speed : 0;
  const stackCount = typeof conveyorBelt.stackCount === "number" ? conveyorBelt.stackCount : 1;
  const totalSpeed = speed * stackCount;

  // Debug: Log values if they're invalid
  if (typeof conveyorBelt.speed !== "number" || typeof conveyorBelt.stackCount !== "number") {
    logger.warn("Invalid values detected", {
      speed: conveyorBelt.speed,
      stackCount: conveyorBelt.stackCount,
      conveyorBelt,
    });
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-space-200">{t("selectConveyorBeltDesc")}</div>

      {/* Belt Tier Selection */}
      <div>
        <label className="block text-sm font-medium text-space-100 mb-2">{t("beltTier")}</label>
        <div className="grid grid-cols-3 gap-2">
          {CONVEYOR_BELT_OPTIONS.map(option => (
            <button
              key={option.tier}
              data-testid={`conveyor-belt-button-${option.tier}`}
              onClick={() => setConveyorBelt(option.tier, conveyorBelt.stackCount)}
              aria-pressed={conveyorBelt.tier === option.tier}
              className={cn(
                "relative px-2 py-3 text-xs font-medium rounded-md border transition-colors",
                conveyorBelt.tier === option.tier &&
                  option.color === "yellow" &&
                  cn(
                    "bg-primary-900/55 text-white border-primary-300 font-semibold ring-1 ring-primary-300/70",
                    NEON_GLOW.yellowStrong
                  ),
                conveyorBelt.tier === option.tier &&
                  option.color === "blue" &&
                  cn(
                    "bg-primary-900/55 text-white border-primary-300 font-semibold ring-1 ring-primary-300/70",
                    NEON_GLOW.blueStrong
                  ),
                conveyorBelt.tier === option.tier &&
                  option.color === "purple" &&
                  cn(
                    "bg-primary-900/55 text-white border-primary-300 font-semibold ring-1 ring-primary-300/70",
                    NEON_GLOW.purpleStrong
                  ),
                conveyorBelt.tier !== option.tier &&
                  "bg-dark-700/60 text-space-200 border-space-700 hover:bg-dark-600 hover:border-space-500 hover:text-space-100"
              )}
            >
              {conveyorBelt.tier === option.tier && (
                <span
                  className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-sm bg-primary-300 text-[11px] font-bold leading-none text-dark-900"
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}
              <div className="flex flex-col items-center gap-1">
                <ItemIcon itemId={option.iconId} size={28} />
                <span className="font-semibold text-[10px]">{option.label}</span>
                <span className="text-[10px] font-medium opacity-80">{option.speed}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stack Count Selection */}
      <div>
        <label className="block text-sm font-medium text-space-100 mb-2">{t("stackCount")}</label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(count => (
            <button
              key={count}
              data-testid={`conveyor-belt-stack-button-${count}`}
              onClick={() => handleStackCountChange(count)}
              aria-pressed={conveyorBelt.stackCount === count}
              className={cn(
                "relative px-3 py-2 text-sm font-medium rounded-md border transition-colors",
                conveyorBelt.stackCount === count &&
                  cn(
                    "bg-primary-900/55 text-white border-primary-300 font-semibold ring-1 ring-primary-300/70",
                    NEON_GLOW.greenStrong
                  ),
                conveyorBelt.stackCount !== count &&
                  "bg-dark-700/60 text-space-200 border-space-700 hover:bg-dark-600 hover:border-space-500 hover:text-space-100"
              )}
            >
              {conveyorBelt.stackCount === count && (
                <span className="absolute top-1 right-1 text-primary-200" aria-hidden="true">
                  ✓
                </span>
              )}
              ×{count}
            </button>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "bg-dark-800/60 rounded-md p-3 border border-space-700/70",
          CARD_GLOW.cyanLight
        )}
      >
        <div className="text-xs font-semibold text-space-100 mb-1">{t("totalBeltSpeed")}</div>
        <div className="text-sm text-white">
          <span className="font-semibold text-primary-200">{totalSpeed}</span> {t("itemsPerSecond")}
          {stackCount > 1 && (
            <span className="text-xs ml-2 text-space-200">
              ({speed}/s × {stackCount})
            </span>
          )}
        </div>
      </div>

      {/* Sorter Rank Selection */}
      <div>
        <label className="block text-sm font-medium text-space-100 mb-2">{t("sorterRank")}</label>
        <div className="grid grid-cols-4 gap-2">
          {SORTER_OPTIONS.map(option => (
            <button
              key={option.tier}
              data-testid={`sorter-button-${option.tier}`}
              onClick={() => setSorter(option.tier)}
              aria-pressed={sorter.tier === option.tier}
              className={cn(
                "relative px-2 py-3 text-xs font-medium rounded-md border transition-colors",
                sorter.tier === option.tier &&
                  option.color === "yellow" &&
                  cn(
                    "bg-primary-900/55 text-white border-primary-300 font-semibold ring-1 ring-primary-300/70",
                    NEON_GLOW.yellowStrong
                  ),
                sorter.tier === option.tier &&
                  option.color === "blue" &&
                  cn(
                    "bg-primary-900/55 text-white border-primary-300 font-semibold ring-1 ring-primary-300/70",
                    NEON_GLOW.blueStrong
                  ),
                sorter.tier === option.tier &&
                  option.color === "purple" &&
                  cn(
                    "bg-primary-900/55 text-white border-primary-300 font-semibold ring-1 ring-primary-300/70",
                    NEON_GLOW.purpleStrong
                  ),
                sorter.tier === option.tier &&
                  option.color === "green" &&
                  cn(
                    "bg-primary-900/55 text-white border-primary-300 font-semibold ring-1 ring-primary-300/70",
                    NEON_GLOW.greenStrong
                  ),
                sorter.tier !== option.tier &&
                  "bg-dark-700/60 text-space-200 border-space-700 hover:bg-dark-600 hover:border-space-500 hover:text-space-100"
              )}
            >
              {sorter.tier === option.tier && (
                <span
                  className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-sm bg-primary-300 text-[11px] font-bold leading-none text-dark-900"
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}
              <div className="flex flex-col items-center gap-1">
                <ItemIcon itemId={option.iconId} size={24} />
                <span className="font-semibold text-[10px]">{t(option.labelKey)}</span>
                <span className="text-[10px] font-medium opacity-80">{option.power}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
