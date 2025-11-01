import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SettingsPanel } from "../index";
import type { RecipeTreeNode } from "../../../types";
import { useRecipeSelectionStore } from "../../../stores/recipeSelectionStore";
import { useGameDataStore } from "../../../stores/gameDataStore";

// i18n モック
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

// 子コンポーネントを簡素化
vi.mock("../ProliferatorSettings", () => ({
  ProliferatorSettings: () => <div data-testid="proliferator-settings" />,
}));
vi.mock("../MachineRankSettings", () => ({
  MachineRankSettings: () => <div data-testid="machine-rank-settings" />,
}));
vi.mock("../ConveyorBeltSettings", () => ({
  ConveyorBeltSettings: () => <div data-testid="conveyor-belt-settings" />,
}));
vi.mock("../TemplateSelector", () => ({
  TemplateSelector: () => <div data-testid="template-selector" />,
}));
vi.mock("../../AlternativeRecipeSelector", () => ({
  AlternativeRecipeSelector: () => <div data-testid="alternative-recipe-selector" />,
}));
vi.mock("../../WhatIfSimulator", () => ({
  WhatIfSimulator: () => <div data-testid="whatif-simulator" />,
}));

// ストアモック
vi.mock("../../../stores/recipeSelectionStore", () => ({
  useRecipeSelectionStore: vi.fn(() => ({ selectedRecipe: null, calculationResult: null })),
}));
vi.mock("../../../stores/gameDataStore", () => ({
  useGameDataStore: vi.fn(() => ({
    data: { recipes: new Map(), recipesByItemId: new Map() },
  })),
}));

describe("SettingsPanel coverage additions", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("hasAlternatives=false の時は AlternativeRecipeSelector を表示しない", () => {
    // selectedRecipe あり + calculationResult ありだが、recipesByItemId は単一
    (useRecipeSelectionStore as ReturnType<typeof vi.fn>).mockReturnValue({
      selectedRecipe: { SID: 2001, name: "R", Results: [{ id: 1001, quantity: 1 }] },
      calculationResult: {
        rootNode: {
          nodeId: "root",
          recipe: { SID: 2001, name: "R", Items: [{ id: 1001, quantity: 1 }] },
          itemName: "X",
          itemId: 1001,
          isRawMaterial: false,
          targetOutputRate: 1,
          inputs: [],
          power: { total: 0, machines: 0, sorters: 0 },
          conveyorBelts: { inputs: 0, outputs: 0, total: 0, saturation: 0 },
          proliferator: { type: "none", mode: "speed" },
          children: [],
        } as RecipeTreeNode,
      },
    });
    (useGameDataStore as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { recipes: new Map(), recipesByItemId: new Map([[1001, [{ SID: 2001 }]]]) },
    });

    render(<SettingsPanel />);
    expect(screen.queryByTestId("alternative-recipe-selector")).not.toBeInTheDocument();
    // WhatIfSimulator は selectedRecipe があるので表示
    expect(screen.getByTestId("whatif-simulator")).toBeInTheDocument();
  });

  it("ツリー走査で子ノードのアイテムが代替持ちの場合に AlternativeRecipeSelector を表示", () => {
    // ルート: item 1001（単一）、子: item 2002（複数レシピあり）
    const child: RecipeTreeNode = {
      nodeId: "child",
      recipe: { SID: 3001, name: "ChildR", Items: [{ id: 2002, quantity: 1 }] } as any,
      itemName: "Child",
      itemId: 2002,
      isRawMaterial: false,
      targetOutputRate: 1,
      inputs: [],
      power: { total: 0, machines: 0, sorters: 0 },
      conveyorBelts: { inputs: 0, outputs: 0, total: 0, saturation: 0 },
      proliferator: { type: "none", mode: "speed" },
      children: [],
    };
    const root: RecipeTreeNode = {
      nodeId: "root",
      recipe: { SID: 2001, name: "RootR", Items: [{ id: 1001, quantity: 1 }] } as any,
      itemName: "Root",
      itemId: 1001,
      isRawMaterial: false,
      targetOutputRate: 1,
      inputs: [],
      power: { total: 0, machines: 0, sorters: 0 },
      conveyorBelts: { inputs: 0, outputs: 0, total: 0, saturation: 0 },
      proliferator: { type: "none", mode: "speed" },
      children: [child],
    };

    (useRecipeSelectionStore as ReturnType<typeof vi.fn>).mockReturnValue({
      selectedRecipe: { SID: 2001, name: "R", Results: [{ id: 1001, quantity: 1 }] },
      calculationResult: { rootNode: root },
    });
    (useGameDataStore as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        recipes: new Map(),
        recipesByItemId: new Map<number, any>([
          [1001, [{ SID: 2001 }]],
          [2002, [{ SID: 3001 }, { SID: 3002 }]], // 子ノードのアイテムが複数レシピ
        ]),
      },
    });

    render(<SettingsPanel />);
    expect(screen.getByTestId("alternative-recipe-selector")).toBeInTheDocument();
    expect(screen.getByTestId("whatif-simulator")).toBeInTheDocument();
  });

  it("selectedRecipe が無ければ WhatIfSimulator は表示されない", () => {
    (useRecipeSelectionStore as ReturnType<typeof vi.fn>).mockReturnValue({
      selectedRecipe: null,
      calculationResult: null,
    });

    render(<SettingsPanel />);
    expect(screen.queryByTestId("whatif-simulator")).not.toBeInTheDocument();
  });
});
