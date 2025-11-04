/**
 * Plan Manager Dialogs Types
 */

export type DialogType = "save" | "load" | "share" | "version" | "diff" | null;

export interface PlanManagerDialogsState {
  activeDialog: DialogType;
  selectedPlanId: string | null;
  diffBaseVersion: number | null;
  diffCompareVersion: number | null;
  planName: string;
  shareURL: string;
  copySuccess: boolean;
  includeOverridesOnSave: boolean;
  includeOverridesOnShare: boolean;
  mergeOverridesOnLoad: boolean;
}
