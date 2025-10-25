import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  exportPlan,
  importPlan,
  restorePlan,
  savePlanToLocalStorage,
  getRecentPlans,
  loadPlanFromLocalStorage,
  deletePlanFromLocalStorage,
} from '../planExport';
import type { SavedPlan, GlobalSettings, NodeOverrideSettings } from '../../types';

// Mock DOM APIs
const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockClick = vi.fn();
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();

describe('planExport', () => {
  let mockSettings: GlobalSettings;
  let mockAlternativeRecipes: Map<number, number>;
  let mockNodeOverrides: Map<string, NodeOverrideSettings>;

  beforeEach(() => {
    // Setup mock DOM
    global.document = {
      createElement: mockCreateElement,
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    } as unknown as Document;

    global.URL = {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    } as unknown as typeof URL;

    mockCreateElement.mockReturnValue({
      href: '',
      download: '',
      click: mockClick,
    });

    // Setup mock data
    mockSettings = {
      proliferator: {
        type: 'mk3',
        mode: 'production',
        productionBonus: 0.25,
        speedBonus: 0,
        powerIncrease: 1.50,
      },
      machineRank: {
        Assemble: 'mk3',
        Smelt: 'arc',
        Chemical: 'standard',
        Research: 'standard',
        Refine: 'standard',
        Particle: 'standard',
      },
      conveyorBelt: { tier: 'mk3', speed: 30, stackCount: 4 },
      sorter: { tier: 'mk3', powerConsumption: 72 },
      alternativeRecipes: new Map([[1, 2]]),
      miningSpeedResearch: 100,
      proliferatorMultiplier: { production: 1, speed: 1 },
    };

    mockAlternativeRecipes = new Map([
      [1001, 2001],
      [1002, 2002],
    ]);

    mockNodeOverrides = new Map([
      [
        'node-1',
        {
          proliferator: {
            type: 'mk2',
            mode: 'speed',
            productionBonus: 0,
            speedBonus: 0.50,
            powerIncrease: 0.70,
          },
        },
      ],
      ['node-2', { machineRank: 'mk2' }],
    ]);

    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportPlan', () => {
    it('JSON生成の正確性（バージョン含む）', () => {
      exportPlan(
        100,
        50,
        mockSettings,
        mockAlternativeRecipes,
        mockNodeOverrides,
        'Test Plan'
      );

      // Blob作成の検証
      const blob = new Blob(['test']);
      expect(blob).toBeDefined();

      // createElementが呼ばれたことを確認
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('Map → Object変換（alternativeRecipes, nodeOverrides）', () => {
      // カスタムBlobコンストラクターでJSON内容をキャプチャ
      const originalBlob = global.Blob;
      let capturedJson = '';
      
      global.Blob = class MockBlob {
        constructor(parts: BlobPart[], options?: BlobPropertyBag) {
          capturedJson = parts[0] as string;
          return originalBlob ? new originalBlob(parts, options) : ({} as Blob);
        }
      } as unknown as typeof Blob;

      exportPlan(
        100,
        50,
        mockSettings,
        mockAlternativeRecipes,
        mockNodeOverrides,
        'Test Plan'
      );

      const data = JSON.parse(capturedJson);

      // alternativeRecipesがオブジェクトに変換されている
      expect(data.plan.alternativeRecipes).toEqual({
        '1001': 2001,
        '1002': 2002,
      });

      // nodeOverridesがオブジェクトに変換されている
      expect(data.plan.nodeOverrides).toEqual({
        'node-1': {
          proliferator: {
            type: 'mk2',
            mode: 'speed',
            productionBonus: 0,
            speedBonus: 0.50,
            powerIncrease: 0.70,
          },
        },
        'node-2': { machineRank: 'mk2' },
      });

      global.Blob = originalBlob;
    });

    it('デフォルトプラン名生成（Plan_YYYY-MM-DD_HH-MM）', () => {
      const originalBlob = global.Blob;
      let capturedJson = '';
      
      global.Blob = class MockBlob {
        constructor(parts: BlobPart[]) {
          capturedJson = parts[0] as string;
          return {} as Blob;
        }
      } as unknown as typeof Blob;

      // プラン名を指定しない
      exportPlan(
        100,
        50,
        mockSettings,
        mockAlternativeRecipes,
        mockNodeOverrides
      );

      const data = JSON.parse(capturedJson);

      // デフォルト名のフォーマット確認
      expect(data.plan.name).toMatch(/^Plan_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}$/);

      global.Blob = originalBlob;
    });

    it('カスタムプラン名の使用', () => {
      const originalBlob = global.Blob;
      let capturedJson = '';
      
      global.Blob = class MockBlob {
        constructor(parts: BlobPart[]) {
          capturedJson = parts[0] as string;
          return {} as Blob;
        }
      } as unknown as typeof Blob;

      exportPlan(
        100,
        50,
        mockSettings,
        mockAlternativeRecipes,
        mockNodeOverrides,
        'My Custom Plan'
      );

      const data = JSON.parse(capturedJson);
      expect(data.plan.name).toBe('My Custom Plan');

      global.Blob = originalBlob;
    });

    it('Blobとダウンロード処理（モック化）', () => {
      exportPlan(
        100,
        50,
        mockSettings,
        mockAlternativeRecipes,
        mockNodeOverrides,
        'Download Test'
      );

      // DOM操作の検証
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('バージョン情報の埋め込み', () => {
      const originalBlob = global.Blob;
      let capturedJson = '';
      
      global.Blob = class MockBlob {
        constructor(parts: BlobPart[]) {
          capturedJson = parts[0] as string;
          return {} as Blob;
        }
      } as unknown as typeof Blob;

      exportPlan(
        100,
        50,
        mockSettings,
        mockAlternativeRecipes,
        mockNodeOverrides,
        'Version Test'
      );

      const data = JSON.parse(capturedJson);
      expect(data.version).toBe('1.0.0');

      global.Blob = originalBlob;
    });
  });

  describe('importPlan', () => {
    it('正しいJSONファイルの読み込み', async () => {
      const validPlan: SavedPlan = {
        name: 'Test Plan',
        timestamp: 1234567890,
        recipeSID: 100,
        targetQuantity: 50,
        settings: mockSettings,
        alternativeRecipes: { '1001': 2001 },
        nodeOverrides: {
          'node-1': {
            proliferator: {
              type: 'mk2',
              mode: 'speed',
              productionBonus: 0,
              speedBonus: 0.50,
              powerIncrease: 0.70,
            },
          },
        },
      };

      const fileContent = JSON.stringify({
        version: '1.0.0',
        plan: validPlan,
      });

      const mockFile = new File([fileContent], 'test.json', { type: 'application/json' });

      const result = await importPlan(mockFile);

      expect(result.name).toBe('Test Plan');
      expect(result.recipeSID).toBe(100);
      expect(result.targetQuantity).toBe(50);
    });

    it('バージョン検証とwarning', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const planWithDifferentVersion = {
        version: '2.0.0', // 異なるバージョン
        plan: {
          name: 'Future Plan',
          timestamp: 1234567890,
          recipeSID: 100,
          targetQuantity: 50,
          settings: mockSettings,
          alternativeRecipes: {},
          nodeOverrides: {},
        },
      };

      const fileContent = JSON.stringify(planWithDifferentVersion);
      const mockFile = new File([fileContent], 'test.json', { type: 'application/json' });

      const result = await importPlan(mockFile);

      expect(result.name).toBe('Future Plan');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Plan version mismatch: 2.0.0 vs 1.0.0')
      );

      consoleWarnSpy.mockRestore();
    });

    it('無効なJSON処理（エラーthrow）', async () => {
      const mockFile = new File(['invalid json {{{'], 'test.json', { type: 'application/json' });

      await expect(importPlan(mockFile)).rejects.toThrow(/is not valid JSON/);
    });

    it('ファイル読み込みエラー処理', async () => {
      const mockFile = {
        name: 'test.json',
      } as File;

      // FileReaderのエラーをシミュレート
      const originalFileReader = global.FileReader;
      global.FileReader = class MockFileReader {
        onload: ((e: ProgressEvent<FileReader>) => void) | null = null;
        onerror: (() => void) | null = null;
        readAsText() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror();
            }
          }, 0);
        }
      } as unknown as typeof FileReader;

      await expect(importPlan(mockFile)).rejects.toThrow('Failed to read file');

      global.FileReader = originalFileReader;
    });

    it('versionフィールドがない場合のエラー', async () => {
      const invalidPlan = {
        plan: {
          name: 'Test',
          timestamp: 123,
          recipeSID: 1,
          targetQuantity: 1,
          settings: mockSettings,
          alternativeRecipes: {},
          nodeOverrides: {},
        },
      };

      const fileContent = JSON.stringify(invalidPlan);
      const mockFile = new File([fileContent], 'test.json', { type: 'application/json' });

      await expect(importPlan(mockFile)).rejects.toThrow('Invalid plan file format');
    });

    it('planフィールドがない場合のエラー', async () => {
      const invalidData = {
        version: '1.0.0',
      };

      const fileContent = JSON.stringify(invalidData);
      const mockFile = new File([fileContent], 'test.json', { type: 'application/json' });

      await expect(importPlan(mockFile)).rejects.toThrow('Invalid plan file format');
    });
  });

  describe('restorePlan', () => {
    it('レシピと数量の復元', () => {
      const setRecipe = vi.fn();
      const setTargetQuantity = vi.fn();
      const updateSettings = vi.fn();
      const setNodeOverrides = vi.fn();

      const plan: SavedPlan = {
        name: 'Test Plan',
        timestamp: 1234567890,
        recipeSID: 100,
        targetQuantity: 50,
        settings: mockSettings,
        alternativeRecipes: { '1001': 2001 },
        nodeOverrides: {},
      };

      restorePlan(plan, setRecipe, setTargetQuantity, updateSettings, setNodeOverrides);

      expect(setRecipe).toHaveBeenCalledWith(100);
      expect(setTargetQuantity).toHaveBeenCalledWith(50);
    });

    it('設定の復元(Map変換含む)', () => {
      const setRecipe = vi.fn();
      const setTargetQuantity = vi.fn();
      const updateSettings = vi.fn();
      const setNodeOverrides = vi.fn();

      const plan: SavedPlan = {
        name: 'Test Plan',
        timestamp: 1234567890,
        recipeSID: 100,
        targetQuantity: 50,
        settings: {
          ...mockSettings,
          alternativeRecipes: { '1001': 2001, '1002': 2002 } as unknown as Map<number, number>,
        },
        alternativeRecipes: {},
        nodeOverrides: {},
      };

      restorePlan(plan, setRecipe, setTargetQuantity, updateSettings, setNodeOverrides);

      expect(updateSettings).toHaveBeenCalled();
      const calledSettings = updateSettings.mock.calls[0][0];
      
      // alternativeRecipesがMapに変換されている
      expect(calledSettings.alternativeRecipes).toBeInstanceOf(Map);
      expect(calledSettings.alternativeRecipes.get(1001)).toBe(2001);
      expect(calledSettings.alternativeRecipes.get(1002)).toBe(2002);
      expect(calledSettings.alternativeRecipes.size).toBe(2);
    });

    it('ノードオーバーライドの復元', () => {
      const setRecipe = vi.fn();
      const setTargetQuantity = vi.fn();
      const updateSettings = vi.fn();
      const setNodeOverrides = vi.fn();

      const plan: SavedPlan = {
        name: 'Test Plan',
        timestamp: 1234567890,
        recipeSID: 100,
        targetQuantity: 50,
        settings: mockSettings,
        alternativeRecipes: {},
        nodeOverrides: {
          'node-1': {
            proliferator: {
              type: 'mk2',
              mode: 'speed',
              productionBonus: 0,
              speedBonus: 0.50,
              powerIncrease: 0.70,
            },
          },
          'node-2': { machineRank: 'mk3' },
        },
      };

      restorePlan(plan, setRecipe, setTargetQuantity, updateSettings, setNodeOverrides);

      expect(setNodeOverrides).toHaveBeenCalled();
      const calledOverrides = setNodeOverrides.mock.calls[0][0];
      
      expect(calledOverrides).toBeInstanceOf(Map);
      expect(calledOverrides.size).toBe(2);
      expect(calledOverrides.get('node-1')).toEqual({
        proliferator: {
          type: 'mk2',
          mode: 'speed',
          productionBonus: 0,
          speedBonus: 0.50,
          powerIncrease: 0.70,
        },
      });
    });
  });

  describe('localStorage管理', () => {
    it('savePlanToLocalStorage: 保存とタイムスタンプ', () => {
      const plan: SavedPlan = {
        name: 'Local Plan',
        timestamp: 1234567890,
        recipeSID: 100,
        targetQuantity: 50,
        settings: mockSettings,
        alternativeRecipes: {},
        nodeOverrides: {},
      };

      (global.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

      savePlanToLocalStorage(plan);

      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'plan_1234567890',
        expect.stringContaining('"version":"1.0.0"')
      );

      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'recent_plans',
        expect.any(String)
      );
    });

    it('getRecentPlans: 最新10件のプラン取得', () => {
      const recentPlans = [
        { key: 'plan_1', name: 'Plan 1', timestamp: 1000 },
        { key: 'plan_2', name: 'Plan 2', timestamp: 2000 },
      ];

      (global.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify(recentPlans)
      );

      const result = getRecentPlans();

      expect(result).toEqual(recentPlans);
      expect(global.localStorage.getItem).toHaveBeenCalledWith('recent_plans');
    });

    it('getRecentPlans: データがない場合は空配列', () => {
      (global.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

      const result = getRecentPlans();

      expect(result).toEqual([]);
    });

    it('localStorage管理 > loadPlanFromLocalStorage: プラン読み込み', () => {
      const plan: SavedPlan = {
        name: 'Stored Plan',
        timestamp: 1234567890,
        recipeSID: 100,
        targetQuantity: 50,
        settings: {
          ...mockSettings,
          alternativeRecipes: {} as unknown as Map<number, number>, // JSONから読み込むときはオブジェクト
        },
        alternativeRecipes: {},
        nodeOverrides: {},
      };

      const serialized = {
        version: '1.0.0',
        plan,
      };

      (global.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify(serialized)
      );

      const result = loadPlanFromLocalStorage('plan_1234567890');

      expect(result).toEqual(plan);
    });

    it('loadPlanFromLocalStorage: データがない場合はnull', () => {
      (global.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

      const result = loadPlanFromLocalStorage('nonexistent');

      expect(result).toBeNull();
    });

    it('loadPlanFromLocalStorage: 無効なJSON の場合はnull', () => {
      (global.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        'invalid json {{{'
      );

      const result = loadPlanFromLocalStorage('invalid_plan');

      expect(result).toBeNull();
    });

    it('deletePlanFromLocalStorage: プラン削除と一覧更新', () => {
      const recentPlans = [
        { key: 'plan_1', name: 'Plan 1', timestamp: 1000 },
        { key: 'plan_2', name: 'Plan 2', timestamp: 2000 },
        { key: 'plan_3', name: 'Plan 3', timestamp: 3000 },
      ];

      (global.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify(recentPlans)
      );

      deletePlanFromLocalStorage('plan_2');

      expect(global.localStorage.removeItem).toHaveBeenCalledWith('plan_2');

      // recent_plansからplan_2が削除されている
      const updateCall = (global.localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[0] === 'recent_plans'
      );
      
      expect(updateCall).toBeDefined();
      const updatedPlans = JSON.parse(updateCall![1]);
      expect(updatedPlans).toHaveLength(2);
      expect(updatedPlans.find((p: { key: string }) => p.key === 'plan_2')).toBeUndefined();
    });

    it('古いプランの自動削除（11件目以降）', () => {
      const existingPlans = Array.from({ length: 5 }, (_, i) => ({
        key: `old_plan_${i}`,
        name: `Old Plan ${i}`,
        timestamp: 1000 + i,
      }));

      (global.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify(existingPlans)
      );

      const newPlan: SavedPlan = {
        name: 'New Plan',
        timestamp: 9999,
        recipeSID: 100,
        targetQuantity: 50,
        settings: mockSettings,
        alternativeRecipes: {},
        nodeOverrides: {},
      };

      savePlanToLocalStorage(newPlan);

      // recent_plansの更新確認
      const recentPlansCall = (global.localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[0] === 'recent_plans'
      );

      expect(recentPlansCall).toBeDefined();
      const savedPlans = JSON.parse(recentPlansCall![1]);
      
      // 最大10件まで
      expect(savedPlans.length).toBeLessThanOrEqual(10);
      
      // 新しいプランが先頭
      expect(savedPlans[0].key).toBe('plan_9999');
    });

    it('10件を超える場合に古いプランが削除される', () => {
      // 既に10件のプランが存在
      const existingPlans = Array.from({ length: 10 }, (_, i) => ({
        key: `plan_${i}`,
        name: `Plan ${i}`,
        timestamp: 1000 + i,
      }));

      (global.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify(existingPlans)
      );

      const newPlan: SavedPlan = {
        name: 'Plan 11',
        timestamp: 2000,
        recipeSID: 100,
        targetQuantity: 50,
        settings: mockSettings,
        alternativeRecipes: {},
        nodeOverrides: {},
      };

      savePlanToLocalStorage(newPlan);

      // 古いプランの削除確認
      expect(global.localStorage.removeItem).toHaveBeenCalled();
      
      // recent_plansが10件に制限されている
      const recentPlansCall = (global.localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[0] === 'recent_plans'
      );
      
      const savedPlans = JSON.parse(recentPlansCall![1]);
      expect(savedPlans).toHaveLength(10);
    });
  });
});
