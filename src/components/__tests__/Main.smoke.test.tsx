import { act } from "react";
import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock useSpriteData to make preloadSpriteData synchronous
vi.mock("../../hooks/useSpriteData", () => ({
  preloadSpriteData: vi.fn().mockResolvedValue(undefined),
  useSpriteData: vi.fn().mockReturnValue({ spriteData: null, spriteImage: null }),
}));

// Mock ErrorBoundary to a pass-through
vi.mock("../../components/ErrorBoundary.tsx", () => ({
  ErrorBoundary: ({ children }: { children: any }) => children,
}));

// Mock ToastProvider to a pass-through
vi.mock("../../components/ToastProvider", () => ({
  ToastProvider: ({ children }: { children: any }) => children,
}));

// Mock imageFormat to make initializeImageFormatSupport synchronous
vi.mock("../../utils/imageFormat", () => ({
  initializeImageFormatSupport: vi.fn().mockResolvedValue(undefined),
}));

// Mock App to a minimal component (avoid heavy lazy trees here)
vi.mock("../../App.tsx", () => ({
  default: () => <div data-testid="app-root" />,
}));

describe("main.tsx smoke", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    vi.resetModules(); // モジュールキャッシュをクリア
  });

  it("mounts App into #root without crashing", async () => {
    // スパイを設定してから動的インポート
    const spy = vi.spyOn(document, "getElementById");

    await act(async () => {
      await import("../../main");
    });

    // getElementById が呼ばれたことを確認
    expect(spy).toHaveBeenCalledWith("root");

    // React 19の並行レンダリングでは要素の出現を待つ必要がある
    await waitFor(() => {
      const rootDiv = document.getElementById("root");
      expect(rootDiv).not.toBeNull();
      const appRoot = rootDiv?.querySelector('[data-testid="app-root"]');
      expect(appRoot).not.toBeNull();
    });
  });
});
