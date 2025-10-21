import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { loadGameData } from '../parser';

// Mock fetch globally
global.fetch = vi.fn();

describe('parser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadGameData', () => {
    const mockItemsXml = `<?xml version="1.0" encoding="UTF-8"?>
<ArrayOfItem>
  <Item>
    <id>1101</id>
    <name>鉄鉱石</name>
    <count>1</count>
    <Type>Smelt</Type>
    <miningFrom>VeinMiner</miningFrom>
    <isRaw>true</isRaw>
  </Item>
  <Item>
    <id>1102</id>
    <name>銅鉱石</name>
    <count>1</count>
    <Type>Smelt</Type>
    <miningFrom>VeinMiner</miningFrom>
    <isRaw>true</isRaw>
  </Item>
  <Item>
    <id>1103</id>
    <name>鉄インゴット</name>
    <count>1</count>
    <Type>Smelt</Type>
    <isRaw>false</isRaw>
  </Item>
</ArrayOfItem>`;

    const mockRecipesXml = `<?xml version="1.0" encoding="UTF-8"?>
<ArrayOfRecipe>
  <Recipe>
    <SID>1</SID>
    <name>鉄インゴット</name>
    <Type>Smelt</Type>
    <Explicit>false</Explicit>
    <TimeSpend>1</TimeSpend>
    <Items>
      <Item>
        <id>1101</id>
        <name>鉄鉱石</name>
        <count>1</count>
        <Type>Smelt</Type>
        <isRaw>true</isRaw>
      </Item>
    </Items>
    <Results>
      <Item>
        <id>1103</id>
        <name>鉄インゴット</name>
        <count>1</count>
        <Type>Smelt</Type>
        <isRaw>false</isRaw>
      </Item>
    </Results>
    <GridIndex>1101</GridIndex>
    <productive>true</productive>
  </Recipe>
  <Recipe>
    <SID>2</SID>
    <name>銅インゴット</name>
    <Type>Smelt</Type>
    <Explicit>false</Explicit>
    <TimeSpend>1</TimeSpend>
    <Items>
      <Item>
        <id>1102</id>
        <name>銅鉱石</name>
        <count>1</count>
        <Type>Smelt</Type>
        <isRaw>true</isRaw>
      </Item>
    </Items>
    <Results>
      <Item>
        <id>1104</id>
        <name>銅インゴット</name>
        <count>1</count>
        <Type>Smelt</Type>
        <isRaw>false</isRaw>
      </Item>
    </Results>
    <GridIndex>1102</GridIndex>
    <productive>true</productive>
  </Recipe>
</ArrayOfRecipe>`;

    const mockMachinesXml = `<?xml version="1.0" encoding="UTF-8"?>
<ArrayOfMachine>
  <Machine>
    <id>2301</id>
    <name>製錬設備</name>
    <count>1</count>
    <Type>Smelt</Type>
    <assemblerSpeed>1</assemblerSpeed>
    <workEnergyPerTick>360</workEnergyPerTick>
    <idleEnergyPerTick>12</idleEnergyPerTick>
    <exchangeEnergyPerTick>0</exchangeEnergyPerTick>
    <isPowerConsumer>true</isPowerConsumer>
    <isPowerExchanger>false</isPowerExchanger>
  </Machine>
  <Machine>
    <id>2303</id>
    <name>製造台Mk.I</name>
    <count>1</count>
    <Type>Assemble</Type>
    <assemblerSpeed>0.75</assemblerSpeed>
    <workEnergyPerTick>270</workEnergyPerTick>
    <idleEnergyPerTick>9</idleEnergyPerTick>
    <exchangeEnergyPerTick>0</exchangeEnergyPerTick>
    <isPowerConsumer>true</isPowerConsumer>
    <isPowerExchanger>false</isPowerExchanger>
  </Machine>
</ArrayOfMachine>`;

    it('正しくXMLをパースしてGameDataを返す（日本語ロケール）', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockItemsXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockRecipesXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockMachinesXml) } as Response);

      const gameData = await loadGameData(undefined, 'ja');

      // Items
      expect(gameData.items.size).toBe(3);
      expect(gameData.items.get(1101)).toEqual({
        id: 1101,
        name: '鉄鉱石',
        count: 1,
        Type: 'Smelt',
        miningFrom: 'VeinMiner',
        produceFrom: undefined,
        isRaw: true,
      });

      // Recipes
      expect(gameData.recipes.size).toBe(2);
      const recipe1 = gameData.recipes.get(1);
      expect(recipe1).toBeDefined();
      expect(recipe1?.name).toBe('鉄インゴット');
      expect(recipe1?.Items).toHaveLength(1);
      expect(recipe1?.Results).toHaveLength(1);
      expect(recipe1?.productive).toBe(true);

      // Machines
      expect(gameData.machines.size).toBe(2);
      expect(gameData.machines.get(2301)).toEqual({
        id: 2301,
        name: '製錬設備',
        count: 1,
        Type: 'Smelt',
        miningFrom: undefined,
        produceFrom: undefined,
        isRaw: false,
        assemblerSpeed: 1,
        workEnergyPerTick: 360,
        idleEnergyPerTick: 12,
        exchangeEnergyPerTick: 0,
        isPowerConsumer: true,
        isPowerExchanger: false,
      });

      // recipesByItemId index
      expect(gameData.recipesByItemId.get(1103)).toBeDefined();
      expect(gameData.recipesByItemId.get(1103)?.[0].SID).toBe(1);

      // allItems combined map
      expect(gameData.allItems.size).toBe(5); // 3 items + 2 machines
    });

    it('英語ロケールでファイルパスを正しく生成', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockItemsXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockRecipesXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockMachinesXml) } as Response);

      await loadGameData(undefined, 'en');

      expect(global.fetch).toHaveBeenCalledWith('/data/Items/Items_en.xml');
      expect(global.fetch).toHaveBeenCalledWith('/data/Recipes/Recipes_en.xml');
      expect(global.fetch).toHaveBeenCalledWith('/data/Machines/Machines_en.xml');
    });

    it('ロケールファイルがない場合デフォルトにフォールバック', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Promise.allで並列実行されるため、すべてのfetchをセットアップ
      let callCount = 0;
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
        callCount++;
        
        // Items_fr.xml → reject → Items.xml → resolve
        if (url === '/data/Items/Items_fr.xml') {
          return Promise.reject(new Error('Not found'));
        }
        if (url === '/data/Items/Items.xml') {
          return Promise.resolve({ text: () => Promise.resolve(mockItemsXml) } as Response);
        }
        
        // Recipes_fr.xml → reject → Recipes.xml → resolve
        if (url === '/data/Recipes/Recipes_fr.xml') {
          return Promise.reject(new Error('Not found'));
        }
        if (url === '/data/Recipes/Recipes.xml') {
          return Promise.resolve({ text: () => Promise.resolve(mockRecipesXml) } as Response);
        }
        
        // Machines_fr.xml → reject → Machines.xml → resolve
        if (url === '/data/Machines/Machines_fr.xml') {
          return Promise.reject(new Error('Not found'));
        }
        if (url === '/data/Machines/Machines.xml') {
          return Promise.resolve({ text: () => Promise.resolve(mockMachinesXml) } as Response);
        }
        
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      });

      const gameData = await loadGameData(undefined, 'fr');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('/data/Items/Items_fr.xml not found')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('/data/Recipes/Recipes_fr.xml not found')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('/data/Machines/Machines_fr.xml not found')
      );

      expect(global.fetch).toHaveBeenCalledWith('/data/Items/Items.xml');
      expect(global.fetch).toHaveBeenCalledWith('/data/Recipes/Recipes.xml');
      expect(global.fetch).toHaveBeenCalledWith('/data/Machines/Machines.xml');

      expect(gameData.items.size).toBe(3);
      expect(gameData.recipes.size).toBe(2);
      expect(gameData.machines.size).toBe(2);

      consoleWarnSpy.mockRestore();
    });

    it('カスタムRecipes XMLを使用できる', async () => {
      const customRecipesXml = `<?xml version="1.0" encoding="UTF-8"?>
<ArrayOfRecipe>
  <Recipe>
    <SID>999</SID>
    <name>カスタムレシピ</name>
    <Type>Assemble</Type>
    <Explicit>true</Explicit>
    <TimeSpend>5</TimeSpend>
    <Items>
      <Item>
        <id>1101</id>
        <name>鉄鉱石</name>
        <count>2</count>
        <Type>Smelt</Type>
        <isRaw>true</isRaw>
      </Item>
    </Items>
    <Results>
      <Item>
        <id>1103</id>
        <name>鉄インゴット</name>
        <count>3</count>
        <Type>Smelt</Type>
        <isRaw>false</isRaw>
      </Item>
    </Results>
    <GridIndex>9999</GridIndex>
    <productive>false</productive>
  </Recipe>
</ArrayOfRecipe>`;

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockItemsXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockMachinesXml) } as Response);

      const gameData = await loadGameData(customRecipesXml, 'ja');

      expect(gameData.recipes.size).toBe(1);
      const customRecipe = gameData.recipes.get(999);
      expect(customRecipe).toBeDefined();
      expect(customRecipe?.name).toBe('カスタムレシピ');
      expect(customRecipe?.Explicit).toBe(true);
      expect(customRecipe?.Items[0].count).toBe(2);
      expect(customRecipe?.Results[0].count).toBe(3);
    });

    it('単一アイテムのXMLも正しくパース（配列でない場合）', async () => {
      const singleItemXml = `<?xml version="1.0" encoding="UTF-8"?>
<ArrayOfItem>
  <Item>
    <id>1101</id>
    <name>鉄鉱石</name>
    <count>1</count>
    <Type>Smelt</Type>
    <isRaw>true</isRaw>
  </Item>
</ArrayOfItem>`;

      const singleRecipeXml = `<?xml version="1.0" encoding="UTF-8"?>
<ArrayOfRecipe>
  <Recipe>
    <SID>1</SID>
    <name>鉄インゴット</name>
    <Type>Smelt</Type>
    <Explicit>false</Explicit>
    <TimeSpend>1</TimeSpend>
    <Items>
      <Item>
        <id>1101</id>
        <name>鉄鉱石</name>
        <count>1</count>
        <Type>Smelt</Type>
        <isRaw>true</isRaw>
      </Item>
    </Items>
    <Results>
      <Item>
        <id>1103</id>
        <name>鉄インゴット</name>
        <count>1</count>
        <Type>Smelt</Type>
        <isRaw>false</isRaw>
      </Item>
    </Results>
    <GridIndex>1101</GridIndex>
    <productive>true</productive>
  </Recipe>
</ArrayOfRecipe>`;

      const singleMachineXml = `<?xml version="1.0" encoding="UTF-8"?>
<ArrayOfMachine>
  <Machine>
    <id>2301</id>
    <name>製錬設備</name>
    <count>1</count>
    <Type>Smelt</Type>
    <assemblerSpeed>1</assemblerSpeed>
    <workEnergyPerTick>360</workEnergyPerTick>
    <idleEnergyPerTick>12</idleEnergyPerTick>
    <exchangeEnergyPerTick>0</exchangeEnergyPerTick>
    <isPowerConsumer>true</isPowerConsumer>
    <isPowerExchanger>false</isPowerExchanger>
  </Machine>
</ArrayOfMachine>`;

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve(singleItemXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(singleRecipeXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(singleMachineXml) } as Response);

      const gameData = await loadGameData(undefined, 'ja');

      expect(gameData.items.size).toBe(1);
      expect(gameData.recipes.size).toBe(1);
      expect(gameData.machines.size).toBe(1);
    });

    it('文字列のboolean値を正しく変換（isRaw, Explicit, productive）', async () => {
      const booleanTestXml = `<?xml version="1.0" encoding="UTF-8"?>
<ArrayOfItem>
  <Item>
    <id>1101</id>
    <name>テストアイテム</name>
    <count>1</count>
    <Type>Smelt</Type>
    <isRaw>true</isRaw>
  </Item>
  <Item>
    <id>1102</id>
    <name>テストアイテム2</name>
    <count>1</count>
    <Type>Smelt</Type>
    <isRaw>false</isRaw>
  </Item>
</ArrayOfItem>`;

      const booleanRecipeXml = `<?xml version="1.0" encoding="UTF-8"?>
<ArrayOfRecipe>
  <Recipe>
    <SID>1</SID>
    <name>テスト</name>
    <Type>Smelt</Type>
    <Explicit>true</Explicit>
    <TimeSpend>1</TimeSpend>
    <Results>
      <Item>
        <id>1101</id>
        <name>テスト</name>
        <count>1</count>
        <Type>Smelt</Type>
        <isRaw>false</isRaw>
      </Item>
    </Results>
    <GridIndex>1101</GridIndex>
    <productive>true</productive>
  </Recipe>
</ArrayOfRecipe>`;

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve(booleanTestXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(booleanRecipeXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockMachinesXml) } as Response);

      const gameData = await loadGameData(undefined, 'ja');

      expect(gameData.items.get(1101)?.isRaw).toBe(true);
      expect(gameData.items.get(1102)?.isRaw).toBe(false);
      expect(gameData.recipes.get(1)?.Explicit).toBe(true);
      expect(gameData.recipes.get(1)?.productive).toBe(true);
    });

    it('recipesByItemIdインデックスが正しく構築される', async () => {
      const multiRecipeXml = `<?xml version="1.0" encoding="UTF-8"?>
<ArrayOfRecipe>
  <Recipe>
    <SID>1</SID>
    <name>レシピ1</name>
    <Type>Smelt</Type>
    <Explicit>false</Explicit>
    <TimeSpend>1</TimeSpend>
    <Results>
      <Item>
        <id>1103</id>
        <name>鉄インゴット</name>
        <count>1</count>
        <Type>Smelt</Type>
        <isRaw>false</isRaw>
      </Item>
    </Results>
    <GridIndex>1101</GridIndex>
    <productive>true</productive>
  </Recipe>
  <Recipe>
    <SID>2</SID>
    <name>レシピ2（代替）</name>
    <Type>Assemble</Type>
    <Explicit>true</Explicit>
    <TimeSpend>2</TimeSpend>
    <Results>
      <Item>
        <id>1103</id>
        <name>鉄インゴット</name>
        <count>2</count>
        <Type>Smelt</Type>
        <isRaw>false</isRaw>
      </Item>
    </Results>
    <GridIndex>1102</GridIndex>
    <productive>false</productive>
  </Recipe>
</ArrayOfRecipe>`;

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockItemsXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(multiRecipeXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockMachinesXml) } as Response);

      const gameData = await loadGameData(undefined, 'ja');

      const recipesFor1103 = gameData.recipesByItemId.get(1103);
      expect(recipesFor1103).toBeDefined();
      expect(recipesFor1103).toHaveLength(2);
      expect(recipesFor1103?.[0].SID).toBe(1);
      expect(recipesFor1103?.[1].SID).toBe(2);
    });

    it('allItemsマップがitemsとmachinesを統合', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockItemsXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockRecipesXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockMachinesXml) } as Response);

      const gameData = await loadGameData(undefined, 'ja');

      // 3 items + 2 machines = 5 total
      expect(gameData.allItems.size).toBe(5);

      // itemsから取得
      expect(gameData.allItems.get(1101)?.name).toBe('鉄鉱石');

      // machinesから取得
      expect(gameData.allItems.get(2301)?.name).toBe('製錬設備');
    });

    it('数値型フィールドが正しく変換される', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockItemsXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockRecipesXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockMachinesXml) } as Response);

      const gameData = await loadGameData(undefined, 'ja');

      const item = gameData.items.get(1101);
      expect(typeof item?.id).toBe('number');
      expect(typeof item?.count).toBe('number');

      const recipe = gameData.recipes.get(1);
      expect(typeof recipe?.SID).toBe('number');
      expect(typeof recipe?.TimeSpend).toBe('number');
      expect(typeof recipe?.Items[0].count).toBe('number');

      const machine = gameData.machines.get(2301);
      expect(typeof machine?.assemblerSpeed).toBe('number');
      expect(typeof machine?.workEnergyPerTick).toBe('number');
      expect(machine?.assemblerSpeed).toBe(1);
      expect(machine?.workEnergyPerTick).toBe(360);
    });

    it('Items/Resultsが空の場合も正しく処理', async () => {
      const emptyItemsRecipeXml = `<?xml version="1.0" encoding="UTF-8"?>
<ArrayOfRecipe>
  <Recipe>
    <SID>1</SID>
    <name>空レシピ</name>
    <Type>Smelt</Type>
    <Explicit>false</Explicit>
    <TimeSpend>1</TimeSpend>
    <Results>
      <Item>
        <id>1103</id>
        <name>鉄インゴット</name>
        <count>1</count>
        <Type>Smelt</Type>
        <isRaw>false</isRaw>
      </Item>
    </Results>
    <GridIndex>1101</GridIndex>
    <productive>true</productive>
  </Recipe>
</ArrayOfRecipe>`;

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockItemsXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(emptyItemsRecipeXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockMachinesXml) } as Response);

      const gameData = await loadGameData(undefined, 'ja');

      const recipe = gameData.recipes.get(1);
      expect(recipe?.Items).toEqual([]);
      expect(recipe?.Results).toHaveLength(1);
    });

    it('デフォルトロケールが"ja"である', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockItemsXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockRecipesXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockMachinesXml) } as Response);

      await loadGameData();

      expect(global.fetch).toHaveBeenCalledWith('/data/Items/Items_ja.xml');
      expect(global.fetch).toHaveBeenCalledWith('/data/Recipes/Recipes_ja.xml');
      expect(global.fetch).toHaveBeenCalledWith('/data/Machines/Machines_ja.xml');
    });

    it('機械のboolean値（isPowerConsumer, isPowerExchanger）を正しく変換', async () => {
      const machineWithBoolXml = `<?xml version="1.0" encoding="UTF-8"?>
<ArrayOfMachine>
  <Machine>
    <id>2301</id>
    <name>消費機械</name>
    <count>1</count>
    <Type>Smelt</Type>
    <assemblerSpeed>1</assemblerSpeed>
    <workEnergyPerTick>360</workEnergyPerTick>
    <idleEnergyPerTick>12</idleEnergyPerTick>
    <exchangeEnergyPerTick>0</exchangeEnergyPerTick>
    <isPowerConsumer>true</isPowerConsumer>
    <isPowerExchanger>false</isPowerExchanger>
  </Machine>
  <Machine>
    <id>2302</id>
    <name>交換機械</name>
    <count>1</count>
    <Type>Particle</Type>
    <assemblerSpeed>1</assemblerSpeed>
    <workEnergyPerTick>0</workEnergyPerTick>
    <idleEnergyPerTick>0</idleEnergyPerTick>
    <exchangeEnergyPerTick>100</exchangeEnergyPerTick>
    <isPowerConsumer>false</isPowerConsumer>
    <isPowerExchanger>true</isPowerExchanger>
  </Machine>
</ArrayOfMachine>`;

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockItemsXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(mockRecipesXml) } as Response)
        .mockResolvedValueOnce({ text: () => Promise.resolve(machineWithBoolXml) } as Response);

      const gameData = await loadGameData(undefined, 'ja');

      const consumer = gameData.machines.get(2301);
      expect(consumer?.isPowerConsumer).toBe(true);
      expect(consumer?.isPowerExchanger).toBe(false);

      const exchanger = gameData.machines.get(2302);
      expect(exchanger?.isPowerConsumer).toBe(false);
      expect(exchanger?.isPowerExchanger).toBe(true);
    });
  });
});
