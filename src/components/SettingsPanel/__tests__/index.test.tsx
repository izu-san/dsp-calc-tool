import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsPanel } from "../index";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        proliferator: "proliferator",
        machineRank: "machineRank",
        conveyorBelt: "conveyorBelt",
        alternativeRecipes: "alternativeRecipes",
      };
      return translations[key] || key;
    },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: () => {},
  },
}));

// Mock子コンポーネント
vi.mock("../ProliferatorSettings", () => ({
  ProliferatorSettings: () => <div data-testid="proliferator-settings">ProliferatorSettings</div>,
}));

vi.mock("../MachineRankSettings", () => ({
  MachineRankSettings: () => <div data-testid="machine-rank-settings">MachineRankSettings</div>,
}));

vi.mock("../ConveyorBeltSettings", () => ({
  ConveyorBeltSettings: () => <div data-testid="conveyor-belt-settings">ConveyorBeltSettings</div>,
}));

vi.mock("../TemplateSelector", () => ({
  TemplateSelector: () => <div data-testid="template-selector">TemplateSelector</div>,
}));

vi.mock("../../AlternativeRecipeSelector", () => ({
  AlternativeRecipeSelector: () => (
    <div data-testid="alternative-recipe-selector">AlternativeRecipeSelector</div>
  ),
}));

vi.mock("../../WhatIfSimulator", () => ({
  WhatIfSimulator: () => <div data-testid="whatif-simulator">WhatIfSimulator</div>,
}));

// Mock stores
vi.mock("../../stores/recipeSelectionStore", () => ({
  useRecipeSelectionStore: () => ({
    selectedRecipe: null,
    calculationResult: null,
  }),
}));

vi.mock("../../stores/gameDataStore", () => ({
  useGameDataStore: () => ({
    data: null,
  }),
}));

describe("SettingsPanel", () => {
  describe("Basic Rendering", () => {
    it("常に表示される基本コンポーネントをレンダリングする", () => {
      render(<SettingsPanel />);

      expect(screen.getByTestId("template-selector")).toBeInTheDocument();
      expect(screen.getByTestId("proliferator-settings")).toBeInTheDocument();
      expect(screen.getByTestId("machine-rank-settings")).toBeInTheDocument();
      expect(screen.getByTestId("conveyor-belt-settings")).toBeInTheDocument();
    });

    it("各セクションのタイトルを表示する", () => {
      render(<SettingsPanel />);

      expect(screen.getByText(/proliferator/)).toBeInTheDocument();
      expect(screen.getByText(/machineRank/)).toBeInTheDocument();
      expect(screen.getByText(/conveyorBelt/)).toBeInTheDocument();
    });

    it("各セクションのタイトルに装飾絵文字を含めない", () => {
      const { container } = render(<SettingsPanel />);

      const headings = container.querySelectorAll("h4");
      const headingTexts = Array.from(headings).map(h => h.textContent);

      expect(headingTexts.some(text => text?.includes("💊"))).toBe(false);
      expect(headingTexts.some(text => text?.includes("🏭"))).toBe(false);
      expect(headingTexts.some(text => text?.includes("🛤️"))).toBe(false);
    });
  });

  describe("Conditional Sections", () => {
    it("選択レシピが無い場合 WhatIfSimulator は表示されない", () => {
      render(<SettingsPanel />);
      expect(screen.queryByTestId("whatif-simulator")).not.toBeInTheDocument();
    });

    it("代替レシピが存在しない場合は AlternativeRecipeSelector は表示されない", () => {
      render(<SettingsPanel />);
      expect(screen.queryByTestId("alternative-recipe-selector")).not.toBeInTheDocument();
    });

    it("代替レシピが無ければ AlternativeRecipeSelector は表示されない", async () => {
      vi.resetModules();
      // 子コンポーネントを再モック
      vi.doMock("../../AlternativeRecipeSelector", () => ({
        AlternativeRecipeSelector: () => (
          <div data-testid="alternative-recipe-selector">AlternativeRecipeSelector</div>
        ),
      }));
      const mockCalc = {
        rootNode: {
          recipe: { Items: [{ id: 1001 }] },
          children: [],
        },
      } as any;

      vi.doMock("../../stores/recipeSelectionStore", () => ({
        useRecipeSelectionStore: () => ({
          selectedRecipe: { SID: 2001, name: "Test" },
          calculationResult: mockCalc,
        }),
      }));
      // recipesByItemId に 1001 のレシピを1件のみ
      const recipesByItemId = new Map<number, any[]>([[1001, [{ id: 1 }]]]);
      vi.doMock("../../stores/gameDataStore", () => ({
        useGameDataStore: () => ({ data: { recipesByItemId } }),
      }));

      const { SettingsPanel: DynamicSettingsPanel } = await import("../index");
      render(<DynamicSettingsPanel />);
      expect(screen.queryByTestId("alternative-recipe-selector")).not.toBeInTheDocument();
    });
  });

  describe("Component Integration", () => {
    it("TemplateSelector が最初に表示される", () => {
      render(<SettingsPanel />);

      const templateSelector = screen.getByTestId("template-selector");
      const proliferatorSettings = screen.getByTestId("proliferator-settings");

      // template-selector should appear before proliferator-settings in DOM order
      expect(templateSelector.compareDocumentPosition(proliferatorSettings)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING
      );
    });

    it("すべてのコンポーネントが正しい順序で表示される", () => {
      const { container } = render(<SettingsPanel />);

      const allTestIds = Array.from(container.querySelectorAll("[data-testid]")).map(el =>
        el.getAttribute("data-testid")
      );

      expect(allTestIds).toEqual([
        "settings-panel",
        "template-selector",
        "proliferator-settings",
        "machine-rank-settings",
        "conveyor-belt-settings",
      ]);
    });
  });

  describe("UI Structure", () => {
    it("各セクションが適切なクラス名を持つ", () => {
      const { container } = render(<SettingsPanel />);

      const sections = container.querySelectorAll(".bg-dark-800\\/45");
      expect(sections.length).toBeGreaterThanOrEqual(3); // At least 3 base sections
    });

    it("各セクションがホバー効果を持つ", () => {
      const { container } = render(<SettingsPanel />);

      const sections = container.querySelectorAll(".hover-lift");
      expect(sections.length).toBeGreaterThanOrEqual(3);
    });

    it("各セクションに境界線が設定されている", () => {
      render(<SettingsPanel />);

      const proliferatorSection = screen.getByText(/proliferator/).closest("div");
      expect(proliferatorSection?.className).toContain("border-space-700");

      const machineRankSection = screen.getByText(/machineRank/).closest("div");
      expect(machineRankSection?.className).toContain("border-space-700");

      const conveyorBeltSection = screen.getByText(/conveyorBelt/).closest("div");
      expect(conveyorBeltSection?.className).toContain("border-space-700");
    });
  });

  describe("Edge Cases", () => {
    it("空の状態でもクラッシュせずにレンダリングされる", () => {
      expect(() => render(<SettingsPanel />)).not.toThrow();
    });

    it("プロップがなくても正常に動作する", () => {
      const { container } = render(<SettingsPanel />);
      expect(container).toBeTruthy();
      expect(container.querySelector('[data-testid="template-selector"]')).toBeInTheDocument();
    });
  });
});
