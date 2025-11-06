import { act } from "react";
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

// Mock App to a minimal component (avoid heavy lazy trees here)
vi.mock("../../App.tsx", () => ({
  default: () => <div data-testid="app-root" />,
}));

// Mock bootstrap/startup to spy on getElementById
vi.mock("../../bootstrap/startup", () => {
  let mockBootstrap: any;
  return {
    bootstrap: vi.fn(async () => {
      const rootElement = document.getElementById("root");
      if (!rootElement) {
        throw new Error("Root element not found");
      }
      // Simulate createRoot and render
      const { createRoot } = await import("react-dom/client");
      const { default: App } = await import("../../App");
      const root = createRoot(rootElement);
      root.render(<App />);
    }),
  };
});

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
      // bootstrap() が完了するまで少し待つ
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // getElementById が呼ばれたことを確認
    expect(spy).toHaveBeenCalledWith("root");
    const rootDiv = document.getElementById("root");
    // React 19の並行レンダではinnerHTMLが空の可能性があるため存在のみ確認
    expect(rootDiv).not.toBeNull();
    expect(rootDiv?.querySelector('[data-testid="app-root"]')).not.toBeNull();
  });
});
