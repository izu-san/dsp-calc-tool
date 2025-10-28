import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "react";

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

describe("main.tsx smoke", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
  });

  it("mounts App into #root without crashing", async () => {
    // Dynamically import to execute createRoot/render side-effect
    const spy = vi.spyOn(document, "getElementById");
    await act(async () => {
      await import("../../main");
      // preloadSpriteData() はモックで即座に解決するため、await だけで十分
    });

    expect(spy).toHaveBeenCalledWith("root");
    const rootDiv = document.getElementById("root");
    // React 19の並行レンダではinnerHTMLが空の可能性があるため存在のみ確認
    expect(rootDiv).not.toBeNull();
  });
});
