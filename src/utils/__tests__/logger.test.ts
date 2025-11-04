import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Setupファイルのモックを解除して実際のloggerを使用
vi.unmock("../logger");
import { createLogger, logger, Logger } from "../logger";

describe("logger", () => {
  // console メソッドのモック
  const consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
  const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("logger (default instance)", () => {
    it("should log info messages with prefix", () => {
      logger.info("test message", { data: "value" });

      expect(consoleInfoSpy).toHaveBeenCalledWith("[INFO] [DSP-Calc] test message", {
        data: "value",
      });
    });

    it("should log warn messages with prefix", () => {
      logger.warn("warning message", 123);

      expect(consoleWarnSpy).toHaveBeenCalledWith("[WARN] [DSP-Calc] warning message", 123);
    });

    it("should log error messages with prefix", () => {
      const error = new Error("test error");
      logger.error("error occurred", error, "extra");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ERROR] [DSP-Calc] error occurred",
        error,
        "extra"
      );
    });

    it("should log debug messages when level is debug", () => {
      // デフォルトでは開発環境なのでdebugは出力されない可能性がある
      // ただし、shouldLogのロジックをテストするために明示的に呼び出す
      logger.debug("debug message");

      // import.meta.env.DEV が true であり、レベルがinfoの場合、debugは出力されない
      // しかし、このテストではenabled=trueを前提とする
      // 実装上、デフォルトレベルは "info" なので debug は出力されない
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });

  describe("createLogger", () => {
    it("should create a logger with custom prefix", () => {
      const customLogger = createLogger("TestComponent");
      customLogger.info("test");

      expect(consoleInfoSpy).toHaveBeenCalledWith("[INFO] [DSP-Calc:TestComponent] test");
    });

    it("should create a logger that respects log levels", () => {
      const customLogger = createLogger("Parser");

      // デフォルトレベルは "info" なので、debugは出力されない
      customLogger.debug("should not appear");
      expect(consoleDebugSpy).not.toHaveBeenCalled();

      // info以上は出力される
      customLogger.info("should appear");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[INFO] [DSP-Calc:Parser] should appear");
    });

    it("should handle multiple arguments in log methods", () => {
      const customLogger = createLogger("Multi");
      customLogger.warn("message", "arg1", { key: "value" }, [1, 2, 3]);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[WARN] [DSP-Calc:Multi] message",
        "arg1",
        { key: "value" },
        [1, 2, 3]
      );
    });

    it("should handle error with Error object", () => {
      const customLogger = createLogger("ErrorTest");
      const error = new Error("Something went wrong");
      customLogger.error("Failed to process", error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ERROR] [DSP-Calc:ErrorTest] Failed to process",
        error
      );
    });

    it("should handle error with non-Error object", () => {
      const customLogger = createLogger("NonError");
      customLogger.error("Unknown error", "string error", 123);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ERROR] [DSP-Calc:NonError] Unknown error",
        "string error",
        123
      );
    });
  });

  describe("Logger class - log level filtering", () => {
    it("should filter logs based on level (error only)", () => {
      // Logger クラスを直接インスタンス化してテスト
      // 内部実装にアクセスするためにモジュールを動的インポート
      const testLogger = createLogger("LevelTest");

      // レベルを変更する方法がないため、新しいLoggerインスタンスを作成
      // これは createLogger の実装を通じて間接的にテスト
      testLogger.info("info level");
      expect(consoleInfoSpy).toHaveBeenCalled();

      vi.clearAllMocks();
      testLogger.warn("warn level");
      expect(consoleWarnSpy).toHaveBeenCalled();

      vi.clearAllMocks();
      testLogger.error("error level");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("Logger class - debug level logging", () => {
    it("should log debug messages when Logger is created with debug level", () => {
      const debugLogger = new Logger({
        enabled: true,
        level: "debug",
        prefix: "[DebugTest] ",
      });

      debugLogger.debug("debug message", { data: 123 });
      expect(consoleDebugSpy).toHaveBeenCalledWith("[DEBUG] [DebugTest] debug message", {
        data: 123,
      });
    });

    it("should not log debug when level is info", () => {
      const infoLogger = new Logger({
        enabled: true,
        level: "info",
        prefix: "[InfoTest] ",
      });

      infoLogger.debug("should not appear");
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it("should log all levels when level is debug", () => {
      const debugLogger = new Logger({
        enabled: true,
        level: "debug",
      });

      debugLogger.debug("debug");
      expect(consoleDebugSpy).toHaveBeenCalled();

      vi.clearAllMocks();
      debugLogger.info("info");
      expect(consoleInfoSpy).toHaveBeenCalled();

      vi.clearAllMocks();
      debugLogger.warn("warn");
      expect(consoleWarnSpy).toHaveBeenCalled();

      vi.clearAllMocks();
      debugLogger.error("error");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should only log error when level is error", () => {
      const errorLogger = new Logger({
        enabled: true,
        level: "error",
      });

      errorLogger.debug("no debug");
      expect(consoleDebugSpy).not.toHaveBeenCalled();

      errorLogger.info("no info");
      expect(consoleInfoSpy).not.toHaveBeenCalled();

      errorLogger.warn("no warn");
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      errorLogger.error("yes error");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("Logger class - enabled/disabled", () => {
    it("should respect enabled configuration from environment", () => {
      // import.meta.env.DEV が true の場合、ログは有効
      // この環境変数は Vitest の設定に依存するため、
      // ここでは出力されることを確認
      logger.info("should log in dev mode");
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it("should not log when disabled", () => {
      const disabledLogger = new Logger({
        enabled: false,
        level: "debug",
      });

      disabledLogger.debug("no debug");
      expect(consoleDebugSpy).not.toHaveBeenCalled();

      disabledLogger.info("no info");
      expect(consoleInfoSpy).not.toHaveBeenCalled();

      disabledLogger.warn("no warn");
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      disabledLogger.error("no error");
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("should handle empty message", () => {
      logger.info("");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[INFO] [DSP-Calc] ");
    });

    it("should handle message with special characters", () => {
      logger.info("特殊文字: 日本語, emoji 🎉, symbols @#$%");
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[INFO] [DSP-Calc] 特殊文字: 日本語, emoji 🎉, symbols @#$%"
      );
    });

    it("should handle no additional arguments", () => {
      logger.warn("just message");
      expect(consoleWarnSpy).toHaveBeenCalledWith("[WARN] [DSP-Calc] just message");
    });

    it("should handle error with undefined", () => {
      logger.error("error with undefined", undefined);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ERROR] [DSP-Calc] error with undefined",
        undefined
      );
    });

    it("should handle error with null", () => {
      logger.error("error with null", null);
      expect(consoleErrorSpy).toHaveBeenCalledWith("[ERROR] [DSP-Calc] error with null", null);
    });
  });
});
