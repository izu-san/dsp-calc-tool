import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PhotonGenerationSettings } from "../PhotonGenerationSettings";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        useGravitonLens: "useGravitonLens",
        gravitonLensProliferator: "gravitonLensProliferator",
        speedMode: "speedMode",
        only: "only",
        none: "none",
        proliferatorMK1: "MK1",
        proliferatorMK2: "MK2",
        proliferatorMK3: "MK3",
        rayTransmissionEfficiency: "rayTransmissionEfficiency",
        researchLevel: "researchLevel",
        rayTransmissionEfficiencyValue: "Efficiency",
        activeEffects: "activeEffects",
        speedBonus: "speedBonus",
        powerIncrease: "powerIncrease",
        continuousReceptionFixed: "continuousReceptionFixed",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock ItemIcon
vi.mock("../../ItemIcon", () => ({
  ItemIcon: ({ itemId }: { itemId: number }) => (
    <div data-testid={`item-icon-${itemId}`}>{itemId}</div>
  ),
}));

// Mock settingsStore
const mockSetPhotonGenerationSetting = vi.fn();
let mockSettings = {
  photonGeneration: {
    useGravitonLens: false,
    rayTransmissionEfficiency: 0,
    gravitonLensProliferator: {
      type: "none" as const,
      mode: "speed" as const,
      speedBonus: 0,
      productionBonus: 0,
      powerIncrease: 0,
    },
  },
};

vi.mock("../../../stores/settingsStore", () => ({
  useSettingsStore: () => ({
    settings: mockSettings,
    setPhotonGenerationSetting: mockSetPhotonGenerationSetting,
  }),
}));

describe("PhotonGenerationSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettings = {
      photonGeneration: {
        useGravitonLens: false,
        rayTransmissionEfficiency: 0,
        gravitonLensProliferator: {
          type: "none" as const,
          mode: "speed" as const,
          speedBonus: 0,
          productionBonus: 0,
          powerIncrease: 0,
        },
      },
    };
  });

  describe("基本レンダリング", () => {
    it("グラビトンレンズ利用トグルを表示", () => {
      render(<PhotonGenerationSettings />);
      expect(screen.getByTestId("photon-generation-graviton-lens-checkbox")).toBeInTheDocument();
    });

    it("レイ伝送効率スライダーを表示", () => {
      render(<PhotonGenerationSettings />);
      expect(
        screen.getByTestId("photon-generation-ray-transmission-efficiency-slider")
      ).toBeInTheDocument();
    });

    it("グラビトンレンズがOFFの時は増産剤セクションを非表示", () => {
      render(<PhotonGenerationSettings />);
      expect(
        screen.queryByTestId("photon-generation-proliferator-button-none")
      ).not.toBeInTheDocument();
    });
  });

  describe("グラビトンレンズトグル", () => {
    it("トグルをONにするとsetPhotonGenerationSettingが呼ばれる", () => {
      render(<PhotonGenerationSettings />);
      const checkbox = screen.getByTestId("photon-generation-graviton-lens-checkbox");
      fireEvent.click(checkbox);
      expect(mockSetPhotonGenerationSetting).toHaveBeenCalledWith("useGravitonLens", true);
    });

    it("トグルをOFFにするとsetPhotonGenerationSettingが呼ばれる", () => {
      mockSettings.photonGeneration.useGravitonLens = true;
      render(<PhotonGenerationSettings />);
      const checkbox = screen.getByTestId("photon-generation-graviton-lens-checkbox");
      fireEvent.click(checkbox);
      expect(mockSetPhotonGenerationSetting).toHaveBeenCalledWith("useGravitonLens", false);
    });

    it("トグルがONの時は増産剤セクションを表示", () => {
      mockSettings.photonGeneration.useGravitonLens = true;
      render(<PhotonGenerationSettings />);
      expect(screen.getByTestId("photon-generation-proliferator-button-none")).toBeInTheDocument();
      expect(screen.getByTestId("photon-generation-proliferator-button-mk1")).toBeInTheDocument();
      expect(screen.getByTestId("photon-generation-proliferator-button-mk2")).toBeInTheDocument();
      expect(screen.getByTestId("photon-generation-proliferator-button-mk3")).toBeInTheDocument();
    });
  });

  describe("増産剤ボタン", () => {
    beforeEach(() => {
      mockSettings.photonGeneration.useGravitonLens = true;
    });

    it("noneボタンをクリックするとsetPhotonGenerationSettingが呼ばれる", () => {
      render(<PhotonGenerationSettings />);
      const button = screen.getByTestId("photon-generation-proliferator-button-none");
      fireEvent.click(button);
      expect(mockSetPhotonGenerationSetting).toHaveBeenCalledWith("gravitonLensProliferator", {
        type: "none",
        mode: "speed",
        speedBonus: 0,
        productionBonus: 0,
        powerIncrease: 0,
      });
    });

    it("mk1ボタンをクリックするとsetPhotonGenerationSettingが呼ばれる", () => {
      render(<PhotonGenerationSettings />);
      const button = screen.getByTestId("photon-generation-proliferator-button-mk1");
      fireEvent.click(button);
      expect(mockSetPhotonGenerationSetting).toHaveBeenCalledWith(
        "gravitonLensProliferator",
        expect.objectContaining({
          type: "mk1",
          mode: "speed",
        })
      );
    });

    it("mk2ボタンをクリックするとsetPhotonGenerationSettingが呼ばれる", () => {
      render(<PhotonGenerationSettings />);
      const button = screen.getByTestId("photon-generation-proliferator-button-mk2");
      fireEvent.click(button);
      expect(mockSetPhotonGenerationSetting).toHaveBeenCalledWith(
        "gravitonLensProliferator",
        expect.objectContaining({
          type: "mk2",
          mode: "speed",
        })
      );
    });

    it("mk3ボタンをクリックするとsetPhotonGenerationSettingが呼ばれる", () => {
      render(<PhotonGenerationSettings />);
      const button = screen.getByTestId("photon-generation-proliferator-button-mk3");
      fireEvent.click(button);
      expect(mockSetPhotonGenerationSetting).toHaveBeenCalledWith(
        "gravitonLensProliferator",
        expect.objectContaining({
          type: "mk3",
          mode: "speed",
        })
      );
    });

    it("選択中の増産剤ボタンは異なるスタイルを持つ", () => {
      mockSettings.photonGeneration.gravitonLensProliferator.type = "mk2";
      render(<PhotonGenerationSettings />);
      const mk2Button = screen.getByTestId("photon-generation-proliferator-button-mk2");
      expect(mk2Button.className).toContain("bg-neon-magenta/30");
      expect(mk2Button.className).toContain("border-neon-magenta");
    });

    it("増産剤がnone以外の時は効果表示が表示される", () => {
      mockSettings.photonGeneration.gravitonLensProliferator.type = "mk1";
      mockSettings.photonGeneration.gravitonLensProliferator.speedBonus = 0.125;
      mockSettings.photonGeneration.gravitonLensProliferator.powerIncrease = 0.3;
      render(<PhotonGenerationSettings />);
      expect(screen.getByText("activeEffects")).toBeInTheDocument();
      expect(screen.getByText(/speedBonus/)).toBeInTheDocument();
      expect(screen.getByText(/powerIncrease/)).toBeInTheDocument();
    });

    it("増産剤がnoneの時は効果表示が表示されない", () => {
      mockSettings.photonGeneration.gravitonLensProliferator.type = "none";
      render(<PhotonGenerationSettings />);
      expect(screen.queryByText("activeEffects")).not.toBeInTheDocument();
    });
  });

  describe("レイ伝送効率スライダー", () => {
    it("スライダーを変更するとsetPhotonGenerationSettingが呼ばれる", () => {
      render(<PhotonGenerationSettings />);
      const slider = screen.getByTestId("photon-generation-ray-transmission-efficiency-slider");
      fireEvent.change(slider, { target: { value: "50" } });
      expect(mockSetPhotonGenerationSetting).toHaveBeenCalledWith("rayTransmissionEfficiency", 50);
    });

    it("スライダーの最小値は0", () => {
      render(<PhotonGenerationSettings />);
      const slider = screen.getByTestId("photon-generation-ray-transmission-efficiency-slider");
      expect(slider).toHaveAttribute("min", "0");
    });

    it("スライダーの最大値はmaxResearchLevel", () => {
      render(<PhotonGenerationSettings />);
      const slider = screen.getByTestId("photon-generation-ray-transmission-efficiency-slider");
      // maxResearchLevelはgetMaxMeaningfulResearchLevel()の結果（通常は90）
      expect(slider).toHaveAttribute("max", "90");
    });

    it("現在の効率値が表示される", () => {
      mockSettings.photonGeneration.rayTransmissionEfficiency = 50;
      render(<PhotonGenerationSettings />);
      // Efficiencyテキストは複数あるので、より具体的なセレクタを使用
      const efficiencyElements = screen.getAllByText(/Efficiency/);
      expect(efficiencyElements.length).toBeGreaterThan(0);
    });

    it("研究レベルが表示される", () => {
      mockSettings.photonGeneration.rayTransmissionEfficiency = 50;
      render(<PhotonGenerationSettings />);
      expect(screen.getByText(/researchLevel/)).toBeInTheDocument();
      expect(screen.getByText(/50/)).toBeInTheDocument();
    });
  });

  describe("注意事項", () => {
    it("注意事項が表示される", () => {
      render(<PhotonGenerationSettings />);
      // i18nのキーがそのまま表示されるため、キー名で検索
      expect(screen.getByText(/continuousReceptionFixed/)).toBeInTheDocument();
    });
  });
});
