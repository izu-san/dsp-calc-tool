import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MachineRankSettings } from "../MachineRankSettings";
import { useSettingsStore } from "../../../stores/settingsStore";

// i18nextのモック
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
}));

// ストアのモック
vi.mock("../../../stores/settingsStore");

// gameDataStoreのモック
vi.mock("../../../stores/gameDataStore", () => ({
  getMachineById: (id: number) => {
    const machines: Record<number, { id: number; name: string }> = {
      2302: { id: 2302, name: "Arc Smelter" },
      2315: { id: 2315, name: "Plane Smelter" },
      2319: { id: 2319, name: "Negentropy Smelter" },
      2303: { id: 2303, name: "Assembling Machine Mk.I" },
      2304: { id: 2304, name: "Assembling Machine Mk.II" },
      2305: { id: 2305, name: "Assembling Machine Mk.III" },
      2318: { id: 2318, name: "Re-composing Assembler" },
      2309: { id: 2309, name: "Chemical Plant" },
      2317: { id: 2317, name: "Quantum Chemical Plant" },
      2901: { id: 2901, name: "Matrix Lab" },
      2902: { id: 2902, name: "Self-evolution Lab" },
    };
    return machines[id] || null;
  },
}));

// ItemIconコンポーネントのモック
vi.mock("../../ItemIcon", () => ({
  ItemIcon: ({ itemId }: { itemId: number }) => <div data-testid={`item-icon-${itemId}`} />,
}));

describe("MachineRankSettings", () => {
  const mockSetMachineRank = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      settings: {
        machineRank: {
          Smelt: "arc",
          Assemble: "mk1",
          Chemical: "standard",
          Research: "standard",
          Refine: "standard",
          Particle: "standard",
        },
      },
      setMachineRank: mockSetMachineRank,
    });
  });

  describe("Smelt (Smelter) Settings", () => {
    it("すべてのSmelterオプションを表示する", () => {
      render(<MachineRankSettings />);

      expect(screen.getByText("Arc Smelter")).toBeInTheDocument();
      expect(screen.getByText("Plane Smelter")).toBeInTheDocument();
      expect(screen.getByText("Negentropy Smelter")).toBeInTheDocument();
    });

    it("選択されたSmelter (arc) をハイライト表示する", () => {
      render(<MachineRankSettings />);

      const arcButton = screen.getByText("Arc Smelter").closest("button");
      expect(arcButton).toHaveAttribute("aria-pressed", "true");
      expect(arcButton).toHaveClass("ring-1", "border-primary-300");
      expect(arcButton).toHaveTextContent("✓");
    });

    it("Plane Smelterを選択できる", () => {
      render(<MachineRankSettings />);

      const planeButton = screen.getByText("Plane Smelter").closest("button");
      fireEvent.click(planeButton!);

      expect(mockSetMachineRank).toHaveBeenCalledWith("Smelt", "plane");
    });

    it("Negentropy Smelterを選択できる", () => {
      render(<MachineRankSettings />);

      const negentropyButton = screen.getByText("Negentropy Smelter").closest("button");
      fireEvent.click(negentropyButton!);

      expect(mockSetMachineRank).toHaveBeenCalledWith("Smelt", "negentropy");
    });

    it("Smelterアイコンを表示する", () => {
      render(<MachineRankSettings />);

      expect(screen.getByTestId("item-icon-2302")).toBeInTheDocument(); // Arc
      expect(screen.getByTestId("item-icon-2315")).toBeInTheDocument(); // Plane
      expect(screen.getByTestId("item-icon-2319")).toBeInTheDocument(); // Negentropy
    });
  });

  describe("Assemble (Assembler) Settings", () => {
    it("すべてのAssemblerオプションを表示する", () => {
      render(<MachineRankSettings />);

      expect(screen.getByText("Assembling Machine Mk.I")).toBeInTheDocument();
      expect(screen.getByText("Assembling Machine Mk.II")).toBeInTheDocument();
      expect(screen.getByText("Assembling Machine Mk.III")).toBeInTheDocument();
      expect(screen.getByText("Re-composing Assembler")).toBeInTheDocument();
    });

    it("選択されたAssembler (mk1) をハイライト表示する", () => {
      render(<MachineRankSettings />);

      const mk1Button = screen.getByText("Assembling Machine Mk.I").closest("button");
      expect(mk1Button).toHaveAttribute("aria-pressed", "true");
      expect(mk1Button).toHaveClass("ring-1", "border-primary-300");
      expect(mk1Button).toHaveTextContent("✓");
    });

    it("Assembler Mk.IIを選択できる", () => {
      render(<MachineRankSettings />);

      const mk2Button = screen.getByText("Assembling Machine Mk.II").closest("button");
      fireEvent.click(mk2Button!);

      expect(mockSetMachineRank).toHaveBeenCalledWith("Assemble", "mk2");
    });

    it("Assembler Mk.IIIを選択できる", () => {
      render(<MachineRankSettings />);

      const mk3Button = screen.getByText("Assembling Machine Mk.III").closest("button");
      fireEvent.click(mk3Button!);

      expect(mockSetMachineRank).toHaveBeenCalledWith("Assemble", "mk3");
    });

    it("Re-composing Assemblerを選択できる", () => {
      render(<MachineRankSettings />);

      const recomposingButton = screen.getByText("Re-composing Assembler").closest("button");
      fireEvent.click(recomposingButton!);

      expect(mockSetMachineRank).toHaveBeenCalledWith("Assemble", "recomposing");
    });

    it("Assemblerアイコンを表示する", () => {
      render(<MachineRankSettings />);

      expect(screen.getByTestId("item-icon-2303")).toBeInTheDocument(); // Mk.I
      expect(screen.getByTestId("item-icon-2304")).toBeInTheDocument(); // Mk.II
      expect(screen.getByTestId("item-icon-2305")).toBeInTheDocument(); // Mk.III
      expect(screen.getByTestId("item-icon-2318")).toBeInTheDocument(); // Recomposing
    });
  });

  describe("Chemical Plant Settings", () => {
    it("すべてのChemical Plantオプションを表示する", () => {
      render(<MachineRankSettings />);

      expect(screen.getByText("Chemical Plant")).toBeInTheDocument();
      expect(screen.getByText("Quantum Chemical Plant")).toBeInTheDocument();
    });

    it("選択されたChemical Plant (standard) をハイライト表示する", () => {
      render(<MachineRankSettings />);

      const standardButton = screen.getByText("Chemical Plant").closest("button");
      expect(standardButton).toHaveAttribute("aria-pressed", "true");
      expect(standardButton).toHaveClass("ring-1", "border-primary-300");
      expect(standardButton).toHaveTextContent("✓");
    });

    it("Quantum Chemical Plantを選択できる", () => {
      render(<MachineRankSettings />);

      const quantumButton = screen.getByText("Quantum Chemical Plant").closest("button");
      fireEvent.click(quantumButton!);

      expect(mockSetMachineRank).toHaveBeenCalledWith("Chemical", "quantum");
    });

    it("Chemical Plantアイコンを表示する", () => {
      render(<MachineRankSettings />);

      expect(screen.getByTestId("item-icon-2309")).toBeInTheDocument(); // Standard
      expect(screen.getByTestId("item-icon-2317")).toBeInTheDocument(); // Quantum
    });
  });

  describe("Research (Matrix Lab) Settings", () => {
    it("すべてのMatrix Labオプションを表示する", () => {
      render(<MachineRankSettings />);

      expect(screen.getByText("Matrix Lab")).toBeInTheDocument();
      expect(screen.getByText("Self-evolution Lab")).toBeInTheDocument();
    });

    it("選択されたMatrix Lab (standard) をハイライト表示する", () => {
      render(<MachineRankSettings />);

      const standardButton = screen.getByText("Matrix Lab").closest("button");
      expect(standardButton).toHaveAttribute("aria-pressed", "true");
      expect(standardButton).toHaveClass("ring-1", "border-primary-300");
      expect(standardButton).toHaveTextContent("✓");
    });

    it("Self-evolution Labを選択できる", () => {
      render(<MachineRankSettings />);

      const selfEvoButton = screen.getByText("Self-evolution Lab").closest("button");
      fireEvent.click(selfEvoButton!);

      expect(mockSetMachineRank).toHaveBeenCalledWith("Research", "self-evolution");
    });

    it("Matrix Labアイコンを表示する", () => {
      render(<MachineRankSettings />);

      expect(screen.getByTestId("item-icon-2901")).toBeInTheDocument(); // Standard
      expect(screen.getByTestId("item-icon-2902")).toBeInTheDocument(); // Self-evolution
    });
  });

  describe("Speed Descriptions", () => {
    it("各マシンのスピード説明を表示する", () => {
      render(<MachineRankSettings />);

      // Assembler speeds
      expect(screen.getByText("0.75x speed")).toBeInTheDocument();
      expect(screen.getByText("1.5x speed")).toBeInTheDocument();
      // 全マシンの説明数: Smelt 3 + Assemble 4 + Chemical 2 + Research 2 = 11
      expect(screen.getAllByText(/\dx speed/)).toHaveLength(11);
    });
  });

  describe("UI Interaction", () => {
    it("すべてのボタンがホバー状態を持つ", () => {
      render(<MachineRankSettings />);

      const arcButton = screen.getByText("Arc Smelter").closest("button");
      expect(arcButton).toHaveClass("transition-colors");
    });

    it("選択されたボタンが視覚的に強調される", () => {
      render(<MachineRankSettings />);

      const arcButton = screen.getByText("Arc Smelter").closest("button");
      expect(arcButton).toHaveClass("ring-1", "border-primary-300");
    });

    it("複数のmachineTypeを独立して設定できる", () => {
      render(<MachineRankSettings />);

      // Smelt を plane に変更
      const planeButton = screen.getByText("Plane Smelter").closest("button");
      fireEvent.click(planeButton!);
      expect(mockSetMachineRank).toHaveBeenCalledWith("Smelt", "plane");

      // Assemble を mk3 に変更
      const mk3Button = screen.getByText("Assembling Machine Mk.III").closest("button");
      fireEvent.click(mk3Button!);
      expect(mockSetMachineRank).toHaveBeenCalledWith("Assemble", "mk3");

      // Chemical を quantum に変更
      const quantumButton = screen.getByText("Quantum Chemical Plant").closest("button");
      fireEvent.click(quantumButton!);
      expect(mockSetMachineRank).toHaveBeenCalledWith("Chemical", "quantum");

      // Research を self-evolution に変更
      const selfEvoButton = screen.getByText("Self-evolution Lab").closest("button");
      fireEvent.click(selfEvoButton!);
      expect(mockSetMachineRank).toHaveBeenCalledWith("Research", "self-evolution");

      expect(mockSetMachineRank).toHaveBeenCalledTimes(4);
    });
  });

  describe("Different Initial States", () => {
    it("Plane Smelterが初期選択されている場合のハイライト", () => {
      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        settings: {
          machineRank: {
            Smelt: "plane",
            Assemble: "mk1",
            Chemical: "standard",
            Research: "standard",
            Refine: "standard",
            Particle: "standard",
          },
        },
        setMachineRank: mockSetMachineRank,
      });

      render(<MachineRankSettings />);

      const planeButton = screen.getByText("Plane Smelter").closest("button");
      expect(planeButton).toHaveAttribute("aria-pressed", "true");
      expect(planeButton).toHaveTextContent("✓");
    });

    it("すべて最高ランクが選択されている場合", () => {
      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        settings: {
          machineRank: {
            Smelt: "negentropy",
            Assemble: "recomposing",
            Chemical: "quantum",
            Research: "self-evolution",
            Refine: "standard",
            Particle: "standard",
          },
        },
        setMachineRank: mockSetMachineRank,
      });

      render(<MachineRankSettings />);

      expect(screen.getByText("Negentropy Smelter").closest("button")).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByText("Re-composing Assembler").closest("button")).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByText("Quantum Chemical Plant").closest("button")).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByText("Self-evolution Lab").closest("button")).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    });
  });

  describe("Section Labels", () => {
    it("各セクションのラベルを表示する", () => {
      const { container } = render(<MachineRankSettings />);

      // labelタグから正確に検索
      const labels = container.querySelectorAll("label");
      const labelTexts = Array.from(labels).map(label => label.textContent);

      expect(labelTexts.some(text => text?.includes("smelter"))).toBe(true);
      expect(labelTexts.some(text => text?.includes("assembler"))).toBe(true);
      expect(labelTexts.some(text => text?.includes("chemicalPlant"))).toBe(true);
      expect(labelTexts.some(text => text?.includes("matrixLab"))).toBe(true);
    });

    it("各セクションのラベルに装飾絵文字を含めない", () => {
      const { container } = render(<MachineRankSettings />);

      const labels = container.querySelectorAll("label");
      const labelTexts = Array.from(labels).map(label => label.textContent);

      expect(labelTexts.some(text => text?.includes("🔥"))).toBe(false);
      expect(labelTexts.some(text => text?.includes("⚙️"))).toBe(false);
      expect(labelTexts.some(text => text?.includes("🧪"))).toBe(false);
      expect(labelTexts.some(text => text?.includes("🔬"))).toBe(false);
    });
  });
});
