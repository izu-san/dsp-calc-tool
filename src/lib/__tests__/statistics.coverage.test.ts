import { describe, it, expect } from 'vitest';
import { calculateItemStatistics } from '../statistics';
import type { RecipeTreeNode } from '../../types/calculation';

describe('statistics coverage tests', () => {
  describe('calculateItemStatistics edge cases', () => {
    it('should handle nodes with missing itemId', () => {
      const mockNode: RecipeTreeNode = {
        targetOutputRate: 60,
        machineCount: 1,
        proliferator: { type: 'none', level: 0 },
        power: { machines: 500, sorters: 100, total: 600 },
        inputs: [],
        children: [
          {
            targetOutputRate: 30,
            machineCount: 0,
            proliferator: { type: 'none', level: 0 },
            power: { machines: 0, sorters: 0, total: 0 },
            inputs: [],
            children: [],
            conveyorBelts: { inputs: 0, outputs: 1, total: 1 },
            nodeId: 'raw-1',
            isRawMaterial: true,
            // itemId is missing - this should be handled gracefully
            itemName: 'Iron Ore',
            miningFrom: 'Iron Veins'
          }
        ],
        conveyorBelts: { inputs: 0, outputs: 1, total: 1 },
        nodeId: 'root'
      };

      const result = calculateItemStatistics(mockNode);
      
      expect(result).toBeDefined();
      expect(result.totalMachines).toBeGreaterThanOrEqual(0);
      expect(result.items).toBeDefined();
    });

    it('should handle nodes with undefined children', () => {
      const mockNode: RecipeTreeNode = {
        targetOutputRate: 60,
        machineCount: 1,
        proliferator: { type: 'none', level: 0 },
        power: { machines: 500, sorters: 100, total: 600 },
        inputs: [],
        children: undefined, // This should be handled gracefully
        conveyorBelts: { inputs: 0, outputs: 1, total: 1 },
        nodeId: 'root'
      };

      const result = calculateItemStatistics(mockNode);
      
      expect(result).toBeDefined();
      expect(result.totalMachines).toBe(1);
      expect(result.items).toBeDefined();
    });

    it('should handle empty children array', () => {
      const mockNode: RecipeTreeNode = {
        targetOutputRate: 60,
        machineCount: 1,
        proliferator: { type: 'none', level: 0 },
        power: { machines: 500, sorters: 100, total: 600 },
        inputs: [],
        children: [],
        conveyorBelts: { inputs: 0, outputs: 1, total: 1 },
        nodeId: 'root'
      };

      const result = calculateItemStatistics(mockNode);
      
      expect(result).toBeDefined();
      expect(result.totalMachines).toBe(1);
      expect(result.items).toBeDefined();
    });

    it('should handle complex nested structures', () => {
      const mockNode: RecipeTreeNode = {
        targetOutputRate: 60,
        machineCount: 1,
        proliferator: { type: 'none', level: 0 },
        power: { machines: 500, sorters: 100, total: 600 },
        inputs: [],
        children: [
          {
            targetOutputRate: 30,
            machineCount: 1,
            proliferator: { type: 'none', level: 0 },
            power: { machines: 250, sorters: 50, total: 300 },
            inputs: [],
            children: [
              {
                targetOutputRate: 15,
                machineCount: 0,
                proliferator: { type: 'none', level: 0 },
                power: { machines: 0, sorters: 0, total: 0 },
                inputs: [],
                children: [],
                conveyorBelts: { inputs: 0, outputs: 1, total: 1 },
                nodeId: 'raw-1',
                isRawMaterial: true,
                itemId: 1001,
                itemName: 'Iron Ore',
                miningFrom: 'Iron Veins'
              }
            ],
            conveyorBelts: { inputs: 1, outputs: 1, total: 2 },
            nodeId: 'intermediate-1'
          }
        ],
        conveyorBelts: { inputs: 0, outputs: 1, total: 1 },
        nodeId: 'root'
      };

      const result = calculateItemStatistics(mockNode);
      
      expect(result).toBeDefined();
      expect(result.totalMachines).toBeGreaterThan(0);
      expect(result.items).toBeDefined();
    });

    it('should handle nodes with missing itemName', () => {
      const mockNode: RecipeTreeNode = {
        targetOutputRate: 60,
        machineCount: 1,
        proliferator: { type: 'none', level: 0 },
        power: { machines: 500, sorters: 100, total: 600 },
        inputs: [],
        children: [
          {
            targetOutputRate: 30,
            machineCount: 0,
            proliferator: { type: 'none', level: 0 },
            power: { machines: 0, sorters: 0, total: 0 },
            inputs: [],
            children: [],
            conveyorBelts: { inputs: 0, outputs: 1, total: 1 },
            nodeId: 'raw-1',
            isRawMaterial: true,
            itemId: 1001,
            // itemName is missing
            miningFrom: 'Iron Veins'
          }
        ],
        conveyorBelts: { inputs: 0, outputs: 1, total: 1 },
        nodeId: 'root'
      };

      const result = calculateItemStatistics(mockNode);
      
      expect(result).toBeDefined();
      expect(result.totalMachines).toBeGreaterThanOrEqual(0);
      expect(result.items).toBeDefined();
    });
  });
});
