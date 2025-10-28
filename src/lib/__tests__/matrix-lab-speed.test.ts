import { describe, it, expect } from 'vitest';
import { calculateProductionChain } from '../calculator';
import { createMockGameData, createMockSettings } from '../../test/factories/testDataFactory';

describe('Matrix Lab Speed Calculation', () => {
  it('should use different machine counts for Matrix Lab vs Self-evolution Lab', () => {
    const gameData = createMockGameData();
    
    // Add Matrix Lab (1x speed)
    gameData.machines.set(2901, {
      id: 2901,
      name: 'Matrix Lab',
      Type: 'Research',
      assemblerSpeed: 10000, // 1.0x speed
      workEnergyPerTick: 8000,
      idleEnergyPerTick: 200,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: true,
      isPowerExchanger: false,
      isRaw: false,
    });

    // Add Self-evolution Lab (3x speed)
    gameData.machines.set(2902, {
      id: 2902,
      name: 'Self-evolution Lab',
      Type: 'Research',
      assemblerSpeed: 30000, // 3.0x speed
      workEnergyPerTick: 32000,
      idleEnergyPerTick: 800,
      exchangeEnergyPerTick: 0,
      isPowerConsumer: true,
      isPowerExchanger: false,
      isRaw: false,
    });

    // Create EM Matrix recipe
    const emMatrixRecipe = {
      SID: 4,
      name: 'EM Matrix',
      TimeSpend: 180, // 3 seconds
      Results: [{ id: 6001, name: 'EM Matrix', count: 1, Type: '0', isRaw: false }],
      Items: [
        { id: 1201, name: 'Magnetic Coil', count: 1, Type: '0', isRaw: false },
        { id: 1301, name: 'Circuit Board', count: 1, Type: '0', isRaw: false },
      ],
      Type: 'Research' as const,
      Explicit: false,
      GridIndex: '6001',
      productive: false,
    };
    gameData.recipes.set(4, emMatrixRecipe);

    const targetRate = 1; // 1 EM Matrix per second

    // Test with Matrix Lab (standard)
    const settingsMatrixLab = {
      ...createMockSettings(),
      machineRank: {
        ...createMockSettings().machineRank,
        Research: 'standard', // Matrix Lab
      },
    };

    const resultMatrixLab = calculateProductionChain(
      emMatrixRecipe,
      targetRate,
      gameData,
      settingsMatrixLab
    );

    // Test with Self-evolution Lab
    const settingsSelfEvo = {
      ...createMockSettings(),
      machineRank: {
        ...createMockSettings().machineRank,
        Research: 'self-evolution', // Self-evolution Lab
      },
    };

    const resultSelfEvo = calculateProductionChain(
      emMatrixRecipe,
      targetRate,
      gameData,
      settingsSelfEvo
    );


    // Self-evolution Lab should require 1/3 the machines
    expect(resultMatrixLab.rootNode.machineCount).toBe(3); // 1 EM Matrix/s with 1x speed = 3 machines
    expect(resultSelfEvo.rootNode.machineCount).toBe(1); // 1 EM Matrix/s with 3x speed = 1 machine
    
    // Verify correct machines are selected
    expect(resultMatrixLab.rootNode.machine?.id).toBe(2901); // Matrix Lab
    expect(resultSelfEvo.rootNode.machine?.id).toBe(2902); // Self-evolution Lab
    
    // Verify machine names
    expect(resultMatrixLab.rootNode.machine?.name).toBe('Matrix Lab');
    expect(resultSelfEvo.rootNode.machine?.name).toBe('Self-evolution Lab');
  });
});
