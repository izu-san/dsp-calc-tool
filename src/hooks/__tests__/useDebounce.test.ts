import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "../useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("初期値を即座に返す", () => {
    const { result } = renderHook(() => useDebounce("initial", 300));

    expect(result.current).toBe("initial");
  });

  it("値が変更されてもdelay時間内は古い値を返す", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "initial", delay: 300 },
    });

    expect(result.current).toBe("initial");

    // 値を変更
    rerender({ value: "updated", delay: 300 });

    // まだ古い値
    expect(result.current).toBe("initial");

    // 100ms 経過
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe("initial");

    // 200ms 経過（合計300ms）
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe("updated");
  });

  it("delay時間経過後に新しい値を返す", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "initial", delay: 300 },
    });

    rerender({ value: "updated", delay: 300 });

    // 300ms 経過
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("updated");
  });

  it("値が連続で変更される場合、最後の値のみが反映される", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "initial", delay: 300 },
    });

    // 複数回変更
    rerender({ value: "update1", delay: 300 });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: "update2", delay: 300 });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: "update3", delay: 300 });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // まだ古い値
    expect(result.current).toBe("initial");

    // 最後の変更から300ms経過
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // 最後の値のみが反映される
    expect(result.current).toBe("update3");
  });

  it("異なるdelay時間が指定できる", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "initial", delay: 500 },
    });

    rerender({ value: "updated", delay: 500 });

    // 300ms 経過（まだ足りない）
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("initial");

    // さらに200ms 経過（合計500ms）
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe("updated");
  });

  it("数値型の値もデバウンスできる", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 0, delay: 300 },
    });

    expect(result.current).toBe(0);

    rerender({ value: 42, delay: 300 });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe(42);
  });

  it("オブジェクト型の値もデバウンスできる", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: { name: "initial" }, delay: 300 },
    });

    expect(result.current).toEqual({ name: "initial" });

    const newValue = { name: "updated" };
    rerender({ value: newValue, delay: 300 });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toEqual(newValue);
  });

  it("delay が 0 の場合、即座に値が反映される", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "initial", delay: 0 },
    });

    rerender({ value: "updated", delay: 0 });

    // タイマーを進める
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current).toBe("updated");
  });
});
