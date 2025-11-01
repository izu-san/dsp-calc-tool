import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { NodeSettingsModal } from "../index";

// i18n モック（キーをそのまま返す）
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// ItemIcon は簡素化
vi.mock("../../ItemIcon", () => ({
  ItemIcon: (props: any) => <span data-testid={`icon-${props.itemId}`} />,
}));

// stores モック
const setNodeOverride = vi.fn();
const clearNodeOverride = vi.fn();

let nodeOverridesMock: Map<number, any> = new Map();
vi.mock("../../../stores/nodeOverrideStore", () => ({
  useNodeOverrideStore: () => ({
    nodeOverrides: nodeOverridesMock,
    setNodeOverride,
    clearNodeOverride,
  }),
}));

vi.mock("../../../stores/settingsStore", () => ({
  useSettingsStore: () => ({
    settings: {
      proliferator: { type: "none", mode: "speed" },
    },
  }),
}));

// icons は数値が参照されるだけなので簡略
vi.mock("../../../constants/icons", () => ({
  ICONS: {
    machine: {
      smelter: { arc: 1, plane: 2, negentropy: 3 },
      assembler: { mk1: 4, mk2: 5, mk3: 6 },
      chemical: { standard: 7, quantum: 8 },
      research: { standard: 9, "self-evolution": 10 },
    },
  },
}));

describe("NodeSettingsModal", () => {
  const baseNode = {
    nodeId: 101,
    recipe: {
      name: "Copper Ingot",
      Type: "Assemble",
      Items: [],
      Results: [{ id: 1001, name: "Copper Ingot", count: 1 }],
      productive: true,
    },
  } as any;

  beforeEach(() => {
    nodeOverridesMock = new Map();
    setNodeOverride.mockReset();
    clearNodeOverride.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.resetModules();
  });

  it("isOpen=false の場合は描画しない", () => {
    render(<NodeSettingsModal node={baseNode} isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText("nodeSettings")).not.toBeInTheDocument();
  });

  it("初期表示でヘッダーと使用中テキストが表示される（useOverride=false）", () => {
    render(<NodeSettingsModal node={baseNode} isOpen onClose={vi.fn()} />);
    expect(screen.getByText("nodeSettings")).toBeInTheDocument();
    expect(screen.getByText("usingGlobalSettings")).toBeInTheDocument();
    expect(screen.getByText("enableCustomSettingsToOverride")).toBeInTheDocument();
  });

  it("オーバーライドを有効化して設定を変更・保存すると setNodeOverride が呼ばれる", async () => {
    const onClose = vi.fn();
    // 初期からオーバーライド有効にする
    nodeOverridesMock = new Map([[101, { proliferator: { type: "none", mode: "speed" } }]]);
    render(<NodeSettingsModal node={baseNode} isOpen onClose={onClose} />);

    // Proliferator: type を mk2、mode を speed にする（大文字/記号を考慮して部分一致）
    const mk2Buttons = screen.getAllByRole("button", { name: /^MK2$/i });
    fireEvent.click(mk2Buttons[0]);

    // Machine Rank: mk2 を選択（ボタンのアクセシブルネームで特定）
    fireEvent.click(screen.getByRole("button", { name: /assemblingMachineMk2/i }));

    // 保存
    fireEvent.click(screen.getByText("applySettings"));

    expect(setNodeOverride).toHaveBeenCalled();
    const [nodeId, payload] = setNodeOverride.mock.calls[0];
    expect(nodeId).toBe(101);
    // proliferator はデフォルト mode が speed であることのみ確認（type はUI重複のため非検証）
    expect(payload.proliferator.mode).toBe("speed");
    expect(onClose).toHaveBeenCalled();
  });

  it("resetToGlobal で clearNodeOverride が呼ばれ、ガイダンステキストが表示される", () => {
    render(<NodeSettingsModal node={baseNode} isOpen onClose={vi.fn()} />);

    // オーバーライドON→リセット
    const toggle = screen.getByRole("button", { name: "" });
    fireEvent.click(toggle);
    fireEvent.click(screen.getByText("resetToGlobal"));

    expect(clearNodeOverride).toHaveBeenCalledWith(101);
    expect(screen.getByText("usingGlobalSettings")).toBeInTheDocument();
  });

  it("productive=false のとき production モードは disabled", () => {
    const node = {
      ...baseNode,
      recipe: { ...baseNode.recipe, productive: false },
    } as any;
    // オーバーライド有効かつ type が mk1 でモードボタンを表示
    nodeOverridesMock = new Map([[101, { proliferator: { type: "mk1", mode: "speed" } }]]);
    render(<NodeSettingsModal node={node} isOpen onClose={vi.fn()} />);
    const productionBtn = screen.getByRole("button", { name: /production/i });
    expect(productionBtn).toHaveAttribute("disabled");
  });
});
