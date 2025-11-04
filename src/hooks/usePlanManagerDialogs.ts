/**
 * Plan Manager Dialogs Hook
 * Manages dialog state for PlanManager component
 */

import { useState, useCallback } from "react";
import type { DialogType, PlanManagerDialogsState } from "./planManagerDialogsTypes";

const initialState: PlanManagerDialogsState = {
  activeDialog: null,
  selectedPlanId: null,
  diffBaseVersion: null,
  diffCompareVersion: null,
  planName: "",
  shareURL: "",
  copySuccess: false,
  includeOverridesOnSave: true,
  includeOverridesOnShare: true,
  mergeOverridesOnLoad: false,
};

export function usePlanManagerDialogs() {
  const [state, setState] = useState<PlanManagerDialogsState>(initialState);

  const openDialog = useCallback((dialog: DialogType) => {
    setState(prev => ({ ...prev, activeDialog: dialog }));
  }, []);

  const closeDialog = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeDialog: null,
      selectedPlanId: null,
      diffBaseVersion: null,
      diffCompareVersion: null,
    }));
  }, []);

  const closeDialogWithReset = useCallback(() => {
    setState(prev => ({
      ...initialState,
      // Keep some state that should persist
      includeOverridesOnSave: prev.includeOverridesOnSave,
      includeOverridesOnShare: prev.includeOverridesOnShare,
      mergeOverridesOnLoad: prev.mergeOverridesOnLoad,
    }));
  }, []);

  const setSelectedPlanId = useCallback((planId: string | null) => {
    setState(prev => ({ ...prev, selectedPlanId: planId }));
  }, []);

  const setDiffVersions = useCallback(
    (baseVersion: number | null, compareVersion: number | null) => {
      setState(prev => ({
        ...prev,
        diffBaseVersion: baseVersion,
        diffCompareVersion: compareVersion,
      }));
    },
    []
  );

  const setPlanName = useCallback((name: string) => {
    setState(prev => ({ ...prev, planName: name }));
  }, []);

  const setShareURL = useCallback((url: string) => {
    setState(prev => ({ ...prev, shareURL: url }));
  }, []);

  const setCopySuccess = useCallback((success: boolean) => {
    setState(prev => ({ ...prev, copySuccess: success }));
  }, []);

  const setIncludeOverridesOnSave = useCallback((include: boolean) => {
    setState(prev => ({ ...prev, includeOverridesOnSave: include }));
  }, []);

  const setIncludeOverridesOnShare = useCallback((include: boolean) => {
    setState(prev => ({ ...prev, includeOverridesOnShare: include }));
  }, []);

  const setMergeOverridesOnLoad = useCallback((merge: boolean) => {
    setState(prev => ({ ...prev, mergeOverridesOnLoad: merge }));
  }, []);

  return {
    ...state,
    openDialog,
    closeDialog,
    closeDialogWithReset,
    setSelectedPlanId,
    setDiffVersions,
    setPlanName,
    setShareURL,
    setCopySuccess,
    setIncludeOverridesOnSave,
    setIncludeOverridesOnShare,
    setMergeOverridesOnLoad,
  };
}
