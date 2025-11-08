import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { bootstrap } from "../startup";

// モック
vi.mock("react-dom/client", () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
  })),
}));

vi.mock("../../App", () => ({
  default: () => <div>App</div>,
}));

vi.mock("../../components/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("../../components/ToastProvider", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("../../hooks/useSpriteData", () => ({
  preloadSpriteData: vi.fn(() => Promise.resolve()),
}));

vi.mock("../../utils/imageFormat", () => ({
  initializeImageFormatSupport: vi.fn(() => Promise.resolve()),
}));

vi.mock("../../utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("bootstrap", () => {
  let mockRootElement: HTMLElement;

  beforeEach(() => {
    // DOM要素をセットアップ
    mockRootElement = document.createElement("div");
    mockRootElement.id = "root";
    document.body.appendChild(mockRootElement);

    vi.clearAllMocks();
  });

  afterEach(() => {
    // DOM要素をクリーンアップ
    if (mockRootElement.parentNode) {
      mockRootElement.parentNode.removeChild(mockRootElement);
    }
  });

  it("bootstrapが正常に実行される", async () => {
    const { createRoot } = await import("react-dom/client");

    await expect(bootstrap()).resolves.not.toThrow();

    expect(createRoot).toHaveBeenCalledWith(mockRootElement);
  });

  it("root要素が存在しない場合、エラーを投げる", async () => {
    // root要素を削除
    if (mockRootElement.parentNode) {
      mockRootElement.parentNode.removeChild(mockRootElement);
    }

    await expect(bootstrap()).rejects.toThrow("Root element not found");
  });

  it("スプライトデータのプリロードが失敗してもアプリはレンダリングされる", async () => {
    const { preloadSpriteData } = await import("../../hooks/useSpriteData");
    const { logger } = await import("../../utils/logger");

    vi.mocked(preloadSpriteData).mockRejectedValueOnce(new Error("Preload failed"));

    await expect(bootstrap()).resolves.not.toThrow();

    expect(logger.warn).toHaveBeenCalled();
  });
});
