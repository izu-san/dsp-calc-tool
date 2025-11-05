import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { sankey as d3Sankey, sankeyCenter, sankeyLinkHorizontal } from "d3-sankey";
import type { SankeyGraph } from "d3-sankey";
import { zoom as d3Zoom } from "d3-zoom";
import { select } from "d3-selection";
import type { CalculationResult } from "@/types";
import { buildSankeyData } from "@/lib/visualization";
import type { SankeyLinkDatum, SankeyNodeDatum, VisualizationNodeType } from "@/lib/visualization";
import { cn } from "@/utils/classNames";
import { getItemIconPath } from "@/utils/grid";
import { getOptimalImagePath } from "@/utils/imageFormat";
import { FilterPanel } from "./FilterPanel";
import { NodeDetailPanel } from "./NodeDetailPanel";

type MaterialFilterKey = "raw-material" | "intermediate" | "final-product";

interface VisualizationViewProps {
  calculationResult: CalculationResult;
}

type SankeyNodeInternal = SankeyNodeDatum & {
  index?: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  depth?: number;
};

type SankeyLinkInternal = SankeyLinkDatum & {
  source: SankeyNodeInternal | string;
  target: SankeyNodeInternal | string;
  width?: number;
  y0?: number;
  y1?: number;
};

const DEFAULT_DIMENSIONS = { width: 960, height: 600 };

export function VisualizationView({ calculationResult }: VisualizationViewProps) {
  const { t } = useTranslation();
  const svgContainerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState(DEFAULT_DIMENSIONS);
  const [materialVisibility, setMaterialVisibility] = useState<Record<MaterialFilterKey, boolean>>({
    "raw-material": true,
    intermediate: true,
    "final-product": true,
  });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredLinkKey, setHoveredLinkKey] = useState<string | null>(null);
  const [focusedNode, setFocusedNode] = useState<SankeyNodeInternal | undefined>(undefined);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomGroupRef = useRef<SVGGElement | null>(null);

  useLayoutEffect(() => {
    const element = svgContainerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (!entry.contentRect) continue;
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) continue;
        // padding分を引く（p-4 = 16px * 2 = 32px）
        setDimensions({
          width: Math.max(640, Math.floor(width - 32)),
          height: Math.max(800, Math.floor(height - 32)), // 高さを増やす
        });
      }
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  const graphData = useMemo(() => buildSankeyData(calculationResult), [calculationResult]);

  const sankeyLayout = useMemo(() => {
    if (graphData.nodes.length === 0 || graphData.links.length === 0) {
      return null;
    }

    // アイコンサイズに合わせてノード幅を小さくする（24px + マージン8px = 32px）
    const iconSize = 24;
    const nodeWidth = iconSize + 8;
    const nodePadding = 24; // ノード間のパディングを増やす（16px → 24px）

    // ノード数に応じて必要な高さを計算
    // 各ノードの最小高さ（32px）+ パディング（24px）で計算
    const minNodeHeight = iconSize + 8;
    const estimatedHeight = Math.max(
      dimensions.height,
      graphData.nodes.length * (minNodeHeight + nodePadding) + 32
    );

    // ノード数とリンク数に基づいて横幅を推定
    // 複雑なレシピ（ノード数が多い、またはリンク数が多い）の場合、より大きな横幅を使用
    const nodeCount = graphData.nodes.length;
    const linkCount = graphData.links.length;
    const complexity = Math.max(nodeCount, linkCount);

    // 基本的な横幅: ノード数 × 150px、またはリンク数 × 100px、どちらか大きい方
    // ただし、最低でもコンテナの2倍の横幅を確保
    const baseWidth = Math.max(dimensions.width * 2, Math.max(nodeCount * 150, linkCount * 100));

    // 複雑なレシピ（ノード数が20以上、またはリンク数が30以上）の場合、さらに横幅を拡大
    const layoutWidth = complexity >= 20 ? Math.max(baseWidth, dimensions.width * 3) : baseWidth;

    const generator = d3Sankey<SankeyNodeInternal, SankeyLinkInternal>()
      .nodeId(d => d.id)
      .nodeWidth(nodeWidth)
      .nodePadding(nodePadding)
      .nodeAlign(sankeyCenter)
      .extent([
        [16, 16],
        [layoutWidth - 16, estimatedHeight - 16],
      ]);

    const layout = generator({
      nodes: graphData.nodes.map(node => ({ ...node })) as SankeyNodeInternal[],
      links: graphData.links.map(link => ({ ...link })) as SankeyLinkInternal[],
    }) as SankeyGraph<SankeyNodeInternal, SankeyLinkInternal>;

    return layout;
  }, [graphData, dimensions.height, dimensions.width]);

  // レイアウト後の実際の高さと横幅を計算
  const actualHeight = useMemo(() => {
    if (!sankeyLayout) return dimensions.height;
    const maxY = Math.max(...sankeyLayout.nodes.map(node => node.y1));
    return Math.max(dimensions.height, maxY + 32); // マージンを追加
  }, [sankeyLayout, dimensions.height]);

  const actualWidth = useMemo(() => {
    if (!sankeyLayout) return dimensions.width;
    const maxX = Math.max(...sankeyLayout.nodes.map(node => node.x1));
    // レイアウト後の実際の横幅 + マージン + 余裕を持たせる
    // レイアウト計算時にすでに十分な横幅を使用しているので、そのまま使用
    return Math.max(dimensions.width, maxX + 100);
  }, [sankeyLayout, dimensions.width]);

  // ズーム機能の設定
  useEffect(() => {
    if (!svgRef.current || !zoomGroupRef.current || !sankeyLayout) return;

    const svg = select(svgRef.current);
    const zoomGroup = select(zoomGroupRef.current);

    const zoomBehavior = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5]) // 最小10%、最大500%までズーム可能
      .on("zoom", event => {
        zoomGroup.attr("transform", event.transform.toString());
      })
      .on("start", () => {
        svg.style("cursor", "grabbing");
      })
      .on("end", () => {
        svg.style("cursor", "grab");
      });

    svg.call(zoomBehavior);

    return () => {
      svg.on(".zoom", null);
    };
  }, [sankeyLayout]);

  const materialFilterSet = useMemo(() => {
    const entries = Object.entries(materialVisibility) as Array<[MaterialFilterKey, boolean]>;
    return new Set<VisualizationNodeType>(
      entries.filter(([, visible]) => visible).map(([key]) => key as VisualizationNodeType)
    );
  }, [materialVisibility]);

  const visibility = useMemo(() => {
    if (!sankeyLayout) {
      return {
        nodeVisibility: new Map<string, boolean>(),
        linkVisibility: new Map<string, boolean>(),
      };
    }

    const nodeVisibility = new Map<string, boolean>();
    const linkVisibility = new Map<string, boolean>();

    sankeyLayout.nodes.forEach(node => {
      const matchesMaterial = materialFilterSet.has(node.type as VisualizationNodeType);
      nodeVisibility.set(node.id, matchesMaterial);
    });

    sankeyLayout.links.forEach(link => {
      const sourceId = resolveNodeId(link.source);
      const targetId = resolveNodeId(link.target);
      const key = buildLinkKey(link);
      const sourceVisible = nodeVisibility.get(sourceId) ?? false;
      const targetVisible = nodeVisibility.get(targetId) ?? false;
      linkVisibility.set(key, sourceVisible && targetVisible);
    });

    return { nodeVisibility, linkVisibility };
  }, [materialFilterSet, sankeyLayout]);

  const linkPathGenerator = useMemo(
    () => sankeyLinkHorizontal<SankeyNodeInternal, SankeyLinkInternal>(),
    []
  );

  // パスの中央点と角度を計算する関数
  function getPathMidpoint(path: string): { x: number; y: number; angle: number } | null {
    if (!path) return null;
    try {
      // SVGパスをパースして中央点を計算
      const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
      pathElement.setAttribute("d", path);
      const pathLength = pathElement.getTotalLength();
      const midLength = pathLength / 2;
      const midpoint = pathElement.getPointAtLength(midLength);
      const beforePoint = pathElement.getPointAtLength(Math.max(0, midLength - 10));
      const afterPoint = pathElement.getPointAtLength(Math.min(pathLength, midLength + 10));
      const angle =
        (Math.atan2(afterPoint.y - beforePoint.y, afterPoint.x - beforePoint.x) * 180) / Math.PI;
      return { x: midpoint.x, y: midpoint.y, angle };
    } catch {
      return null;
    }
  }

  // レートを毎秒形式でフォーマット
  function formatRatePerSecond(ratePerSecond: number): string {
    if (ratePerSecond < 0.001) {
      return ratePerSecond.toFixed(5);
    }
    if (ratePerSecond < 0.01) {
      return ratePerSecond.toFixed(4);
    }
    if (ratePerSecond < 0.1) {
      return ratePerSecond.toFixed(3);
    }
    if (ratePerSecond < 1) {
      return ratePerSecond.toFixed(2);
    }
    return ratePerSecond.toFixed(1);
  }

  const visibleNodeCount = Array.from(visibility.nodeVisibility.values()).filter(Boolean).length;
  const visibleLinkCount = Array.from(visibility.linkVisibility.values()).filter(Boolean).length;

  return (
    <div className="flex h-full min-h-[32rem] flex-col gap-4">
      <FilterPanel
        materialVisibility={materialVisibility}
        onMaterialVisibilityChange={(key, value) =>
          setMaterialVisibility(current => ({ ...current, [key]: value }))
        }
        onReset={() => {
          setMaterialVisibility({
            "raw-material": true,
            intermediate: true,
            "final-product": true,
          });
        }}
      />

      {focusedNode && (
        <NodeDetailPanel
          node={focusedNode}
          inbound={collectFlows(
            focusedNode,
            sankeyLayout?.links ?? [],
            visibility.linkVisibility,
            "target"
          )}
          outbound={collectFlows(
            focusedNode,
            sankeyLayout?.links ?? [],
            visibility.linkVisibility,
            "source"
          )}
          onClose={() => setFocusedNode(undefined)}
        />
      )}

      {!sankeyLayout || visibleNodeCount === 0 || visibleLinkCount === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-neon-blue/30 bg-dark-700/50">
          <p className="text-sm text-space-300">{t("visualization.emptyState.noData")}</p>
        </div>
      ) : (
        <div
          ref={svgContainerRef}
          className="relative flex-1 overflow-x-auto overflow-y-hidden rounded-xl border border-neon-blue/20 bg-dark-800/40 p-4"
        >
          <svg
            ref={svgRef}
            width={actualWidth}
            height={actualHeight}
            style={{ display: "block", cursor: "grab" }}
            className="touch-none"
          >
            <defs>
              {sankeyLayout.nodes
                .filter(node => node.appearance?.pattern)
                .map(node => (
                  <pattern
                    key={`pattern-${node.id}`}
                    id={`pattern-${node.id}`}
                    patternUnits="userSpaceOnUse"
                    width={8}
                    height={8}
                  >
                    <rect
                      width={8}
                      height={8}
                      fill={node.appearance?.fill ?? "rgba(255,255,255,0.2)"}
                    />
                    {node.appearance?.pattern === "stripe" ? (
                      <path
                        d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4"
                        stroke={node.appearance?.stroke ?? "rgba(255,255,255,0.6)"}
                        strokeWidth={1.5}
                      />
                    ) : (
                      <circle
                        cx={4}
                        cy={4}
                        r={1.5}
                        fill={node.appearance?.stroke ?? "rgba(255,255,255,0.6)"}
                      />
                    )}
                  </pattern>
                ))}
            </defs>

            <g ref={zoomGroupRef}>
              {sankeyLayout.links.map(link => {
                const key = buildLinkKey(link);
                const isVisible = visibility.linkVisibility.get(key) ?? false;
                const isActive =
                  hoveredLinkKey === key ||
                  hoveredNodeId === resolveNodeId(link.source) ||
                  hoveredNodeId === resolveNodeId(link.target);
                const opacity = !isVisible ? 0.08 : isActive ? 0.95 : hoveredNodeId ? 0.25 : 0.6;
                const strokeWidth = Math.max(1, link.width ?? 1);
                const pathData = linkPathGenerator(link) ?? "";
                const midpoint = getPathMidpoint(pathData);
                const showLabel = strokeWidth >= 2 && midpoint !== null; // より多くのリンクにラベルを表示

                return (
                  <g key={key}>
                    <path
                      d={pathData}
                      stroke={link.color ?? "rgba(0,217,255,0.8)"}
                      strokeWidth={strokeWidth}
                      fill="none"
                      opacity={opacity}
                      onMouseEnter={() => setHoveredLinkKey(key)}
                      onMouseLeave={() => setHoveredLinkKey(null)}
                    >
                      <title>{`${link.label} • ${formatRatePerSecond(link.value)} / s`}</title>
                    </path>
                    {showLabel && (
                      <text
                        x={midpoint.x}
                        y={midpoint.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="rgba(255,255,255,0.95)"
                        fontSize="14"
                        fontWeight="600"
                        transform={`rotate(${midpoint.angle}, ${midpoint.x}, ${midpoint.y})`}
                        style={{ pointerEvents: "none", textShadow: "0 0 4px rgba(0,0,0,0.9)" }}
                      >
                        {`${formatRatePerSecond(link.value)}/s ${link.label}`}
                      </text>
                    )}
                  </g>
                );
              })}

              <g>
                {sankeyLayout.nodes
                  .filter(node => node.id !== "sink") // シンクノードは非表示
                  .map(node => {
                    const isVisible = visibility.nodeVisibility.get(node.id) ?? false;
                    const isActive = hoveredNodeId === node.id;
                    const opacity = !isVisible ? 0.12 : isActive ? 1 : hoveredNodeId ? 0.35 : 0.85;
                    const width = Math.max(1, node.x1 - node.x0);
                    let height = Math.max(1, node.y1 - node.y0);

                    // アイコンが必ず収まるように最小サイズを確保
                    const iconSize = 24;
                    const minHeight = iconSize + 8; // アイコンサイズ + マージン
                    if (height < minHeight) {
                      height = minHeight;
                    }

                    // 原材料・中間製品は暗めの灰色、最終製品は色付き
                    const isFinalProduct = node.type === "final-product";
                    const fill =
                      node.appearance?.pattern === undefined || node.appearance?.pattern === null
                        ? isFinalProduct
                          ? (node.appearance?.fill ?? "rgba(0,217,255,0.25)")
                          : "rgba(64,64,64,0.4)" // より暗い灰色
                        : `url(#pattern-${node.id})`;
                    const stroke = node.appearance?.stroke ?? "rgba(0,217,255,0.6)";

                    // アイコンパスを取得
                    const iconPath = node.itemId
                      ? getOptimalImagePath(getItemIconPath(node.itemId))
                      : null;

                    return (
                      <g key={node.id} transform={`translate(${node.x0},${node.y0})`}>
                        <rect
                          role="button"
                          tabIndex={isVisible ? 0 : -1}
                          aria-label={node.label}
                          width={width}
                          height={height}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={isActive ? 2 : 1}
                          opacity={opacity}
                          rx={2}
                          className={cn("transition duration-200 ease-out cursor-pointer", {
                            "ring-2 ring-neon-cyan": isActive,
                            "pointer-events-none": !isVisible,
                          })}
                          onMouseEnter={() => setHoveredNodeId(node.id)}
                          onMouseLeave={() => setHoveredNodeId(null)}
                          onClick={() => {
                            if (!isVisible) return;
                            setFocusedNode(node);
                          }}
                          onKeyDown={event => {
                            if (!isVisible) return;
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setFocusedNode(node);
                            }
                          }}
                        >
                          <title>{`${node.label} • ${formatRatePerSecond(node.value)} / s`}</title>
                        </rect>
                        {/* アイコン（中央に配置） */}
                        {iconPath && (
                          <image
                            href={iconPath}
                            x={(width - iconSize) / 2}
                            y={(height - iconSize) / 2}
                            width={iconSize}
                            height={iconSize}
                            opacity={isVisible ? (isActive ? 1 : hoveredNodeId ? 0.9 : 0.95) : 0.3} // より明るく
                            style={{ pointerEvents: "none" }}
                          />
                        )}
                      </g>
                    );
                  })}
              </g>
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}

function resolveNodeId(node: SankeyNodeInternal | string): string {
  return typeof node === "string" ? node : node.id;
}

function buildLinkKey(link: SankeyLinkInternal): string {
  return `${resolveNodeId(link.source)}->${resolveNodeId(link.target)}::${link.itemId}`;
}

function collectFlows(
  node: SankeyNodeInternal | undefined,
  links: SankeyLinkInternal[],
  visibility: Map<string, boolean>,
  direction: "source" | "target"
): SankeyLinkDatum[] {
  if (!node) return [];
  return links
    .filter(link => {
      const key = buildLinkKey(link);
      if (!(visibility.get(key) ?? false)) return false;
      const compare = direction === "source" ? link.source : link.target;
      return resolveNodeId(compare) === node.id;
    })
    .map(link => ({
      source: resolveNodeId(link.source),
      target: resolveNodeId(link.target),
      value: link.value,
      itemId: link.itemId,
      label: link.label,
      color: link.color,
    }));
}
