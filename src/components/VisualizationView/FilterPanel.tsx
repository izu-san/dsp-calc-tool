import { useTranslation } from "react-i18next";

type MaterialFilterKey = "raw-material" | "intermediate" | "final-product";

interface FilterPanelProps {
  materialVisibility: Record<MaterialFilterKey, boolean>;
  onMaterialVisibilityChange: (key: MaterialFilterKey, value: boolean) => void;
  onReset: () => void;
}

export function FilterPanel({
  materialVisibility,
  onMaterialVisibilityChange,
  onReset,
}: FilterPanelProps) {
  const { t } = useTranslation();

  const materialOptions: Array<{ key: MaterialFilterKey; label: string }> = [
    { key: "raw-material", label: t("visualization.filters.rawMaterials") },
    { key: "intermediate", label: t("visualization.filters.intermediates") },
    { key: "final-product", label: t("visualization.filters.finalProducts") },
  ];

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between bg-dark-700/60 border border-neon-blue/20 rounded-lg p-4">
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide text-space-300">
          {t("visualization.filters.materialTypes")}
        </span>
        <div className="flex flex-wrap gap-3">
          {materialOptions.map(option => (
            <label
              key={option.key}
              className="inline-flex items-center gap-2 text-sm text-space-100"
            >
              <input
                type="checkbox"
                className="accent-neon-blue"
                checked={materialVisibility[option.key]}
                onChange={event => onMaterialVisibilityChange(option.key, event.target.checked)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onReset}
          className="px-3 py-2 text-sm font-medium rounded border border-neon-blue/40 text-neon-cyan hover:bg-neon-blue/10 transition"
        >
          {t("visualization.filters.reset")}
        </button>
      </div>
    </div>
  );
}
