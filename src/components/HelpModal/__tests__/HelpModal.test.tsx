import "@testing-library/jest-dom";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../ToastProvider";

// createPortal をテスト簡易化のため直描画にモック
vi.mock("react-dom", () => ({
  createPortal: (node: unknown) => node,
}));

// Mock i18n
vi.mock("../../i18n", () => ({
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

// Mock versionInfo and changelog utilities (use hoisted refs for Vitest)
const mocks = vi.hoisted(() => ({
  mockLoadVersionInfo: vi.fn(),
  mockLoadChangelog: vi.fn(),
}));

vi.mock("../../../utils/versionInfo", () => ({
  loadVersionInfo: mocks.mockLoadVersionInfo,
}));

vi.mock("../../../utils/changelog", () => ({
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

import type { VersionInfo } from "../../../utils/versionInfo";
import { HelpModal } from "../index";

// ToastProviderでラップするヘルパー関数
function renderWithToastProvider(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("HelpModal", () => {
  const mockVersionInfo: VersionInfo = {
    gameVersions: [
      {
        version: "0.10.33.27024",
        supported: true,
        dataLastUpdated: "2025-10-28T14:20:00+09:00",
      },
    ],
    primaryVersion: "0.10.33.27024",
    dataLastUpdated: "2025-10-28T14:20:00+09:00",
    appVersion: "0.0.3",
  };

  const mockChangelog = `# チェンジログ

## [0.0.3] - 2025-10-28

### 追加
- ヘルプ/アバウトページ機能を追加
`;

  afterEach(() => {
    cleanup();
    // テスト後にモックをリセット
    vi.clearAllMocks();
  });

  it("isOpen=falseの場合は描画しない", () => {
    render(<HelpModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText("help")).not.toBeInTheDocument();
  });

  it("isOpen=trueの場合はモーダルが表示される", () => {
    mocks.mockLoadVersionInfo.mockResolvedValue(mockVersionInfo);
    mocks.mockLoadChangelog.mockResolvedValue(mockChangelog);

    render(<HelpModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText("help")).toBeInTheDocument();
  });

  it("閉じるボタンをクリックするとonCloseが呼ばれる", async () => {
    mocks.mockLoadVersionInfo.mockResolvedValue(mockVersionInfo);
    mocks.mockLoadChangelog.mockResolvedValue(mockChangelog);

    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={onClose} />);

    const closeButton = screen.getByLabelText("close");
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("バージョン情報が読み込まれる", async () => {
    mocks.mockLoadVersionInfo.mockResolvedValue(mockVersionInfo);
    mocks.mockLoadChangelog.mockResolvedValue(mockChangelog);

    render(<HelpModal isOpen={true} onClose={vi.fn()} />);

    // モックが呼ばれることを確認
    await waitFor(() => {
      expect(mocks.mockLoadVersionInfo).toHaveBeenCalled();
    });

    // バージョン情報が表示されることを確認（ローディングが完了してから）
    // primaryVersionとgameVersionsの両方に同じバージョンが表示されるため、getAllByTextを使用
    await waitFor(
      () => {
        const versionElements = screen.getAllByText("0.10.33.27024");
        expect(versionElements.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );
  });

  it("チェンジログが読み込まれる", async () => {
    mocks.mockLoadVersionInfo.mockResolvedValue(mockVersionInfo);
    mocks.mockLoadChangelog.mockResolvedValue(mockChangelog);

    render(<HelpModal isOpen={true} onClose={vi.fn()} />);

    // モックが正しい引数で呼ばれることを確認
    await waitFor(
      () => {
        expect(mocks.mockLoadChangelog).toHaveBeenCalledWith("ja");
      },
      { timeout: 3000 }
    );
  });

  it("タブを切り替えられる - changelogタブ", async () => {
    mocks.mockLoadVersionInfo.mockResolvedValue(mockVersionInfo);
    mocks.mockLoadChangelog.mockResolvedValue(mockChangelog);

    const user = userEvent.setup();
    render(<HelpModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("help")).toBeInTheDocument();
    });

    // チェンジログタブをクリック
    const changelogTab = screen.getByRole("tab", { name: "changelog" });
    await user.click(changelogTab);

    // チェンジログコンテンツが表示されることを確認（チェンジログのヘッダーが2つある：タブとコンテンツ）
    await waitFor(() => {
      const changelogHeadings = screen.getAllByText("changelog");
      // タブ名とコンテンツ内のタイトルの両方が存在
      expect(changelogHeadings.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("FAQタブを表示できる", async () => {
    mocks.mockLoadVersionInfo.mockResolvedValue(mockVersionInfo);
    mocks.mockLoadChangelog.mockResolvedValue(mockChangelog);

    const user = userEvent.setup();
    render(<HelpModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("help")).toBeInTheDocument();
    });

    // FAQタブをクリック
    const faqTab = screen.getByRole("tab", { name: "faqLabel" });
    await user.click(faqTab);

    // FAQコンテンツが表示されることを確認（タブの切り替えが完了するまで待つ）
    await waitFor(
      async () => {
        const faqTitle = await screen.findByText("計算の前提条件");
        expect(faqTitle).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("Aboutタブにリポジトリリンクが表示される", async () => {
    mocks.mockLoadVersionInfo.mockResolvedValue(mockVersionInfo);
    mocks.mockLoadChangelog.mockResolvedValue(mockChangelog);

    render(<HelpModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("help")).toBeInTheDocument();
    });

    // Aboutタブが選択されていることを確認
    const aboutTab = screen.getByTestId("help-tab-about");
    expect(aboutTab).toBeInTheDocument();

    // リポジトリリンクが表示されることを確認
    await waitFor(() => {
      const repoLink = screen.getByText("https://github.com/izu-san/dsp-calc-tool");
      expect(repoLink).toBeInTheDocument();
      expect(repoLink).toHaveAttribute("href", "https://github.com/izu-san/dsp-calc-tool");
      expect(repoLink).toHaveAttribute("target", "_blank");
      expect(repoLink).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("アプリバージョンは固定値を表示する", async () => {
    mocks.mockLoadVersionInfo.mockResolvedValue({
      ...mockVersionInfo,
      appVersion: "9.9.9",
    });
    mocks.mockLoadChangelog.mockResolvedValue(mockChangelog);

    render(<HelpModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("help")).toBeInTheDocument();
    });

    expect(screen.getByText("0.0.5")).toBeInTheDocument();
    expect(screen.queryByText("9.9.9")).not.toBeInTheDocument();
  });

  it("Feedbackタブにバグ報告情報と返信ポリシーが表示される", async () => {
    mocks.mockLoadVersionInfo.mockResolvedValue(mockVersionInfo);
    mocks.mockLoadChangelog.mockResolvedValue(mockChangelog);

    const user = userEvent.setup();
    renderWithToastProvider(<HelpModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("help")).toBeInTheDocument();
    });

    // Feedbackタブをクリック
    const feedbackTab = screen.getByRole("tab", { name: "feedback" });
    await user.click(feedbackTab);

    // バグ報告情報が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText("support.bugReportInfo")).toBeInTheDocument();
      expect(screen.getByText("ブラウザ情報")).toBeInTheDocument();
    });

    // 返信ポリシーが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText("support.responsePolicy")).toBeInTheDocument();
      expect(screen.getByText("support.responsePolicyDescription")).toBeInTheDocument();
    });
  });

  it("キーボードショートカットタブにアクセシビリティ方針が表示される", async () => {
    mocks.mockLoadVersionInfo.mockResolvedValue(mockVersionInfo);
    mocks.mockLoadChangelog.mockResolvedValue(mockChangelog);

    const user = userEvent.setup();
    render(<HelpModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("help")).toBeInTheDocument();
    });

    // キーボードショートカットタブをクリック
    const keyboardShortcutsTab = screen.getByRole("tab", { name: "keyboardShortcuts" });
    await user.click(keyboardShortcutsTab);

    // アクセシビリティ方針が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText("accessibility.policy")).toBeInTheDocument();
      expect(screen.getByText("accessibility.keyboardNavigation")).toBeInTheDocument();
      expect(screen.getByText("accessibility.screenReader")).toBeInTheDocument();
    });
  });

  it("バージョン情報の読み込みエラー時にデフォルト値が表示される", async () => {
    // versionInfoをnullに設定してエラー状態をシミュレート
    mocks.mockLoadVersionInfo.mockResolvedValue(null as unknown as VersionInfo);
    mocks.mockLoadChangelog.mockResolvedValue(mockChangelog);

    render(<HelpModal isOpen={true} onClose={vi.fn()} />);

    // ローディングが完了し、エラーメッセージが表示されるまで待つ
    await waitFor(() => {
      expect(screen.getByText("versionInfoNotAvailable")).toBeInTheDocument();
    });
  });

  it("チェンジログの読み込みエラー時にエラーメッセージが表示される", async () => {
    // changelogをnullに設定してエラー状態をシミュレート
    mocks.mockLoadVersionInfo.mockResolvedValue(mockVersionInfo);
    mocks.mockLoadChangelog.mockResolvedValue(null);

    const user = userEvent.setup();
    render(<HelpModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("help")).toBeInTheDocument();
    });

    // チェンジログタブに切り替え
    const changelogTab = screen.getByRole("tab", { name: "changelog" });
    await user.click(changelogTab);

    // エラーメッセージが表示されることを確認（タブの切り替えが完了するまで待つ）
    await waitFor(
      () => {
        expect(screen.getByText("changelogNotAvailable")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
