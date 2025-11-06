import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelpMenu } from "../HelpMenu";

// createPortal をテスト簡易化のため直描画にモック
vi.mock("react-dom", () => ({
  createPortal: (node: unknown) => node,
}));

// Mock i18n
vi.mock("../../../../i18n", () => ({
  default: {
    language: "ja",
    changeLanguage: vi.fn(),
  },
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { returnObjects?: boolean }) => {
      if (opts?.returnObjects) {
        if (key === "faq.categories") {
          return {
            calculation: {
              title: "計算の前提条件",
              questions: [
                {
                  question: "テスト質問1",
                  answer: "テスト回答1",
                },
              ],
            },
          };
        }
        if (key === "support.bugReportInfoItems") {
          return ["ブラウザ情報", "ゲームバージョン"];
        }
      }
      return key;
    },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
}));

// Mock versionInfo and changelog utilities
const mocks = vi.hoisted(() => ({
  mockLoadVersionInfo: vi.fn(),
  mockLoadChangelog: vi.fn(),
}));

vi.mock("../../../../utils/versionInfo", () => ({
  loadVersionInfo: mocks.mockLoadVersionInfo,
}));

vi.mock("../../../../utils/changelog", () => ({
  loadChangelog: mocks.mockLoadChangelog,
}));

// Mock environment variables
Object.defineProperty(import.meta, "env", {
  value: {
    APP_VERSION: "0.0.3",
    BUILD_TIME: "2025-10-28T14:20:00Z",
    GITHUB_REPO_URL: "https://github.com/izu-san/dsp-calc-tool",
  },
  writable: true,
});

describe("HelpMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockLoadVersionInfo.mockResolvedValue({
      gameVersions: [],
      primaryVersion: "0.0.0",
      dataLastUpdated: "",
      appVersion: "0.0.3",
    });
    mocks.mockLoadChangelog.mockResolvedValue("# Changelog");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render help menu trigger", () => {
    render(<HelpMenu />);
    const trigger = screen.getByTestId("help-menu-trigger");
    expect(trigger).toBeInTheDocument();
  });

  it("should open help modal when F1 is pressed", async () => {
    const user = userEvent.setup();
    render(<HelpMenu />);

    // Simulate F1
    await user.keyboard("{F1}");

    await waitFor(() => {
      const modal = screen.queryByTestId("help-modal");
      expect(modal).toBeInTheDocument();
    });
  });

  it("should open help modal when Ctrl+? is pressed", async () => {
    const user = userEvent.setup();
    render(<HelpMenu />);

    // Simulate Ctrl+?
    await user.keyboard("{Control>}?{/Control}");

    await waitFor(() => {
      const modal = screen.queryByTestId("help-modal");
      expect(modal).toBeInTheDocument();
    });
  });

  it("should close help modal when Esc is pressed", async () => {
    const user = userEvent.setup();
    render(<HelpMenu />);

    // Open modal
    const trigger = screen.getByTestId("help-menu-trigger");
    await user.click(trigger);

    await waitFor(() => {
      const modal = screen.queryByTestId("help-modal");
      expect(modal).toBeInTheDocument();
    });

    // Close modal with Esc
    await user.keyboard("{Escape}");

    // Wait for modal to close
    await waitFor(
      () => {
        const modal = screen.queryByTestId("help-modal");
        expect(modal).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("should not open modal when typing in input field", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <HelpMenu />
        <input data-testid="test-input" />
      </div>
    );

    const input = screen.getByTestId("test-input");
    await user.click(input);
    await user.keyboard("{F1}");

    const modal = screen.queryByTestId("help-modal");
    expect(modal).not.toBeInTheDocument();
  });

  it("should have aria-label attribute", () => {
    render(<HelpMenu />);
    const trigger = screen.getByTestId("help-menu-trigger");
    expect(trigger).toHaveAttribute("aria-label");
  });
});

describe("HelpMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render help menu trigger", () => {
    render(<HelpMenu />);
    const trigger = screen.getByTestId("help-menu-trigger");
    expect(trigger).toBeInTheDocument();
  });

  it("should open help modal when F1 is pressed", async () => {
    const user = userEvent.setup();
    render(<HelpMenu />);

    // Simulate F1
    await user.keyboard("{F1}");

    await waitFor(() => {
      const modal = screen.queryByTestId("help-modal");
      expect(modal).toBeInTheDocument();
    });
  });

  it("should open help modal when Ctrl+? is pressed", async () => {
    const user = userEvent.setup();
    render(<HelpMenu />);

    // Simulate Ctrl+?
    await user.keyboard("{Control>}?{/Control}");

    await waitFor(() => {
      const modal = screen.queryByTestId("help-modal");
      expect(modal).toBeInTheDocument();
    });
  });

  it("should close help modal when Esc is pressed", async () => {
    const user = userEvent.setup();
    render(<HelpMenu />);

    // Open modal
    const trigger = screen.getByTestId("help-menu-trigger");
    await user.click(trigger);

    await waitFor(() => {
      const modal = screen.queryByTestId("help-modal");
      expect(modal).toBeInTheDocument();
    });

    // Close modal with Esc
    await user.keyboard("{Escape}");

    // Wait for modal to close
    await waitFor(() => {
      const modal = screen.queryByTestId("help-modal");
      expect(modal).not.toBeInTheDocument();
    });
  });

  it("should not open modal when typing in input field", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <HelpMenu />
        <input data-testid="test-input" />
      </div>
    );

    const input = screen.getByTestId("test-input");
    await user.click(input);
    await user.keyboard("{F1}");

    const modal = screen.queryByTestId("help-modal");
    expect(modal).not.toBeInTheDocument();
  });

  it("should have aria-label attribute", () => {
    render(<HelpMenu />);
    const trigger = screen.getByTestId("help-menu-trigger");
    expect(trigger).toHaveAttribute("aria-label");
  });
});
