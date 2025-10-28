/**
 * ロガーユーティリティ
 *
 * 開発環境でのみログを出力し、本番環境では無効化する。
 * ログレベルによるフィルタリングと統一されたフォーマットを提供する。
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix?: string;
}

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enabled: import.meta.env.DEV, // 開発環境でのみ有効
      level: "info",
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;

    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog("debug")) {
      console.debug(`[DEBUG] ${this.config.prefix || ""}${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog("info")) {
      console.info(`[INFO] ${this.config.prefix || ""}${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog("warn")) {
      console.warn(`[WARN] ${this.config.prefix || ""}${message}`, ...args);
    }
  }

  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (this.shouldLog("error")) {
      console.error(`[ERROR] ${this.config.prefix || ""}${message}`, error, ...args);
    }
  }
}

// シングルトンインスタンス
export const logger = new Logger({ prefix: "[DSP-Calc] " });

/**
 * コンポーネント別ロガーを作成
 * @param prefix - ログプレフィックス（例: "App", "Parser"）
 */
export function createLogger(prefix: string): Logger {
  return new Logger({ prefix: `[DSP-Calc:${prefix}] ` });
}
