/**
 * HelpModal のライフサイクル管理
 *
 * - バージョン情報・更新履歴の読み込み
 * - Escキーハンドリング
 * - フォーカス制御
 */

import { useEffect, useState, type RefObject } from "react";
import i18n from "../../i18n";
import { loadChangelog } from "../../utils/changelog";
import { loadVersionInfo, type VersionInfo } from "../../utils/versionInfo";

export interface HelpModalLifecycleState {
  versionInfo: VersionInfo | null;
  changelog: string | null;
  loadingVersionInfo: boolean;
  loadingChangelog: boolean;
}

export function useHelpModalLifecycle(
  isOpen: boolean,
  onClose: () => void,
  firstTabRef: RefObject<HTMLButtonElement | null>
): HelpModalLifecycleState {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [changelog, setChangelog] = useState<string | null>(null);
  const [loadingVersionInfo, setLoadingVersionInfo] = useState(true);
  const [loadingChangelog, setLoadingChangelog] = useState(true);

  // データロード
  useEffect(() => {
    if (isOpen) {
      // Load version info
      loadVersionInfo()
        .then(info => {
          setVersionInfo(info);
          setLoadingVersionInfo(false);
        })
        .catch(() => {
          setLoadingVersionInfo(false);
        });

      // Load changelog
      loadChangelog(i18n.language === "en" ? "en" : "ja")
        .then(text => {
          setChangelog(text);
          setLoadingChangelog(false);
        })
        .catch(() => {
          setLoadingChangelog(false);
        });
    }
  }, [isOpen]);

  // Escキーでモーダルを閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // モーダルが開いたときに最初のタブにフォーカスを当てる
  useEffect(() => {
    if (isOpen && firstTabRef.current) {
      // 少し遅延を入れて、DOMが完全にレンダリングされた後にフォーカスを当てる
      const timer = setTimeout(() => {
        firstTabRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, firstTabRef]);

  return {
    versionInfo,
    changelog,
    loadingVersionInfo,
    loadingChangelog,
  };
}
