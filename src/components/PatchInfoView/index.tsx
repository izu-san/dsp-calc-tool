import * as Select from "@radix-ui/react-select";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { loadVersionInfo, type VersionInfo } from "../../utils/versionInfo";
import { loadGameDataVersion } from "../../lib/parser";
import { useGameDataStore } from "../../stores/gameDataStore";
import { calculateRecipeDiff, calculateItemDiff, calculateMachineDiff } from "../../lib/patchDiff";
import type { RecipeDiff, ItemDiff, MachineDiff } from "../../types/patch-diff";

export function PatchInfoView() {
  const { t } = useTranslation();
  const currentGameData = useGameDataStore(state => state.data);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipeDiffs, setRecipeDiffs] = useState<RecipeDiff[]>([]);
  const [itemDiffs, setItemDiffs] = useState<ItemDiff[]>([]);
  const [machineDiffs, setMachineDiffs] = useState<MachineDiff[]>([]);
  const [activeDiffTab, setActiveDiffTab] = useState<"recipes" | "items" | "machines">("recipes");

  useEffect(() => {
    loadVersionInfo()
      .then(info => {
        setVersionInfo(info);
      })
      .catch(() => {
        setError(t("versionInfoNotAvailable"));
      });
  }, [t]);

  const handleVersionChange = async (version: string) => {
    if (version === versionInfo?.primaryVersion) {
      setSelectedVersion(null);
      setRecipeDiffs([]);
      setItemDiffs([]);
      setMachineDiffs([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const oldData = await loadGameDataVersion(version);
      setSelectedVersion(version);

      if (currentGameData) {
        const recipeDiff = calculateRecipeDiff(oldData, currentGameData);
        const itemDiff = calculateItemDiff(oldData, currentGameData);
        const machineDiff = calculateMachineDiff(oldData, currentGameData);

        setRecipeDiffs(recipeDiff);
        setItemDiffs(itemDiff);
        setMachineDiffs(machineDiff);
      }
    } catch (err) {
      setError((err as Error).message || t("failedToLoadVersionData"));
    } finally {
      setLoading(false);
    }
  };

  const recipeDiffSummary = {
    added: recipeDiffs.filter(d => d.changes.type === "added").length,
    removed: recipeDiffs.filter(d => d.changes.type === "removed").length,
    modified: recipeDiffs.filter(d => d.changes.type === "modified").length,
  };

  const itemDiffSummary = {
    added: itemDiffs.filter(d => d.changes.type === "added").length,
    removed: itemDiffs.filter(d => d.changes.type === "removed").length,
    modified: itemDiffs.filter(d => d.changes.type === "modified").length,
  };

  const machineDiffSummary = {
    added: machineDiffs.filter(d => d.changes.type === "added").length,
    removed: machineDiffs.filter(d => d.changes.type === "removed").length,
    modified: machineDiffs.filter(d => d.changes.type === "modified").length,
  };

  const totalSummary = {
    recipes: recipeDiffSummary.added + recipeDiffSummary.removed + recipeDiffSummary.modified,
    items: itemDiffSummary.added + itemDiffSummary.removed + itemDiffSummary.modified,
    machines: machineDiffSummary.added + machineDiffSummary.removed + machineDiffSummary.modified,
  };

  return (
    <div className="space-y-4" data-testid="patch-info-view">
      <h3 className="text-xl font-bold text-neon-purple mb-4">{t("patchDiff")}</h3>

      {/* Version Selector */}
      <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
        <label className="block text-sm font-medium text-white mb-2">{t("selectVersion")}</label>
        {versionInfo ? (
          <Select.Root
            value={selectedVersion || versionInfo.primaryVersion}
            onValueChange={handleVersionChange}
          >
            <Select.Trigger className="w-full px-4 py-2 bg-dark-700/50 border border-neon-purple/40 rounded-lg text-white hover:border-neon-purple/70 focus:border-neon-purple focus:${ICON_GLOW.purple} transition-all">
              <Select.Value />
              <Select.Icon className="ml-auto">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content
                className="bg-dark-700 border border-neon-purple/40 rounded-lg shadow-lg overflow-hidden min-w-[var(--radix-select-trigger-width)]"
                position="popper"
                sideOffset={5}
                style={{
                  zIndex: 100001,
                  backgroundColor: "#1a1a2e",
                  width: "var(--radix-select-trigger-width)",
                  maxWidth: "var(--radix-select-trigger-width)",
                }}
              >
                <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-dark-800 cursor-default text-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </Select.ScrollUpButton>

                <Select.Viewport className="p-1 bg-dark-700">
                  {versionInfo.gameVersions.map(version => (
                    <Select.Item
                      key={version.version}
                      value={version.version}
                      className="px-3 py-2 rounded cursor-pointer text-white bg-dark-700 hover:bg-dark-600 hover:text-neon-purple hover:${ICON_GLOW.purple} focus:bg-dark-600 focus:outline-none data-[highlighted]:bg-dark-600 data-[highlighted]:text-neon-purple data-[highlighted]:${ICON_GLOW.purple} transition-all duration-200"
                    >
                      <Select.ItemText className="text-white">
                        <div className="flex items-center justify-between">
                          <span className="text-white">{version.version}</span>
                          {version.version === versionInfo.primaryVersion && (
                            <span className="px-2 py-0.5 bg-green-600/30 border border-green-600/50 text-green-400 rounded text-xs ml-2">
                              {t("current")}
                            </span>
                          )}
                        </div>
                      </Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>

                <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-dark-800 cursor-default text-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </Select.ScrollDownButton>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        ) : (
          <div className="text-space-300">{t("loadingGameData")}</div>
        )}
      </div>

      {loading && (
        <div className="text-center py-8 text-space-300">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple mx-auto"></div>
          <p className="mt-4">{t("loadingGameData")}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-600/50 text-red-400 rounded-lg p-4">
          {error}
        </div>
      )}

      {selectedVersion && !loading && !error && (
        <>
          {/* Summary */}
          <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4 border border-neon-purple/30">
            <h4 className="text-lg font-semibold text-white mb-3">{t("diffSummary")}</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-dark-700/50 rounded-lg p-3">
                <div className="text-sm text-space-300 mb-1">{t("recipes")}</div>
                <div className="text-2xl font-bold text-white">{totalSummary.recipes}</div>
                <div className="text-xs text-space-400 mt-1">
                  +{recipeDiffSummary.added} / -{recipeDiffSummary.removed} / ~
                  {recipeDiffSummary.modified}
                </div>
              </div>
              <div className="bg-dark-700/50 rounded-lg p-3">
                <div className="text-sm text-space-300 mb-1">{t("items")}</div>
                <div className="text-2xl font-bold text-white">{totalSummary.items}</div>
                <div className="text-xs text-space-400 mt-1">
                  +{itemDiffSummary.added} / -{itemDiffSummary.removed} / ~
                  {itemDiffSummary.modified}
                </div>
              </div>
              <div className="bg-dark-700/50 rounded-lg p-3">
                <div className="text-sm text-space-300 mb-1">{t("machines")}</div>
                <div className="text-2xl font-bold text-white">{totalSummary.machines}</div>
                <div className="text-xs text-space-400 mt-1">
                  +{machineDiffSummary.added} / -{machineDiffSummary.removed} / ~
                  {machineDiffSummary.modified}
                </div>
              </div>
            </div>
          </div>

          {/* Diff Tabs */}
          <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg border border-neon-purple/30">
            <div className="flex border-b border-neon-purple/30">
              <button
                onClick={() => setActiveDiffTab("recipes")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeDiffTab === "recipes"
                    ? "text-white border-b-2 border-neon-purple"
                    : "text-space-300 hover:text-white"
                }`}
              >
                {t("recipes")} ({totalSummary.recipes})
              </button>
              <button
                onClick={() => setActiveDiffTab("items")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeDiffTab === "items"
                    ? "text-white border-b-2 border-neon-purple"
                    : "text-space-300 hover:text-white"
                }`}
              >
                {t("items")} ({totalSummary.items})
              </button>
              <button
                onClick={() => setActiveDiffTab("machines")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeDiffTab === "machines"
                    ? "text-white border-b-2 border-neon-purple"
                    : "text-space-300 hover:text-white"
                }`}
              >
                {t("machines")} ({totalSummary.machines})
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              {activeDiffTab === "recipes" && <RecipeDiffList diffs={recipeDiffs} />}
              {activeDiffTab === "items" && <ItemDiffList diffs={itemDiffs} />}
              {activeDiffTab === "machines" && <MachineDiffList diffs={machineDiffs} />}
            </div>
          </div>
        </>
      )}

      {!selectedVersion && !loading && (
        <div className="text-center py-8 text-space-300">
          <p>{t("selectVersionToCompare")}</p>
        </div>
      )}
    </div>
  );
}

function RecipeDiffList({ diffs }: { diffs: RecipeDiff[] }) {
  const { t } = useTranslation();

  if (diffs.length === 0) {
    return <div className="text-space-300 text-center py-4">{t("noDiffFound")}</div>;
  }

  return (
    <div className="space-y-2">
      {diffs.map(diff => (
        <RecipeDiffDetail key={diff.recipeSID} diff={diff} />
      ))}
    </div>
  );
}

function RecipeDiffDetail({ diff }: { diff: RecipeDiff }) {
  const { t } = useTranslation();

  return (
    <div className="bg-dark-700/50 rounded-lg p-3 border border-neon-purple/20">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-white">{diff.recipeName}</span>
        <span className="text-xs text-space-400">SID: {diff.recipeSID}</span>
        {diff.changes.type === "added" && (
          <span className="px-2 py-0.5 bg-green-600/30 border border-green-600/50 text-green-400 rounded text-xs">
            {t("added")}
          </span>
        )}
        {diff.changes.type === "removed" && (
          <span className="px-2 py-0.5 bg-red-600/30 border border-red-600/50 text-red-400 rounded text-xs">
            {t("removed")}
          </span>
        )}
        {diff.changes.type === "modified" && (
          <span className="px-2 py-0.5 bg-yellow-600/30 border border-yellow-600/50 text-yellow-400 rounded text-xs">
            {t("modified")}
          </span>
        )}
      </div>

      {diff.changes.type === "modified" && (
        <div className="mt-2 space-y-1 text-sm">
          {diff.changes.itemsDiff && (
            <div>
              <span className="text-space-300">{t("inputItems")}:</span>
              {diff.changes.itemsDiff.added.length > 0 && (
                <div className="ml-4 text-green-400">
                  +{" "}
                  {diff.changes.itemsDiff.added
                    .map(item => `${item.name} x${item.count}`)
                    .join(", ")}
                </div>
              )}
              {diff.changes.itemsDiff.removed.length > 0 && (
                <div className="ml-4 text-red-400">
                  -{" "}
                  {diff.changes.itemsDiff.removed
                    .map(item => `${item.name} x${item.count}`)
                    .join(", ")}
                </div>
              )}
              {diff.changes.itemsDiff.modified.length > 0 && (
                <div className="ml-4 text-yellow-400">
                  ~{" "}
                  {diff.changes.itemsDiff.modified
                    .map(m => `${m.item.name} ${m.oldCount} → ${m.newCount}`)
                    .join(", ")}
                </div>
              )}
            </div>
          )}
          {diff.changes.resultsDiff && (
            <div>
              <span className="text-space-300">{t("outputItems")}:</span>
              {diff.changes.resultsDiff.added.length > 0 && (
                <div className="ml-4 text-green-400">
                  +{" "}
                  {diff.changes.resultsDiff.added
                    .map(item => `${item.name} x${item.count}`)
                    .join(", ")}
                </div>
              )}
              {diff.changes.resultsDiff.removed.length > 0 && (
                <div className="ml-4 text-red-400">
                  -{" "}
                  {diff.changes.resultsDiff.removed
                    .map(item => `${item.name} x${item.count}`)
                    .join(", ")}
                </div>
              )}
              {diff.changes.resultsDiff.modified.length > 0 && (
                <div className="ml-4 text-yellow-400">
                  ~{" "}
                  {diff.changes.resultsDiff.modified
                    .map(m => `${m.item.name} ${m.oldCount} → ${m.newCount}`)
                    .join(", ")}
                </div>
              )}
            </div>
          )}
          {diff.changes.timeSpendDiff && (
            <div className="text-space-300">
              {t("time")}: {diff.changes.timeSpendDiff.old} → {diff.changes.timeSpendDiff.new} ticks
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ItemDiffList({ diffs }: { diffs: ItemDiff[] }) {
  const { t } = useTranslation();

  if (diffs.length === 0) {
    return <div className="text-space-300 text-center py-4">{t("noDiffFound")}</div>;
  }

  return (
    <div className="space-y-2">
      {diffs.map(diff => (
        <div
          key={diff.itemId}
          className="bg-dark-700/50 rounded-lg p-3 border border-neon-purple/20"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{diff.itemName}</span>
            <span className="text-xs text-space-400">ID: {diff.itemId}</span>
            {diff.changes.type === "added" && (
              <span className="px-2 py-0.5 bg-green-600/30 border border-green-600/50 text-green-400 rounded text-xs">
                {t("added")}
              </span>
            )}
            {diff.changes.type === "removed" && (
              <span className="px-2 py-0.5 bg-red-600/30 border border-red-600/50 text-red-400 rounded text-xs">
                {t("removed")}
              </span>
            )}
            {diff.changes.type === "modified" && diff.changes.attributeChanges && (
              <span className="px-2 py-0.5 bg-yellow-600/30 border border-yellow-600/50 text-yellow-400 rounded text-xs">
                {t("modified")}
              </span>
            )}
          </div>
          {diff.changes.attributeChanges && (
            <div className="mt-2 text-sm text-space-300">
              {Object.entries(diff.changes.attributeChanges).map(([key, change]) => (
                <div key={key}>
                  {key}: {change.old} → {change.new}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MachineDiffList({ diffs }: { diffs: MachineDiff[] }) {
  const { t } = useTranslation();

  if (diffs.length === 0) {
    return <div className="text-space-300 text-center py-4">{t("noDiffFound")}</div>;
  }

  return (
    <div className="space-y-2">
      {diffs.map(diff => (
        <div
          key={diff.machineId}
          className="bg-dark-700/50 rounded-lg p-3 border border-neon-purple/20"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{diff.machineName}</span>
            <span className="text-xs text-space-400">ID: {diff.machineId}</span>
            {diff.changes.type === "added" && (
              <span className="px-2 py-0.5 bg-green-600/30 border border-green-600/50 text-green-400 rounded text-xs">
                {t("added")}
              </span>
            )}
            {diff.changes.type === "removed" && (
              <span className="px-2 py-0.5 bg-red-600/30 border border-red-600/50 text-red-400 rounded text-xs">
                {t("removed")}
              </span>
            )}
            {diff.changes.type === "modified" && diff.changes.attributeChanges && (
              <span className="px-2 py-0.5 bg-yellow-600/30 border border-yellow-600/50 text-yellow-400 rounded text-xs">
                {t("modified")}
              </span>
            )}
          </div>
          {diff.changes.attributeChanges && (
            <div className="mt-2 text-sm text-space-300">
              {Object.entries(diff.changes.attributeChanges).map(([key, change]) => (
                <div key={key}>
                  {key}: {change.old} → {change.new}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
