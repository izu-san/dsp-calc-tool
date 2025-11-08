import type { CustomSettingsTemplate, GlobalSettings } from "../../types";
import { serializeSettings, deserializeSettings } from "../../utils/storageSerializer";

/**
 * Settings用のlocalStorageアダプター
 */
export function createSettingsStorage() {
  return {
    /**
     * localStorageから設定を読み込み
     */
    getItem: (name: string) => {
      const str = localStorage.getItem(name);
      if (!str) return null;

      try {
        const { state } = JSON.parse(str);

        // 型安全なデシリアライズ
        if (state?.settings) {
          const deserialized = deserializeSettings(state.settings);
          if (deserialized) {
            state.settings = deserialized;
          }
        }

        // customTemplates のデシリアライズ
        if (state?.customTemplates && typeof state.customTemplates === "object") {
          const customTemplates: Record<string, CustomSettingsTemplate> = {};
          for (const [id, template] of Object.entries(state.customTemplates)) {
            if (
              template &&
              typeof template === "object" &&
              "meta" in template &&
              "settings" in template
            ) {
              const templateObj = template as {
                meta: CustomSettingsTemplate["meta"];
                settings: unknown;
              };
              const deserializedSettings = deserializeSettings(templateObj.settings);
              if (deserializedSettings) {
                customTemplates[id] = {
                  meta: templateObj.meta,
                  settings: deserializedSettings,
                };
              }
            }
          }
          state.customTemplates = customTemplates;
        } else {
          // customTemplates が存在しない場合は空オブジェクト
          state.customTemplates = {};
        }

        // selectedTemplate の型チェック（custom: 接頭辞の処理）
        if (state?.selectedTemplate && typeof state.selectedTemplate === "string") {
          if (state.selectedTemplate.startsWith("custom:")) {
            // CustomTemplateId として扱う（型アサーション不要）
            // 既にstringなのでそのまま
          }
        }

        return { state };
      } catch (error) {
        console.warn("Failed to deserialize settings from localStorage:", error);
        return null;
      }
    },

    /**
     * localStorageに設定を保存
     */
    setItem: (name: string, value: { state: unknown }) => {
      try {
        // Type guard: Check if state has the required structure
        if (!value.state || typeof value.state !== "object" || !("settings" in value.state)) {
          console.error("Invalid state structure in setItem");
          return;
        }

        const state = value.state as { settings: unknown; customTemplates?: unknown };
        // 型安全なシリアライズ
        const serialized = serializeSettings(state.settings as GlobalSettings);

        // customTemplates のシリアライズ
        const serializedCustomTemplates: Record<
          string,
          {
            meta: CustomSettingsTemplate["meta"];
            settings: ReturnType<typeof serializeSettings>;
          }
        > = {};
        if (state.customTemplates && typeof state.customTemplates === "object") {
          for (const [id, template] of Object.entries(state.customTemplates)) {
            // Type guard: Check if template has the required structure
            if (
              template &&
              typeof template === "object" &&
              "meta" in template &&
              "settings" in template &&
              typeof template.meta === "object" &&
              template.meta !== null
            ) {
              const customTemplate = template as CustomSettingsTemplate;
              serializedCustomTemplates[id] = {
                meta: customTemplate.meta,
                settings: serializeSettings(customTemplate.settings),
              };
            }
          }
        }

        const str = JSON.stringify({
          state: {
            ...value.state,
            settings: serialized,
            customTemplates: serializedCustomTemplates,
          },
        });
        localStorage.setItem(name, str);
      } catch (error) {
        console.error("Failed to serialize settings to localStorage:", error);
      }
    },

    /**
     * localStorageから設定を削除
     */
    removeItem: (name: string) => localStorage.removeItem(name),
  };
}
