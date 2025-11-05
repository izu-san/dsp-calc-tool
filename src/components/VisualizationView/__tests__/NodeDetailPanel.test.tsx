import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NodeDetailPanel } from "../NodeDetailPanel";
import type { SankeyLinkDatum, SankeyNodeDatum } from "@/lib/visualization";

// i18n モック（キーをそのまま返す）
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// ItemIcon モック
vi.mock("../../ItemIcon", () => ({
  ItemIcon: ({ itemId, alt, size }: any) => (
    <div data-testid={`item-icon-${itemId}`} data-alt={alt} data-size={size}>
      {`Icon ${itemId}`}
    </div>
  ),
}));

describe("NodeDetailPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const createMockNode = (overrides?: Partial<SankeyNodeDatum>): SankeyNodeDatum => ({
    id: "node-1",
    label: "Iron Ingot",
    type: "intermediate",
    itemId: 1002,
    value: 60,
    appearance: {
      fill: "rgba(0, 255, 136, 0.35)",
      stroke: "rgba(0, 255, 136, 0.6)",
    },
    ...overrides,
  });

  const createMockLink = (overrides?: Partial<SankeyLinkDatum>): SankeyLinkDatum => ({
    source: "node-source",
    target: "node-target",
    value: 60,
    itemId: 1001,
    label: "Iron Ore",
    color: "rgba(0, 217, 255, 0.8)",
    ...overrides,
  });

  it("ノードがnullの場合、何も表示されない", () => {
    const { container } = render(<NodeDetailPanel node={null} inbound={[]} outbound={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it("ノードの基本情報が表示される", () => {
    const node = createMockNode();

    render(<NodeDetailPanel node={node} inbound={[]} outbound={[]} />);

    expect(screen.getByText("Iron Ingot")).toBeInTheDocument();
    expect(screen.getByTestId("item-icon-1002")).toBeInTheDocument();
  });

  it("閉じるボタンが表示される（onCloseが渡された場合）", () => {
    const node = createMockNode();
    const onClose = vi.fn();

    render(<NodeDetailPanel node={node} inbound={[]} outbound={[]} onClose={onClose} />);

    const closeButton = screen.getByRole("button", {
      name: "visualization.node.close",
    });
    expect(closeButton).toBeInTheDocument();
    expect(closeButton.textContent).toBe("×");
  });

  it("閉じるボタンをクリックすると、onCloseが呼ばれる", () => {
    const node = createMockNode();
    const onClose = vi.fn();

    render(<NodeDetailPanel node={node} inbound={[]} outbound={[]} onClose={onClose} />);

    const closeButton = screen.getByRole("button", {
      name: "visualization.node.close",
    });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("onCloseが渡されない場合、閉じるボタンが表示されない", () => {
    const node = createMockNode();

    render(<NodeDetailPanel node={node} inbound={[]} outbound={[]} />);

    expect(
      screen.queryByRole("button", { name: "visualization.node.close" })
    ).not.toBeInTheDocument();
  });

  it("レシピノード情報が表示される（recipeNodeがある場合）", () => {
    const node = createMockNode({
      metadata: {
        recipeNode: {
          machine: { name: "Arc Smelter" },
          machineCount: 2,
          recipeType: "Smelt",
          proliferator: { type: "none", mode: "speed" },
          power: { total: 240 },
        },
      },
    });

    render(<NodeDetailPanel node={node} inbound={[]} outbound={[]} />);

    expect(screen.getByText("visualization.node.machineName")).toBeInTheDocument();
    expect(screen.getByText("Arc Smelter")).toBeInTheDocument();
    expect(screen.getByText("visualization.node.machineCount")).toBeInTheDocument();
    // formatBuildingCountは数値のみを返す
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("visualization.node.powerConsumption")).toBeInTheDocument();
    expect(screen.getByText("240.0 kW")).toBeInTheDocument();
  });

  it("プロリフェレータ情報が正しく表示される（MK2、production、Lv.3）", () => {
    const node = createMockNode({
      metadata: {
        recipeNode: {
          machine: { name: "Assembler" },
          machineCount: 1,
          proliferator: { type: "mk2", mode: "production", level: 3 },
          power: { total: 170 },
        },
      },
    });

    render(<NodeDetailPanel node={node} inbound={[]} outbound={[]} />);

    // formatNumberは小数点を含むので"Lv.3.0"になる
    expect(screen.getByText(/MK2 · production · Lv\.3/)).toBeInTheDocument();
  });

  it("プロリフェレータがnoneの場合、-が表示される", () => {
    const node = createMockNode({
      metadata: {
        recipeNode: {
          machine: { name: "Assembler" },
          machineCount: 1,
          proliferator: { type: "none", mode: "speed" },
          power: { total: 100 },
        },
      },
    });

    render(<NodeDetailPanel node={node} inbound={[]} outbound={[]} />);

    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("入力フローが表示される", () => {
    const node = createMockNode();
    const inbound: SankeyLinkDatum[] = [
      createMockLink({
        source: "node-iron-ore",
        target: "node-1",
        itemId: 1001,
        label: "Iron Ore",
        value: 60,
      }),
      createMockLink({
        source: "node-coal",
        target: "node-1",
        itemId: 1003,
        label: "Coal",
        value: 30,
      }),
    ];

    render(<NodeDetailPanel node={node} inbound={inbound} outbound={[]} />);

    expect(screen.getByText("visualization.node.inputs")).toBeInTheDocument();
    expect(screen.getByText("Iron Ore")).toBeInTheDocument();
    expect(screen.getByText("Coal")).toBeInTheDocument();
    expect(screen.getByTestId("item-icon-1001")).toBeInTheDocument();
    expect(screen.getByTestId("item-icon-1003")).toBeInTheDocument();
  });

  it("出力フローが表示される", () => {
    const node = createMockNode();
    const outbound: SankeyLinkDatum[] = [
      createMockLink({
        source: "node-1",
        target: "node-final",
        itemId: 1002,
        label: "Iron Ingot",
        value: 60,
      }),
    ];

    render(<NodeDetailPanel node={node} inbound={[]} outbound={outbound} />);

    expect(screen.getByText("visualization.node.outputs")).toBeInTheDocument();
    // ノードのラベルとフローのラベルが同じなので、getAllByTextを使用
    const ironIngotElements = screen.getAllByText("Iron Ingot");
    expect(ironIngotElements.length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByTestId("item-icon-1002").length).toBeGreaterThanOrEqual(2);
  });

  it("入力フローが空の場合、適切なメッセージが表示される", () => {
    const node = createMockNode();

    render(<NodeDetailPanel node={node} inbound={[]} outbound={[]} />);

    expect(screen.getByText("visualization.node.inputs")).toBeInTheDocument();
    // 入力と出力の両方が空なので、2つのnoFlowsメッセージが表示される
    const noFlowsMessages = screen.getAllByText("visualization.node.noFlows");
    expect(noFlowsMessages.length).toBeGreaterThanOrEqual(1);
  });

  it("出力フローが空の場合、適切なメッセージが表示される", () => {
    const node = createMockNode();

    render(<NodeDetailPanel node={node} inbound={[]} outbound={[]} />);

    expect(screen.getByText("visualization.node.outputs")).toBeInTheDocument();
    expect(screen.getAllByText("visualization.node.noFlows")).toHaveLength(2);
  });

  it("機械ノードの場合、機械情報が表示される", () => {
    const node = createMockNode({
      type: "machine",
      metadata: {
        machineType: "Assemble",
        machineRank: "mk2",
        proliferator: { type: "mk3", mode: "speed", level: 4 },
        power: { total: 300 },
      },
    });

    render(<NodeDetailPanel node={node} inbound={[]} outbound={[]} />);

    expect(screen.getByText("visualization.node.machineType")).toBeInTheDocument();
    expect(screen.getByText("Assemble")).toBeInTheDocument();
    expect(screen.getByText("visualization.node.machineRank")).toBeInTheDocument();
    expect(screen.getByText("mk2")).toBeInTheDocument();
    // formatNumberは小数点を含むので"Lv.4.0"になる
    expect(screen.getByText(/MK3 · speed · Lv\.4/)).toBeInTheDocument();
    expect(screen.getByText("300.0 kW")).toBeInTheDocument();
  });

  it("パネルにアニメーションクラスが適用される", () => {
    const node = createMockNode();

    const { container } = render(<NodeDetailPanel node={node} inbound={[]} outbound={[]} />);

    const panel = container.firstChild as HTMLElement;
    expect(panel).toHaveClass("node-detail-panel-animate");
    expect(panel).toHaveClass("max-h-[32rem]");
    expect(panel).toHaveClass("overflow-y-auto");
  });

  it("複数の入力フローが正しく表示される", () => {
    const node = createMockNode();
    const inbound: SankeyLinkDatum[] = [
      createMockLink({
        source: "node-1",
        target: "node-target",
        itemId: 1001,
        label: "Iron Ore",
        value: 60,
      }),
      createMockLink({
        source: "node-2",
        target: "node-target",
        itemId: 1003,
        label: "Coal",
        value: 30,
      }),
      createMockLink({
        source: "node-3",
        target: "node-target",
        itemId: 1004,
        label: "Copper Ore",
        value: 45,
      }),
    ];

    render(<NodeDetailPanel node={node} inbound={inbound} outbound={[]} />);

    expect(screen.getByText("Iron Ore")).toBeInTheDocument();
    expect(screen.getByText("Coal")).toBeInTheDocument();
    expect(screen.getByText("Copper Ore")).toBeInTheDocument();
  });

  it("itemIdがnullの場合でもアイコンが表示されないが、ラベルは表示される", () => {
    const node = createMockNode({
      itemId: undefined,
    });

    render(<NodeDetailPanel node={node} inbound={[]} outbound={[]} />);

    expect(screen.getByText("Iron Ingot")).toBeInTheDocument();
    expect(screen.queryByTestId(/item-icon/)).not.toBeInTheDocument();
  });
});
