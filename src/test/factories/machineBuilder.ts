/**
 * Machine ビルダー
 * テスト用の Machine を簡単に作成するためのファクトリ関数
 */

import type { Machine } from "../../types/game-data";
import { createMockMachine } from "./testDataFactory";

/**
 * 基本的な機械を作成（createMockMachine のラッパー）
 */
export function createMachine(
  id: string | number,
  name: string,
  overrides?: Partial<Machine>
): Machine {
  const idStr = typeof id === "number" ? id.toString() : id;
  const base = createMockMachine(idStr, name);
  return {
    ...base,
    ...overrides,
  };
}

/**
 * 特定タイプの機械を作成
 */
export function createMachineByType(params: {
  id: string | number;
  name: string;
  type: Machine["Type"];
  assemblerSpeed?: number;
  workEnergyPerTick?: number;
  idleEnergyPerTick?: number;
  exchangeEnergyPerTick?: number;
  isPowerConsumer?: boolean;
  isPowerExchanger?: boolean;
}): Machine {
  return createMachine(params.id, params.name, {
    Type: params.type,
    assemblerSpeed: params.assemblerSpeed ?? (params.type === "Logistics" ? 0 : 10000),
    workEnergyPerTick: params.workEnergyPerTick ?? 100,
    idleEnergyPerTick: params.idleEnergyPerTick ?? 10,
    exchangeEnergyPerTick: params.exchangeEnergyPerTick ?? 0,
    isPowerConsumer: params.isPowerConsumer ?? true,
    isPowerExchanger: params.isPowerExchanger ?? false,
  });
}

/**
 * よく使われる機械のプリセット
 */
export const machinePresets = {
  /**
   * Arc Smelter
   * workEnergyPerTick: 360000 ticks * 60 / 1000 = 21,600 kW per machine
   */
  arcSmelter: (): Machine =>
    createMachineByType({
      id: 2302,
      name: "Arc Smelter",
      type: "Smelt",
      assemblerSpeed: 10000,
      workEnergyPerTick: 360000, // 360kW per tick (test expects this value)
      idleEnergyPerTick: 18000,
    }),

  /**
   * Assembling Machine Mk.I
   */
  assemblerMk1: (): Machine =>
    createMachineByType({
      id: 2303,
      name: "Assembling Machine Mk.I",
      type: "Assemble",
      assemblerSpeed: 7500,
      workEnergyPerTick: 9,
      idleEnergyPerTick: 3,
    }),

  /**
   * Assembling Machine Mk.II
   */
  assemblerMk2: (): Machine =>
    createMachineByType({
      id: 2304,
      name: "Assembling Machine Mk.II",
      type: "Assemble",
      assemblerSpeed: 7500,
      workEnergyPerTick: 12,
      idleEnergyPerTick: 4,
    }),

  /**
   * Assembling Machine Mk.III
   */
  assemblerMk3: (): Machine =>
    createMachineByType({
      id: 2305,
      name: "Assembling Machine Mk.III",
      type: "Assemble",
      assemblerSpeed: 7500,
      workEnergyPerTick: 15,
      idleEnergyPerTick: 5,
    }),

  /**
   * Chemical Plant
   */
  chemicalPlant: (): Machine =>
    createMachineByType({
      id: 2309,
      name: "Chemical Plant",
      type: "Chemical",
      assemblerSpeed: 10000,
      workEnergyPerTick: 15,
      idleEnergyPerTick: 5,
    }),

  /**
   * Sorter Mk.I
   */
  sorterMk1: (): Machine =>
    createMachineByType({
      id: 2040,
      name: "Sorter Mk.I",
      type: "Logistics",
      assemblerSpeed: 0,
      workEnergyPerTick: 1,
      idleEnergyPerTick: 0,
    }),

  /**
   * Matrix Lab
   */
  matrixLab: (): Machine =>
    createMachineByType({
      id: 2901,
      name: "Matrix Lab",
      type: "Research",
      assemblerSpeed: 0, // Matrix Lab has 0 speed
      workEnergyPerTick: 480,
      idleEnergyPerTick: 30,
    }),
};
