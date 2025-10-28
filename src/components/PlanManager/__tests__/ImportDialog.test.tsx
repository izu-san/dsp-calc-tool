import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImportDialog } from "../ImportDialog";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("ImportDialog", () => {
  const mockRecentPlans = [
    { key: "plan-1", name: "Test Plan 1", timestamp: 1705320000000 },
    { key: "plan-2", name: "Test Plan 2", timestamp: 1705330000000 },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onImportFile: vi.fn(),
    onLoadFromLocalStorage: vi.fn(),
    onDeletePlan: vi.fn(),
    recentPlans: mockRecentPlans,
    mergeOverridesDefault: false,
    onMergeOverridesChange: vi.fn(),
  };

  it("ダイアログが開いているときにレンダリングされる", () => {
    render(<ImportDialog {...defaultProps} />);
    expect(screen.getByRole("heading", { name: /load/i })).toBeInTheDocument();
  });

  it("ダイアログが閉じているときにレンダリングされない", () => {
    render(<ImportDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole("heading", { name: /load/i })).not.toBeInTheDocument();
  });

  it("ファイル入力フィールドが表示される", () => {
    render(<ImportDialog {...defaultProps} />);
    const fileInput = screen.getByLabelText(/loadFromFile/i);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute("type", "file");
    expect(fileInput).toHaveAttribute("accept", ".json,.md,.markdown");
  });

  it("recent plansが表示される", () => {
    render(<ImportDialog {...defaultProps} />);
    expect(screen.getByText("Test Plan 1")).toBeInTheDocument();
    expect(screen.getByText("Test Plan 2")).toBeInTheDocument();
  });

  it("recent plansがない場合のメッセージ表示", () => {
    render(<ImportDialog {...defaultProps} recentPlans={[]} />);
    expect(screen.getByText("noPlans")).toBeInTheDocument();
  });

  it("LoadボタンをクリックするとonLoadFromLocalStorageが呼ばれる", () => {
    const onLoadFromLocalStorage = vi.fn();
    render(<ImportDialog {...defaultProps} onLoadFromLocalStorage={onLoadFromLocalStorage} />);

    const loadButtons = screen.getAllByRole("button", { name: /^load$/i });
    fireEvent.click(loadButtons[0]); // First plan's load button

    expect(onLoadFromLocalStorage).toHaveBeenCalledWith("plan-1");
  });

  it("DeleteボタンをクリックするとonDeletePlanが呼ばれる", () => {
    const onDeletePlan = vi.fn();
    render(<ImportDialog {...defaultProps} onDeletePlan={onDeletePlan} />);

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteButtons[0]); // First plan's delete button

    expect(onDeletePlan).toHaveBeenCalledWith("plan-1");
  });

  it("CloseボタンをクリックするとonCloseが呼ばれる", () => {
    const onClose = vi.fn();
    render(<ImportDialog {...defaultProps} onClose={onClose} />);

    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("mergeOverridesチェックボックスが表示される", () => {
    render(<ImportDialog {...defaultProps} />);
    const checkbox = screen.getByRole("checkbox", { name: /mergeNodeOverridesOnLoad/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it("mergeOverridesチェックボックスのトグル", () => {
    const onMergeOverridesChange = vi.fn();
    render(<ImportDialog {...defaultProps} onMergeOverridesChange={onMergeOverridesChange} />);

    const checkbox = screen.getByRole("checkbox", { name: /mergeNodeOverridesOnLoad/i });
    fireEvent.click(checkbox);

    expect(onMergeOverridesChange).toHaveBeenCalledWith(true);
  });

  it("mergeOverridesDefaultがtrueの場合、チェックボックスがchecked", () => {
    render(<ImportDialog {...defaultProps} mergeOverridesDefault={true} />);
    const checkbox = screen.getByRole("checkbox", {
      name: /mergeNodeOverridesOnLoad/i,
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it("ファイル選択時にonImportFileが呼ばれる", () => {
    const onImportFile = vi.fn();
    render(<ImportDialog {...defaultProps} onImportFile={onImportFile} />);

    const fileInput = screen.getByLabelText(/loadFromFile/i) as HTMLInputElement;
    const file = new File(["test content"], "test-plan.json", { type: "application/json" });

    Object.defineProperty(fileInput, "files", {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    expect(onImportFile).toHaveBeenCalledWith(file);
  });

  it("ファイルが選択されていない場合は何も起こらない", () => {
    const onImportFile = vi.fn();
    render(<ImportDialog {...defaultProps} onImportFile={onImportFile} />);

    const fileInput = screen.getByLabelText(/loadFromFile/i) as HTMLInputElement;

    Object.defineProperty(fileInput, "files", {
      value: [],
      writable: false,
    });

    fireEvent.change(fileInput);

    expect(onImportFile).not.toHaveBeenCalled();
  });

  it("タイムスタンプが正しくフォーマットされて表示される", () => {
    render(<ImportDialog {...defaultProps} />);
    // Note: toLocaleString() output depends on system locale, so we just check it exists
    const timestamps = screen.getAllByText(/\d+\/\d+\/\d+/);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it("複数のプランが正しく表示される", () => {
    const manyPlans = [
      { key: "plan-1", name: "Plan 1", timestamp: Date.now() },
      { key: "plan-2", name: "Plan 2", timestamp: Date.now() },
      { key: "plan-3", name: "Plan 3", timestamp: Date.now() },
    ];

    render(<ImportDialog {...defaultProps} recentPlans={manyPlans} />);

    expect(screen.getByText("Plan 1")).toBeInTheDocument();
    expect(screen.getByText("Plan 2")).toBeInTheDocument();
    expect(screen.getByText("Plan 3")).toBeInTheDocument();

    const loadButtons = screen.getAllByRole("button", { name: /^load$/i });
    expect(loadButtons).toHaveLength(3);

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    expect(deleteButtons).toHaveLength(3);
  });

  it("サポートされている形式の説明が表示される", () => {
    render(<ImportDialog {...defaultProps} />);
    expect(screen.getByText(/supportedFormats/i)).toBeInTheDocument();
  });
});
