import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VisualizationView } from "../index";
import { createRawMaterialNode, createRecipeNode } from "../../../test/factories/testDataFactory";
import type { CalculationResult } from "../../../types";

// i18n モック
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// d3-sankey モック
vi.mock("d3-sankey", () => {
  const mockSankeyFunction = (data: any) => {
    // モックのレイアウト結果を返す
    return {
      nodes: data.nodes.map((node: any, i: number) => ({
        ...node,
        x0: i * 100,
        x1: i * 100 + 80,
        y0: i * 50,
        y1: i * 50 + 40,
      })),
      links: data.links.map((link: any) => ({
        ...link,
        source: link.source,
        target: link.target,
        width: 10,
      })),
    };
  };

  mockSankeyFunction.nodeId = () => mockSankeyFunction;
  mockSankeyFunction.linkId = () => mockSankeyFunction;
  mockSankeyFunction.nodePadding = () => mockSankeyFunction;
  mockSankeyFunction.nodeWidth = () => mockSankeyFunction;
  mockSankeyFunction.nodeAlign = () => mockSankeyFunction;
  mockSankeyFunction.extent = () => mockSankeyFunction;
  mockSankeyFunction.size = () => mockSankeyFunction;

  return {
    sankey: () => mockSankeyFunction,
    sankeyLinkHorizontal: () => () => "",
    sankeyCenter: () => () => 0,
  };
});

// d3-zoom モック
vi.mock("d3-zoom", () => ({
  zoom: () => {
    const zoomBehavior = {
      scaleExtent: () => zoomBehavior,
      translateExtent: () => zoomBehavior,
      on: () => zoomBehavior,
    };
    return zoomBehavior;
  },
  zoomIdentity: {
    translate: () => ({ scale: () => ({ toString: () => "" }) }),
    scale: () => ({ toString: () => "" }),
  },
}));

// d3-selection モック
vi.mock("d3-selection", () => ({
  select: () => ({
    call: () => {},
    on: () => {},
    attr: () => {},
  }),
}));

describe("VisualizationView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const createMockCalculationResult = (): CalculationResult => {
    const rawMaterial = createRawMaterialNode({
      itemId: 1001,
      itemName: "Iron Ore",
      targetOutputRate: 60,
      nodeId: "raw-1001-0",
    });

    const recipeNode = createRecipeNode({
      recipe: {
        SID: 1,
        name: "Smelt Iron Ingot",
        Type: "Smelt",
        Explicit: false,
        TimeSpend: 60,
        Items: [{ id: 1001, name: "Iron Ore", count: 1, Type: "Material", isRaw: true }],
        Results: [{ id: 1002, name: "Iron Ingot", count: 1, Type: "Material", isRaw: false }],
        GridIndex: "1101",
        productive: true,
      },
      machine: {
        id: 2301,
        name: "Arc Smelter",
        count: 1,
        Type: "Smelt",
        isRaw: false,
        assemblerSpeed: 10000,
        workEnergyPerTick: 120,
        idleEnergyPerTick: 0,
        exchangeEnergyPerTick: 0,
        isPowerConsumer: true,
        isPowerExchanger: false,
      },
      targetOutputRate: 60,
      nodeId: "recipe-1-0",
      children: [rawMaterial],
      inputs: [
        {
          itemId: 1001,
          itemName: "Iron Ore",
          requiredRate: 60,
        },
      ],
    });

    return {
      rootNode: recipeNode,
      rawMaterials: new Map([[1001, 60]]),
      totalPower: { total: 120, machines: 120, sorters: 0, dysonSphere: 0 },
      totalMachines: 1,
    };
  };

  it("計算結果が存在する場合、フィルタパネルが表示される", () => {
    const result = createMockCalculationResult();
    render(<VisualizationView calculationResult={result} />);

    expect(screen.getByText("visualization.filters.materialTypes")).toBeInTheDocument();
  });

  it("計算結果が存在する場合、SVGコンテナが表示される", () => {
    const result = createMockCalculationResult();
    const { container } = render(<VisualizationView calculationResult={result} />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("データがない場合、空状態メッセージが表示される", () => {
    const emptyResult: CalculationResult = {
      rootNode: createRawMaterialNode({
        itemId: 1001,
        itemName: "Iron Ore",
        targetOutputRate: 0,
        nodeId: "raw-1001-0",
      }),
      rawMaterials: new Map(),
      totalPower: { total: 0, machines: 0, sorters: 0, dysonSphere: 0 },
      totalMachines: 0,
    };

    render(<VisualizationView calculationResult={emptyResult} />);

    expect(screen.getByText("visualization.emptyState.noData")).toBeInTheDocument();
  });
});
