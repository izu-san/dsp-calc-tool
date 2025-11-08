import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { useSanitizedMarkdown } from "../useSanitizedMarkdown";

// DOMPurify モック
vi.mock("dompurify", () => ({
  default: {
    sanitize: vi.fn((content: string) => content),
  },
}));

// ReactMarkdown モック
vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

describe("useSanitizedMarkdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderMarkdownが正しく動作する", () => {
    const TestComponent = () => {
      const { renderMarkdown } = useSanitizedMarkdown();
      return renderMarkdown("# Test Heading");
    };

    const { container } = render(<TestComponent />);
    expect(container).toBeInTheDocument();
  });

  it("マークダウンコンテンツがレンダリングされる", () => {
    const TestComponent = () => {
      const { renderMarkdown } = useSanitizedMarkdown();
      return renderMarkdown("**bold** text");
    };

    const { container } = render(<TestComponent />);
    expect(container.querySelector(".markdown-content")).toBeInTheDocument();
  });

  it("DOMPurifyでサニタイズされる", async () => {
    const DOMPurify = await import("dompurify");
    const TestComponent = () => {
      const { renderMarkdown } = useSanitizedMarkdown();
      return renderMarkdown("<script>alert('xss')</script>");
    };

    render(<TestComponent />);
    expect(DOMPurify.default.sanitize).toHaveBeenCalled();
  });
});
