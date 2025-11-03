import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TemplateSelector } from "../TemplateSelector";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        template: "template",
        earlyGame: "earlyGame",
        midGame: "midGame",
        lateGame: "lateGame",
        endGame: "endGame",
        powerSaver: "powerSaver",
        earlyGameDesc: "earlyGameDesc",
        midGameDesc: "midGameDesc",
        lateGameDesc: "lateGameDesc",
        endGameDesc: "endGameDesc",
        powerSaverDesc: "powerSaverDesc",
        applyQuestion: "applyQuestion",
        conveyorBelt: "conveyorBelt",
        sorter: "sorter",
        proliferator: "proliferator",
        miningResearch: "miningResearch",
        stacks: "stacks",
        pilingSorter: "pilingSorter",
        none: "none",
        productionMode: "productionMode",
        speedMode: "speedMode",
        cancel: "cancel",
        apply: "apply",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock settingsStore
const mockApplyTemplate = vi.fn();
const mockCreateCustomTemplate = vi.fn();
const mockUpdateCustomTemplate = vi.fn();
const mockDeleteCustomTemplate = vi.fn();
const mockApplyCustomTemplate = vi.fn();
vi.mock("../../../stores/settingsStore", () => ({
  useSettingsStore: () => ({
    applyTemplate: mockApplyTemplate,
    customTemplates: {},
    selectedTemplate: null,
    settings: {
      proliferator: { type: "none", mode: "speed" },
      machineRank: {
        Smelt: "arc",
        Assemble: "mk1",
        Chemical: "standard",
        Research: "standard",
        Refine: "standard",
        Particle: "standard",
      },
      conveyorBelt: { tier: "mk1", speed: 6, stackCount: 1 },
      sorter: { tier: "mk1", speed: 2 },
      alternativeRecipes: new Map(),
      miningSpeedResearch: 100,
      proliferatorMultiplier: { production: 1, speed: 1 },
      photonGeneration: {},
    },
    createCustomTemplate: mockCreateCustomTemplate,
    updateCustomTemplate: mockUpdateCustomTemplate,
    deleteCustomTemplate: mockDeleteCustomTemplate,
    applyCustomTemplate: mockApplyCustomTemplate,
  }),
}));

describe("TemplateSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Template Buttons", () => {
    it("すべてのメインテンプレートボタンを表示する", () => {
      render(<TemplateSelector />);

      expect(screen.getByText("earlyGame")).toBeInTheDocument();
      expect(screen.getByText("midGame")).toBeInTheDocument();
      expect(screen.getByText("lateGame")).toBeInTheDocument();
      expect(screen.getByText("endGame")).toBeInTheDocument();
    });

    it("Power Saverテンプレートボタンを表示する", () => {
      render(<TemplateSelector />);

      expect(screen.getByText("powerSaver")).toBeInTheDocument();
    });

    it("すべてのテンプレートアイコンを表示する", () => {
      const { container } = render(<TemplateSelector />);

      const buttons = container.querySelectorAll("button");
      const buttonTexts = Array.from(buttons).map(btn => btn.textContent);

      expect(buttonTexts.some(text => text?.includes("🌱"))).toBe(true); // earlyGame
      expect(buttonTexts.some(text => text?.includes("⚙️"))).toBe(true); // midGame
      expect(buttonTexts.some(text => text?.includes("🚀"))).toBe(true); // lateGame
      expect(buttonTexts.some(text => text?.includes("⭐"))).toBe(true); // endGame
      expect(buttonTexts.some(text => text?.includes("💡"))).toBe(true); // powerSaver
    });

    it("各テンプレートボタンにtitle属性が設定されている", () => {
      render(<TemplateSelector />);

      const earlyGameButton = screen.getByText("earlyGame").closest("button");
      expect(earlyGameButton).toHaveAttribute("title", "earlyGameDesc");

      const powerSaverButton = screen.getByText("powerSaver").closest("button");
      expect(powerSaverButton).toHaveAttribute("title", "powerSaverDesc");
    });
  });

  describe("Confirmation Modal", () => {
    it("テンプレートボタンをクリックすると確認モーダルが表示される", () => {
      render(<TemplateSelector />);

      const earlyGameButton = screen.getByText("earlyGame");
      fireEvent.click(earlyGameButton);

      expect(screen.getByText(/earlyGame applyQuestion/)).toBeInTheDocument();
      expect(screen.getByText("earlyGameDesc")).toBeInTheDocument();
    });

    it("モーダルに選択されたテンプレートのアイコンが表示される", () => {
      render(<TemplateSelector />);

      const earlyGameButton = screen.getByText("earlyGame");
      fireEvent.click(earlyGameButton);

      // Portal経由でdocument.bodyにレンダリングされるため、全体から検索
      const modalContent = document.body.querySelector(".max-w-md"); // Modal container
      expect(modalContent).toBeTruthy();
      expect(modalContent?.textContent).toContain("🌱");
    });

    it("モーダルに設定の詳細が表示される（Early Game）", () => {
      render(<TemplateSelector />);

      const earlyGameButton = screen.getByText("earlyGame");
      fireEvent.click(earlyGameButton);

      // Conveyor Belt: Mk.と1が別々の要素になっているため、textContentで確認
      const beltSettings = screen.getByText("conveyorBelt:").nextElementSibling;
      expect(beltSettings?.textContent).toContain("Mk.");
      expect(beltSettings?.textContent).toContain("1");

      // Proliferator: none
      expect(screen.getByText("none")).toBeInTheDocument();

      // Mining Research: 100%
      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    it("モーダルに設定の詳細が表示される（End Game with stacked belts）", () => {
      render(<TemplateSelector />);

      const endGameButton = screen.getByText("endGame");
      fireEvent.click(endGameButton);

      // Conveyor Belt: Mk.と3が別々の要素、(4 stacks)も確認
      const beltSettings = screen.getByText("conveyorBelt:").nextElementSibling;
      expect(beltSettings?.textContent).toContain("Mk.");
      expect(beltSettings?.textContent).toContain("3");
      expect(screen.getByText(/4 stacks/)).toBeInTheDocument();

      // Sorter: Piling Sorter
      expect(screen.getByText("pilingSorter")).toBeInTheDocument();

      // Proliferator: MK3 (speedMode)
      expect(screen.getByText(/MK3/)).toBeInTheDocument();
      expect(screen.getByText(/speedMode/)).toBeInTheDocument();

      // Mining Research: 200%
      expect(screen.getByText(/200%/)).toBeInTheDocument();
    });

    it("モーダルに設定の詳細が表示される（Power Saver with production mode）", () => {
      render(<TemplateSelector />);

      const powerSaverButton = screen.getByText("powerSaver");
      fireEvent.click(powerSaverButton);

      // Proliferator: MK3 (productionMode)
      expect(screen.getByText(/MK3/)).toBeInTheDocument();
      expect(screen.getByText(/productionMode/)).toBeInTheDocument();
    });
  });

  describe("Modal Actions", () => {
    it("Cancelボタンをクリックするとモーダルが閉じる", async () => {
      render(<TemplateSelector />);

      const earlyGameButton = screen.getByText("earlyGame");
      fireEvent.click(earlyGameButton);

      expect(screen.getByText(/earlyGame applyQuestion/)).toBeInTheDocument();

      const cancelButton = screen.getByText("cancel");
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/earlyGame applyQuestion/)).not.toBeInTheDocument();
      });
    });

    it("ApplyボタンをクリックするとapplyTemplateが呼ばれる", async () => {
      render(<TemplateSelector />);

      const midGameButton = screen.getByText("midGame");
      fireEvent.click(midGameButton);

      const applyButton = screen.getByText("apply");
      fireEvent.click(applyButton);

      expect(mockApplyTemplate).toHaveBeenCalledWith("midGame");
      expect(mockApplyTemplate).toHaveBeenCalledTimes(1);

      // モーダルが閉じることを確認
      await waitFor(() => {
        expect(screen.queryByText(/midGame applyQuestion/)).not.toBeInTheDocument();
      });
    });

    it("異なるテンプレートでApplyを実行すると正しいIDが渡される", () => {
      render(<TemplateSelector />);

      // Test lateGame
      const lateGameButton = screen.getByText("lateGame");
      fireEvent.click(lateGameButton);

      const applyButton1 = screen.getByText("apply");
      fireEvent.click(applyButton1);

      expect(mockApplyTemplate).toHaveBeenCalledWith("lateGame");

      // Test powerSaver
      const powerSaverButton = screen.getByText("powerSaver");
      fireEvent.click(powerSaverButton);

      const applyButton2 = screen.getByText("apply");
      fireEvent.click(applyButton2);

      expect(mockApplyTemplate).toHaveBeenCalledWith("powerSaver");
      expect(mockApplyTemplate).toHaveBeenCalledTimes(2);
    });
  });

  describe("UI States", () => {
    it("初期状態ではモーダルは表示されない", () => {
      render(<TemplateSelector />);

      expect(screen.queryByText(/applyQuestion/)).not.toBeInTheDocument();
      expect(screen.queryByText("cancel")).not.toBeInTheDocument();
      expect(screen.queryByText("apply")).not.toBeInTheDocument();
    });

    it("異なるテンプレートをクリックするとモーダルの内容が更新される", () => {
      render(<TemplateSelector />);

      // Click Early Game first
      const earlyGameButton = screen.getByText("earlyGame");
      fireEvent.click(earlyGameButton);

      expect(screen.getByText(/earlyGame applyQuestion/)).toBeInTheDocument();
      expect(screen.getByText("none")).toBeInTheDocument(); // No proliferator

      // Cancel modal
      const cancelButton1 = screen.getByText("cancel");
      fireEvent.click(cancelButton1);

      // Click Late Game
      const lateGameButton = screen.getByText("lateGame");
      fireEvent.click(lateGameButton);

      expect(screen.getByText(/lateGame applyQuestion/)).toBeInTheDocument();
      expect(screen.getByText(/MK2/)).toBeInTheDocument(); // MK2 proliferator
    });

    it("ボタンにホバー効果のクラスが設定されている", () => {
      render(<TemplateSelector />);

      const earlyGameButton = screen.getByText("earlyGame").closest("button");
      expect(earlyGameButton?.className).toContain("hover:scale-105");
      expect(earlyGameButton?.className).toContain("transition-all");
    });

    it("Power Saverボタンは異なるスタイルを持つ", () => {
      render(<TemplateSelector />);

      const powerSaverButton = screen.getByText("powerSaver").closest("button");
      const earlyGameButton = screen.getByText("earlyGame").closest("button");

      // Power Saver uses neon-green
      expect(powerSaverButton?.className).toContain("border-neon-green");
      expect(powerSaverButton?.className).toContain("bg-neon-green");

      // Early Game uses neon-blue
      expect(earlyGameButton?.className).toContain("border-neon-blue");
      expect(earlyGameButton?.className).toContain("bg-neon-blue");
    });
  });

  describe("Label Display", () => {
    it("ラベルに絵文字とテキストが表示される", () => {
      const { container } = render(<TemplateSelector />);

      const labels = container.querySelectorAll("label");
      const labelTexts = Array.from(labels).map(label => label.textContent);

      expect(labelTexts.some(text => text?.includes("🎮"))).toBe(true);
      expect(labelTexts.some(text => text?.includes("template"))).toBe(true);
    });
  });
});
