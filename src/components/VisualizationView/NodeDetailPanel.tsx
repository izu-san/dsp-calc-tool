import { useTranslation } from "react-i18next";
import type { SankeyLinkDatum, SankeyNodeDatum } from "@/lib/visualization";
import { formatBuildingCount, formatNumber, formatPower, formatRate } from "@/utils/format";
import { ItemIcon } from "@/components/ItemIcon";

interface NodeDetailPanelProps {
  node: SankeyNodeDatum | null;
  inbound: SankeyLinkDatum[];
  outbound: SankeyLinkDatum[];
  onClose?: () => void;
}

export function NodeDetailPanel({ node, inbound, outbound, onClose }: NodeDetailPanelProps) {
  const { t } = useTranslation();

  if (!node) return null;

  const isMachine = node.type === "machine";
  const recipeNode = node.metadata?.recipeNode as
    | {
        machine?: { name?: string };
        machineCount?: number;
        recipeType?: string;
        proliferator?: unknown;
        power?: { total?: number };
      }
    | undefined;

  return (
    <div className="bg-dark-700/60 border border-neon-blue/20 rounded-lg p-4 space-y-4 max-h-[32rem] overflow-y-auto node-detail-panel-animate">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {node.itemId && <ItemIcon itemId={node.itemId} size={32} alt={node.label} />}
          <h2 className="text-xl font-semibold text-white ${TEXT_GLOW.cyan}">{node.label}</h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-space-200 hover:text-white transition-colors text-2xl leading-none px-2 py-1 rounded hover:bg-dark-600/50"
            aria-label={t("visualization.node.close") as string}
          >
            ×
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 設備情報を表示（レシピノードが存在する場合） */}
        {recipeNode && (
          <>
            <InfoRow
              label={t("visualization.node.machineName")}
              value={recipeNode.machine?.name ?? "-"}
            />
            <InfoRow
              label={t("visualization.node.machineCount")}
              value={formatBuildingCount(recipeNode.machineCount ?? 0)}
            />
            <InfoRow
              label={t("visualization.node.proliferator")}
              value={buildProliferatorLabel(recipeNode.proliferator)}
            />
            <InfoRow
              label={t("visualization.node.powerConsumption")}
              value={formatPower(recipeNode.power?.total ?? 0)}
            />
          </>
        )}

        {isMachine && (
          <>
            <InfoRow
              label={t("visualization.node.machineType")}
              value={String(node.metadata?.machineType ?? "-")}
            />
            <InfoRow
              label={t("visualization.node.machineRank")}
              value={String(node.metadata?.machineRank ?? "-")}
            />
            <InfoRow
              label={t("visualization.node.proliferator")}
              value={buildProliferatorLabel(node.metadata?.proliferator)}
            />
            <InfoRow
              label={t("visualization.node.powerConsumption")}
              value={formatPower((node.metadata?.power as { total?: number })?.total ?? 0)}
            />
          </>
        )}
      </div>

      <div className="space-y-4">
        <FlowList title={t("visualization.node.inputs")} flows={inbound} direction="in" />
        <FlowList title={t("visualization.node.outputs")} flows={outbound} direction="out" />
      </div>
    </div>
  );
}

function FlowList({
  title,
  flows,
  direction,
}: {
  title: string;
  flows: SankeyLinkDatum[];
  direction: "in" | "out";
}) {
  const { t } = useTranslation();

  if (flows.length === 0) {
    return (
      <section>
        <h3 className="text-sm font-semibold text-space-100 mb-2">{title}</h3>
        <p className="text-xs text-space-400">{t("visualization.node.noFlows")}</p>
      </section>
    );
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-space-100 mb-2">{title}</h3>
      <ul className="space-y-2">
        {flows.map(flow => (
          <li
            key={`${flow.source}-${flow.target}-${flow.itemId}-${direction}`}
            className="flex items-center gap-3 bg-dark-700/60 border border-neon-blue/20 rounded px-3 py-2 text-sm text-white"
          >
            <ItemIcon itemId={flow.itemId} size={24} alt={flow.label} />
            <span className="flex-1">{flow.label}</span>
            <span className="text-neon-cyan font-semibold">{formatRate(flow.value)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 bg-dark-700/60 border border-dark-600 rounded-lg px-3 py-2">
      <span className="text-xs uppercase tracking-wide text-space-400">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}

function buildProliferatorLabel(proliferator: unknown): string {
  if (!proliferator || typeof proliferator !== "object") return "-";
  const type = (proliferator as { type?: string }).type ?? "none";
  if (type === "none") return "-";
  const mode = (proliferator as { mode?: string }).mode ?? "speed";
  const level = (proliferator as { level?: number }).level;
  if (typeof level === "number") {
    return `${type.toUpperCase()} · ${mode} · Lv.${formatNumber(level)}`;
  }
  return `${type.toUpperCase()} · ${mode}`;
}
