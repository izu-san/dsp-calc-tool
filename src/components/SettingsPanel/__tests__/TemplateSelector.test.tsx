import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, act } from "@testing-library/react";
import { TemplateSelector } from "../TemplateSelector";
import { DEFAULT_PHOTON_GENERATION_SETTINGS } from "../../../types/settings/photonGeneration";

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
        customTemplate: "customTemplate",
        createCustomTemplate: "createCustomTemplate",
        customTemplateEmptyState: "customTemplateEmptyState",
        templateName: "templateName",
        templateNote: "templateNote",
        save: "save",
        characters: "characters",
        currentSettings: "currentSettings",
        editCustomTemplate: "editCustomTemplate",
        deleteCustomTemplate: "deleteCustomTemplate",
        overwrite: "overwrite",
        overwriteWithCurrentSettings: "overwriteWithCurrentSettings",
        customTemplateConfirmOverwrite: "customTemplateConfirmOverwrite",
        delete: "delete",
        confirmDeletePlan: "confirmDeletePlan",
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

const createDefaultSettings = () => ({
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
  photonGeneration: DEFAULT_PHOTON_GENERATION_SETTINGS,
});

let customTemplatesMock: Record<string, any> = {};
let selectedTemplateMock: string | null = null;
let settingsMock = createDefaultSettings();

vi.mock("../../../stores/settingsStore", () => ({
  useSettingsStore: () => ({
    applyTemplate: mockApplyTemplate,
    customTemplates: customTemplatesMock,
    selectedTemplate: selectedTemplateMock,
    settings: settingsMock,
    createCustomTemplate: mockCreateCustomTemplate,
    updateCustomTemplate: mockUpdateCustomTemplate,
    deleteCustomTemplate: mockDeleteCustomTemplate,
    applyCustomTemplate: mockApplyCustomTemplate,
  }),
}));

describe("TemplateSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    customTemplatesMock = {};
    selectedTemplateMock = null;
    settingsMock = createDefaultSettings();
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

  describe("Custom Templates", () => {
    it("カスタムテンプレートの確認モーダルですべての設定が表示される", () => {
      const templateId = "custom-123";
      customTemplatesMock = {
        [templateId]: {
          meta: {
            id: templateId,
            name: "Custom Template",
            note: "Test",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          settings: {
            proliferator: { type: "mk3", mode: "production" },
            machineRank: {
              Smelt: "negentropy",
              Assemble: "recomposing",
              Chemical: "quantum",
              Research: "self-evolution",
              Refine: "standard",
              Particle: "standard",
            },
            conveyorBelt: { tier: "mk3", speed: 45, stackCount: 2 },
            sorter: { tier: "mk3", speed: 6 },
            alternativeRecipes: new Map([
              [1001, 2001],
              [1002, 2002],
            ]),
            miningSpeedResearch: 180,
            proliferatorMultiplier: { production: 2, speed: 1.5 },
            photonGeneration: {
              useGravitonLens: true,
              rayTransmissionEfficiency: 300,
              gravitonLensProliferator: { type: "mk2", mode: "speed" },
            },
          },
        },
      };

      render(<TemplateSelector />);

      const applyButton = screen.getByTestId(`custom-template-apply-button-${templateId}`);
      fireEvent.click(applyButton);

      const settingsPreview = screen.getByTestId("template-settings-preview");
      const preview = within(settingsPreview);

      expect(preview.getByText("conveyorBelt:")).toBeInTheDocument();
      expect(preview.getByText(/\(2 stacks\)/)).toBeInTheDocument();
      expect(preview.getByText("sorter:")).toBeInTheDocument();
      expect(preview.getByText(/MK3/)).toBeInTheDocument();
      expect(preview.getByText("proliferator:")).toBeInTheDocument();
      expect(preview.getByText(/MK3 \(productionMode\)/)).toBeInTheDocument();
      expect(preview.getByText("proliferatorMultiplier:")).toBeInTheDocument();
      expect(preview.getByText("productionMode: 2x, speedMode: 1.5x")).toBeInTheDocument();
      expect(preview.getByText("negentropySmelter")).toBeInTheDocument();
      expect(preview.getByText("recomposingAssembler")).toBeInTheDocument();
      expect(preview.getByText("quantumChemicalPlant")).toBeInTheDocument();
      expect(preview.getByText("selfEvolutionLab")).toBeInTheDocument();
      expect(preview.queryByText("oilRefinery")).toBeNull();
      expect(preview.queryByText("particleCollider")).toBeNull();
      expect(preview.getByText("miningResearch:")).toBeInTheDocument();
      expect(preview.getByText("180% (+80%)")).toBeInTheDocument();
      expect(preview.getByText("alternativeRecipe:")).toBeInTheDocument();
      expect(preview.getByText("2 items")).toBeInTheDocument();
      expect(preview.getByText("photonGeneration")).toBeInTheDocument();
      expect(preview.getByText("useGravitonLens:")).toBeInTheDocument();
      expect(preview.getByText("yes")).toBeInTheDocument();
      expect(preview.getByText("3%")).toBeInTheDocument();
      expect(preview.getByText(/gravitonLens proliferator:/)).toBeInTheDocument();
      expect(preview.getByText(/MK2 \(speedMode\)/)).toBeInTheDocument();
    });

    it("1文字のテンプレート名でもエラーにならず保存できる", () => {
      render(<TemplateSelector />);

      fireEvent.click(screen.getByTestId("create-custom-template-button"));

      const nameInput = screen.getByTestId("template-name-input");
      fireEvent.change(nameInput, { target: { value: "A" } });

      const saveButton = screen.getByTestId("create-template-save-button");
      fireEvent.click(saveButton);

      expect(mockCreateCustomTemplate).toHaveBeenCalledWith("A", undefined);
      expect(mockCreateCustomTemplate).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("template-name-error")).not.toBeInTheDocument();
    });
  });

  describe("Data Test IDs", () => {
    it("カスタムテンプレートセクションと空状態の data-testid が存在する", () => {
      render(<TemplateSelector />);

      expect(screen.getByTestId("custom-template-section")).toBeInTheDocument();
      expect(screen.getByTestId("custom-template-empty-state")).toBeInTheDocument();
    });

    it("作成モーダルの data-testid が利用できる", () => {
      render(<TemplateSelector />);

      fireEvent.click(screen.getByTestId("create-custom-template-button"));

      const modal = screen.getByTestId("create-template-modal");
      expect(modal).toBeInTheDocument();
      expect(screen.getByTestId("template-name-input")).toBeInTheDocument();
      expect(screen.getByTestId("template-note-input")).toBeInTheDocument();
      expect(screen.getByTestId("template-settings-preview")).toBeInTheDocument();
      expect(screen.getByTestId("create-template-cancel-button")).toBeInTheDocument();
      expect(screen.getByTestId("create-template-save-button")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("create-template-cancel-button"));
    });

    it("編集モーダルと削除モーダルの data-testid が利用できる", () => {
      const templateId = "custom-edit";
      const now = Date.now();
      customTemplatesMock = {
        [templateId]: {
          meta: {
            id: templateId,
            name: "Editable Template",
            note: "memo",
            createdAt: now,
            updatedAt: now,
          },
          settings: createDefaultSettings(),
        },
      };

      render(<TemplateSelector />);

      fireEvent.click(screen.getByTestId(`edit-custom-template-${templateId}`));
      expect(screen.getByTestId("edit-template-modal")).toBeInTheDocument();
      expect(screen.getByTestId("edit-template-name-input")).toBeInTheDocument();
      expect(screen.getByTestId("edit-template-note-input")).toBeInTheDocument();
      expect(screen.getByTestId("overwrite-with-current-button")).toBeInTheDocument();
      expect(screen.getByTestId("overwrite-with-current-button").textContent).toBe(
        "overwriteWithCurrentSettings"
      );
      expect(screen.getByTestId("edit-template-save-button")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("edit-template-cancel-button"));

      fireEvent.click(screen.getByTestId(`delete-custom-template-${templateId}`));
      expect(screen.getByTestId("delete-template-modal")).toBeInTheDocument();
      expect(screen.getByTestId("delete-template-cancel-button")).toBeInTheDocument();
      expect(screen.getByTestId("delete-template-confirm-button")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("delete-template-cancel-button"));
    });

    it("上書き確認モーダルの data-testid が利用できる", () => {
      const templateId = "custom-duplicate";
      const now = Date.now();
      customTemplatesMock = {
        [templateId]: {
          meta: {
            id: templateId,
            name: "Duplicate",
            note: "note",
            createdAt: now,
            updatedAt: now,
          },
          settings: createDefaultSettings(),
        },
      };

      render(<TemplateSelector />);

      fireEvent.click(screen.getByTestId("create-custom-template-button"));
      fireEvent.change(screen.getByTestId("template-name-input"), {
        target: { value: "Duplicate" },
      });
      fireEvent.click(screen.getByTestId("create-template-save-button"));

      expect(screen.getByTestId("overwrite-confirm-modal")).toBeInTheDocument();
      expect(screen.getByTestId("overwrite-confirm-cancel-button")).toBeInTheDocument();
      expect(screen.getByTestId("overwrite-confirm-button")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("overwrite-confirm-cancel-button"));
      fireEvent.click(screen.getByTestId("create-template-cancel-button"));
    });
  });

  describe("バリデーションエラーテスト", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      customTemplatesMock = {};
    });

    it("作成: 空文字の場合エラーメッセージを表示", async () => {
      render(<TemplateSelector />);
      fireEvent.click(screen.getByTestId("create-custom-template-button"));

      const nameInput = screen.getByTestId("template-name-input");
      fireEvent.change(nameInput, { target: { value: "" } });

      const saveButton = screen.getByTestId("create-template-save-button");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId("template-name-error")).toBeInTheDocument();
        expect(screen.getByTestId("template-name-error").textContent).toContain("必須");
      });
    });

    it("作成: 全角スペースのみの場合エラーメッセージを表示", async () => {
      render(<TemplateSelector />);
      fireEvent.click(screen.getByTestId("create-custom-template-button"));

      const nameInput = screen.getByTestId("template-name-input");

      fireEvent.change(nameInput, { target: { value: "　　" } });

      const saveButton = screen.getByTestId("create-template-save-button");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId("template-name-error")).toBeInTheDocument();
        expect(screen.getByTestId("template-name-error").textContent).toContain("必須");
      });
    });

    it("作成: 41文字以上の場合エラーメッセージを表示", async () => {
      render(<TemplateSelector />);
      fireEvent.click(screen.getByTestId("create-custom-template-button"));

      const nameInput = screen.getByTestId("template-name-input");
      fireEvent.change(nameInput, { target: { value: "A".repeat(41) } });

      const saveButton = screen.getByTestId("create-template-save-button");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId("template-name-error")).toBeInTheDocument();
        expect(screen.getByTestId("template-name-error").textContent).toContain("1〜40文字");
      });
    });

    it("作成: 名前の前後に空白がある場合エラーメッセージを表示", async () => {
      render(<TemplateSelector />);
      fireEvent.click(screen.getByTestId("create-custom-template-button"));

      const nameInput = screen.getByTestId("template-name-input");
      fireEvent.change(nameInput, { target: { value: " Test Template " } });

      const saveButton = screen.getByTestId("create-template-save-button");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId("template-name-error")).toBeInTheDocument();
        expect(screen.getByTestId("template-name-error").textContent).toContain("前後には空白");
      });
    });

    it("作成: 名前が重複している場合上書き確認モーダルを表示", async () => {
      const templateId = "existing-id";
      const now = Date.now();
      customTemplatesMock = {
        [templateId]: {
          meta: {
            id: templateId,
            name: "Duplicate Name",
            note: "note",
            createdAt: now,
            updatedAt: now,
          },
          settings: createDefaultSettings(),
        },
      };

      render(<TemplateSelector />);
      fireEvent.click(screen.getByTestId("create-custom-template-button"));

      const nameInput = screen.getByTestId("template-name-input");
      fireEvent.change(nameInput, { target: { value: "Duplicate Name" } });

      const saveButton = screen.getByTestId("create-template-save-button");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId("overwrite-confirm-modal")).toBeInTheDocument();
      });
    });

    it("作成: 最大数到達時にボタンがdisabledになり、モーダルが開かない", async () => {
      // 最大数（50個）のカスタムテンプレートを作成
      const maxTemplates = 50;
      customTemplatesMock = {};
      for (let i = 0; i < maxTemplates; i++) {
        const templateId = `template-${i}`;
        const now = Date.now();
        customTemplatesMock[templateId] = {
          meta: {
            id: templateId,
            name: `Template ${i}`,
            createdAt: now,
            updatedAt: now,
          },
          settings: createDefaultSettings(),
        };
      }

      render(<TemplateSelector />);
      const createButton = screen.getByTestId("create-custom-template-button");

      // ボタンがdisabledになっていることを確認
      expect(createButton).toBeDisabled();

      // クリックしてもモーダルが開かないことを確認（モーダル内の要素が見つからない）
      fireEvent.click(createButton);
      expect(screen.queryByTestId("template-name-input")).not.toBeInTheDocument();
    });

    it("編集: 空文字の場合エラーメッセージを表示", async () => {
      const templateId = "edit-id";
      const now = Date.now();
      customTemplatesMock = {
        [templateId]: {
          meta: {
            id: templateId,
            name: "Editable Template",
            note: "note",
            createdAt: now,
            updatedAt: now,
          },
          settings: createDefaultSettings(),
        },
      };

      render(<TemplateSelector />);
      fireEvent.click(screen.getByTestId(`edit-custom-template-${templateId}`));

      const nameInput = screen.getByTestId("edit-template-name-input");
      fireEvent.change(nameInput, { target: { value: "" } });

      const saveButton = screen.getByTestId("edit-template-save-button");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId("edit-template-name-error")).toBeInTheDocument();
        expect(screen.getByTestId("edit-template-name-error").textContent).toContain("必須");
      });
    });

    it("編集: メモが121文字以上の場合エラーメッセージを表示", async () => {
      const templateId = "edit-id";
      const now = Date.now();
      customTemplatesMock = {
        [templateId]: {
          meta: {
            id: templateId,
            name: "Editable Template",
            note: "note",
            createdAt: now,
            updatedAt: now,
          },
          settings: createDefaultSettings(),
        },
      };

      render(<TemplateSelector />);
      fireEvent.click(screen.getByTestId(`edit-custom-template-${templateId}`));

      const noteInput = screen.getByTestId("edit-template-note-input");
      fireEvent.change(noteInput, { target: { value: "A".repeat(121) } });

      const saveButton = screen.getByTestId("edit-template-save-button");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId("edit-template-name-error")).toBeInTheDocument();
        expect(screen.getByTestId("edit-template-name-error").textContent).toContain("120文字以内");
      });
    });

    it("編集: 名前が重複している場合エラーメッセージを表示", async () => {
      const templateId1 = "edit-id-1";
      const templateId2 = "edit-id-2";
      const now = Date.now();
      customTemplatesMock = {
        [templateId1]: {
          meta: {
            id: templateId1,
            name: "Template 1",
            createdAt: now,
            updatedAt: now,
          },
          settings: createDefaultSettings(),
        },
        [templateId2]: {
          meta: {
            id: templateId2,
            name: "Template 2",
            createdAt: now,
            updatedAt: now,
          },
          settings: createDefaultSettings(),
        },
      };

      mockUpdateCustomTemplate.mockImplementationOnce(() => {
        throw new Error("Template with this name already exists");
      });

      render(<TemplateSelector />);
      fireEvent.click(screen.getByTestId(`edit-custom-template-${templateId1}`));

      const nameInput = screen.getByTestId("edit-template-name-input");
      fireEvent.change(nameInput, { target: { value: "Template 2" } });

      const saveButton = screen.getByTestId("edit-template-save-button");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId("edit-template-name-error")).toBeInTheDocument();
        expect(screen.getByTestId("edit-template-name-error").textContent).toContain(
          "customTemplateDuplicateName"
        );
      });
    });

    it("編集: 現在の設定で上書きボタンが動作する", async () => {
      const templateId = "edit-id";
      const now = Date.now();
      customTemplatesMock = {
        [templateId]: {
          meta: {
            id: templateId,
            name: "Editable Template",
            createdAt: now,
            updatedAt: now,
          },
          settings: createDefaultSettings(),
        },
      };

      render(<TemplateSelector />);
      fireEvent.click(screen.getByTestId(`edit-custom-template-${templateId}`));

      const overwriteButton = screen.getByTestId("overwrite-with-current-button");
      fireEvent.click(overwriteButton);

      expect(mockUpdateCustomTemplate).toHaveBeenCalledWith(
        templateId,
        undefined,
        undefined,
        settingsMock
      );

      await waitFor(() => {
        expect(screen.queryByTestId("edit-template-modal")).not.toBeInTheDocument();
      });
    });

    it("作成: 上書き確認モーダルで上書きを実行", async () => {
      const templateId = "existing-id";
      const now = Date.now();
      customTemplatesMock = {
        [templateId]: {
          meta: {
            id: templateId,
            name: "Duplicate Name",
            createdAt: now,
            updatedAt: now,
          },
          settings: createDefaultSettings(),
        },
      };

      render(<TemplateSelector />);
      fireEvent.click(screen.getByTestId("create-custom-template-button"));

      const nameInput = screen.getByTestId("template-name-input");
      fireEvent.change(nameInput, { target: { value: "Duplicate Name" } });

      const saveButton = screen.getByTestId("create-template-save-button");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId("overwrite-confirm-modal")).toBeInTheDocument();
      });

      const overwriteConfirmButton = screen.getByTestId("overwrite-confirm-button");
      fireEvent.click(overwriteConfirmButton);

      expect(mockUpdateCustomTemplate).toHaveBeenCalledWith(
        templateId,
        "Duplicate Name",
        undefined,
        settingsMock
      );

      await waitFor(() => {
        expect(screen.queryByTestId("create-template-modal")).not.toBeInTheDocument();
      });
    });

    it("作成: 上書き確認モーダルでキャンセル", async () => {
      const templateId = "existing-id";
      const now = Date.now();
      customTemplatesMock = {
        [templateId]: {
          meta: {
            id: templateId,
            name: "Duplicate Name",
            createdAt: now,
            updatedAt: now,
          },
          settings: createDefaultSettings(),
        },
      };

      render(<TemplateSelector />);
      fireEvent.click(screen.getByTestId("create-custom-template-button"));

      const nameInput = screen.getByTestId("template-name-input");
      fireEvent.change(nameInput, { target: { value: "Duplicate Name" } });

      const saveButton = screen.getByTestId("create-template-save-button");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId("overwrite-confirm-modal")).toBeInTheDocument();
      });

      const overwriteCancelButton = screen.getByTestId("overwrite-confirm-cancel-button");
      fireEvent.click(overwriteCancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId("overwrite-confirm-modal")).not.toBeInTheDocument();
        expect(screen.getByTestId("create-template-modal")).toBeInTheDocument();
      });
    });
  });

  describe("Escキーでモーダルを閉じる", () => {
    it("作成モーダルが開いているときにEscキーで閉じる", async () => {
      render(<TemplateSelector />);
      fireEvent.click(screen.getByTestId("create-custom-template-button"));

      await waitFor(() => {
        expect(screen.getByTestId("create-template-modal")).toBeInTheDocument();
      });

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(screen.queryByTestId("create-template-modal")).not.toBeInTheDocument();
      });
    });

    it("編集モーダルが開いているときにEscキーで閉じる", async () => {
      const templateId = "edit-id";
      const now = Date.now();
      customTemplatesMock = {
        [templateId]: {
          meta: {
            id: templateId,
            name: "Editable Template",
            createdAt: now,
            updatedAt: now,
          },
          settings: createDefaultSettings(),
        },
      };

      render(<TemplateSelector />);
      fireEvent.click(screen.getByTestId(`edit-custom-template-${templateId}`));

      await waitFor(() => {
        expect(screen.getByTestId("edit-template-modal")).toBeInTheDocument();
      });

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(screen.queryByTestId("edit-template-modal")).not.toBeInTheDocument();
      });
    });

    it("削除確認モーダルが開いているときにEscキーで閉じる", async () => {
      const templateId = "delete-id";
      const now = Date.now();
      customTemplatesMock = {
        [templateId]: {
          meta: {
            id: templateId,
            name: "Deletable Template",
            createdAt: now,
            updatedAt: now,
          },
          settings: createDefaultSettings(),
        },
      };

      render(<TemplateSelector />);
      fireEvent.click(screen.getByTestId(`delete-custom-template-${templateId}`));

      await waitFor(() => {
        expect(screen.getByTestId("delete-template-modal")).toBeInTheDocument();
      });

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(screen.queryByTestId("delete-template-modal")).not.toBeInTheDocument();
      });
    });

    it("デフォルトテンプレート確認モーダルが開いているときにEscキーで閉じる", async () => {
      render(<TemplateSelector />);
      fireEvent.click(screen.getByTestId("template-button-earlyGame"));

      await waitFor(() => {
        expect(screen.getByTestId("template-confirm-modal")).toBeInTheDocument();
      });

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(screen.queryByTestId("template-confirm-modal")).not.toBeInTheDocument();
      });
    });

    it("カスタムテンプレート確認モーダルが開いているときにEscキーで閉じる", async () => {
      const templateId = "custom-id";
      const now = Date.now();
      customTemplatesMock = {
        [templateId]: {
          meta: {
            id: templateId,
            name: "Custom Template",
            createdAt: now,
            updatedAt: now,
          },
          settings: createDefaultSettings(),
        },
      };

      render(<TemplateSelector />);
      fireEvent.click(screen.getByTestId(`custom-template-apply-button-${templateId}`));

      await waitFor(() => {
        expect(screen.getByTestId("custom-template-confirm-modal")).toBeInTheDocument();
      });

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(screen.queryByTestId("custom-template-confirm-modal")).not.toBeInTheDocument();
      });
    });

    it("上書き確認モーダルが開いているときにEscキーで閉じる", async () => {
      const templateId = "existing-id";
      const now = Date.now();
      customTemplatesMock = {
        [templateId]: {
          meta: {
            id: templateId,
            name: "Duplicate Name",
            createdAt: now,
            updatedAt: now,
          },
          settings: createDefaultSettings(),
        },
      };

      render(<TemplateSelector />);
      fireEvent.click(screen.getByTestId("create-custom-template-button"));

      const nameInput = screen.getByTestId("template-name-input");
      fireEvent.change(nameInput, { target: { value: "Duplicate Name" } });

      const saveButton = screen.getByTestId("create-template-save-button");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId("overwrite-confirm-modal")).toBeInTheDocument();
      });

      // イベントリスナーが登録されるまで少し待つ
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Escキーを押す
      await act(async () => {
        const event = new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        });
        window.dispatchEvent(event);
      });

      await waitFor(
        () => {
          expect(screen.queryByTestId("overwrite-confirm-modal")).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });
});
