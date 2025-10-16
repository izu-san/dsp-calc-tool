# 多言語対応ガイド (Localization Guide)

## 📁 必要なファイル構造

言語ごとにXMLファイルを用意してください：

```
public/data/
  Items/
    Items_ja.xml     ← 日本語版（デフォルト）
    Items_en.xml     ← 英語版
    Items_zh.xml     ← 中国語版
    Icons/
      *.png
  
  Recipes/
    Recipes_ja.xml   ← 日本語版（デフォルト）
    Recipes_en.xml   ← 英語版
    Recipes_zh.xml   ← 中国語版
    Icons/
      *.png
  
  Machines/
    Machines_ja.xml  ← 日本語版（デフォルト）
    Machines_en.xml  ← 英語版
    Machines_zh.xml  ← 中国語版
    Icons/
      *.png
```

## 🔧 実装済みの機能

### ✅ 1. パーサーのロケール対応
`src/lib/parser.ts`は自動的にロケールに応じたファイルを読み込みます：
- `loadGameData(undefined, 'ja')` → `Items_ja.xml`を読み込み
- `loadGameData(undefined, 'en')` → `Items_en.xml`を読み込み
- ファイルが見つからない場合は`Items.xml`にフォールバック

### ✅ 2. ストアのロケール管理
`src/stores/gameDataStore.ts`は：
- `locale`をlocalStorageに保存
- `setLocale(locale)`で言語を切り替えると自動的にゲームデータを再読み込み

### ✅ 3. 言語切り替えUI
`src/components/LanguageSwitcher/index.tsx`：
- ヘッダーに🇯🇵日本語 / 🇺🇸English / 🇨🇳中文の切り替えドロップダウン
- 選択した言語をlocalStorageに保存
- 次回アクセス時も選択した言語を維持

## 📝 XMLファイルの作成方法

### 例：Items_en.xml

元の`Items.xml`（日本語）をコピーして、`name`属性を英語に翻訳してください：

```xml
<?xml version="1.0" encoding="utf-8"?>
<ArrayOfItem xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <Item id="1101" name="Iron Ore" count="1" Type="6,1" miningFrom="铁矿" produceFrom="" isRaw="true" />
  <Item id="1102" name="Copper Ore" count="1" Type="6,1" miningFrom="铜矿" produceFrom="" isRaw="true" />
  <Item id="1103" name="Stone" count="1" Type="6,1" miningFrom="石矿" produceFrom="" isRaw="true" />
  <!-- ... -->
</ArrayOfItem>
```

### 例：Recipes_en.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<ArrayOfRecipe xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <Recipe SID="1" name="Iron Ingot" Type="2" Explicit="true" TimeSpend="60" productive="true">
    <Items>
      <ItemCount id="1101" name="Iron Ore" count="1" />
    </Items>
    <Results>
      <ItemCount id="1101" name="Iron Ingot" count="1" />
    </Results>
  </Recipe>
  <!-- ... -->
</ArrayOfRecipe>
```

## 🚀 使い方

### 1. XMLファイルを配置
上記の構造に従って、各言語のXMLファイルを`public/data/`に配置してください。

### 2. 言語切り替え
アプリケーションのヘッダー右上にある言語切り替えドロップダウンから選択するだけです。

### 3. 自動保存
選択した言語はlocalStorageに保存され、次回アクセス時も維持されます。

## ⚠️ 注意事項

### ファイルが見つからない場合
指定したロケールのファイルが存在しない場合、自動的にデフォルトファイル（`Items.xml`など）にフォールバックします。

コンソールに警告が表示されます：
```
/data/Items/Items_en.xml not found, falling back to default
```

### 翻訳の一貫性
- `id`属性は変更しないでください（すべての言語で同じ値）
- `iconPath`も変更不要
- 翻訳が必要なのは`name`属性のみです

### Mod対応
カスタムRecipes.xmlをアップロードした場合、そのXMLの言語が優先されます。

## 📚 参考：Dyson Sphere Programの公式ローカライゼーション

ゲームの実際のXMLファイルは以下の場所にあります：
```
Steam\steamapps\common\Dyson Sphere Program\DSP_Data\StreamingAssets\
```

これらのファイルを参考に翻訳を作成できます。

## ✅ 完了チェックリスト

- [ ] `Items_ja.xml`を作成
- [ ] `Items_en.xml`を作成
- [ ] `Recipes_ja.xml`を作成
- [ ] `Recipes_en.xml`を作成
- [ ] `Machines_ja.xml`を作成
- [ ] `Machines_en.xml`を作成
- [ ] （オプション）`Items_zh.xml`を作成
- [ ] （オプション）`Recipes_zh.xml`を作成
- [ ] （オプション）`Machines_zh.xml`を作成

---

**実装完了！** 各言語のXMLファイルを用意すれば、すぐに多言語対応が有効になります。

### 現在の状態
- `src/i18n.ts`に日本語・英語の翻訳が定義済み
- ただし、各コンポーネントで`useTranslation()`を使用していないため、まだ有効化されていません

### 使い方

#### 1. コンポーネントでuseTranslationを使用

```tsx
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <button>{t('save')}</button>  // "保存" または "Save"
  );
}
```

#### 2. 翻訳を追加する

`src/i18n.ts`を編集：

```typescript
const resources = {
  en: {
    translation: {
      save: 'Save',
      load: 'Load',
      // ... 追加
    },
  },
  ja: {
    translation: {
      save: '保存',
      load: '読み込み',
      // ... 追加
    },
  },
};
```

#### 3. 言語を切り替える

```tsx
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  return (
    <button onClick={() => i18n.changeLanguage('en')}>
      English
    </button>
  );
}
```

---

## 方法2: ゲームデータの多言語化（推奨）

### アプローチ1: 多言語XMLファイルを用意する

Dyson Sphere Programのゲームデータには、すでに多言語対応があります。

#### ファイル構造

```
public/data/
  Items/
    Items_en.xml     ← 英語版
    Items_ja.xml     ← 日本語版
    Items_zh.xml     ← 中国語版
  Recipes/
    Recipes_en.xml
    Recipes_ja.xml
  Machines/
    Machines_en.xml
    Machines_ja.xml
```

#### XMLの例（Items_en.xml）

```xml
<?xml version="1.0" encoding="utf-8"?>
<ItemList>
  <Item id="1101" name="Iron Ore" iconPath="Icons/1101.png" />
  <Item id="1102" name="Copper Ore" iconPath="Icons/1102.png" />
  <!-- ... -->
</ItemList>
```

#### XMLの例（Items_ja.xml）

```xml
<?xml version="1.0" encoding="utf-8"?>
<ItemList>
  <Item id="1101" name="鉄鉱石" iconPath="Icons/1101.png" />
  <Item id="1102" name="銅鉱石" iconPath="Icons/1102.png" />
  <!-- ... -->
</ItemList>
```

#### パーサーを修正（src/lib/parser.ts）

```typescript
export async function loadGameData(locale: string = 'ja'): Promise<GameData> {
  const [itemsXml, recipesXml, machinesXml] = await Promise.all([
    fetch(`/data/Items/Items_${locale}.xml`).then(r => r.text()),
    fetch(`/data/Recipes/Recipes_${locale}.xml`).then(r => r.text()),
    fetch(`/data/Machines/Machines_${locale}.xml`).then(r => r.text()),
  ]);
  
  // ... 解析処理
}
```

### アプローチ2: XML内に多言語属性を持たせる（簡単）

XMLファイルを複数用意するのが面倒な場合、1つのXMLに複数言語を含める方法もあります。

#### XMLの例（Items.xml）

```xml
<?xml version="1.0" encoding="utf-8"?>
<ItemList>
  <Item id="1101" 
        name="Iron Ore" 
        name_ja="鉄鉱石"
        name_zh="铁矿石"
        iconPath="Icons/1101.png" />
  <Item id="1102" 
        name="Copper Ore" 
        name_ja="銅鉱石"
        name_zh="铜矿石"
        iconPath="Icons/1102.png" />
  <!-- ... -->
</ItemList>
```

#### パーサーを修正

```typescript
function parseItems(xml: string, locale: string = 'ja'): Map<number, Item> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const items = new Map<number, Item>();
  
  doc.querySelectorAll('Item').forEach(itemNode => {
    const id = parseInt(itemNode.getAttribute('id') || '0');
    
    // ロケールに応じた名前を取得
    const nameAttr = locale === 'en' 
      ? 'name' 
      : `name_${locale}`;
    
    const name = itemNode.getAttribute(nameAttr) 
      || itemNode.getAttribute('name') // フォールバック
      || 'Unknown';
    
    items.set(id, {
      id,
      name,
      iconPath: itemNode.getAttribute('iconPath') || '',
    });
  });
  
  return items;
}
```

---

## 推奨アプローチ

### 🎯 最も簡単な方法：アプローチ2（単一XMLファイル）

1. **既存のXMLファイルに翻訳属性を追加**
   - `public/data/Items/Items.xml`に`name_ja`、`name_en`属性を追加
   - `public/data/Recipes/Recipes.xml`に`name_ja`、`name_en`属性を追加
   - `public/data/Machines/Machines.xml`に`name_ja`、`name_en`属性を追加

2. **パーサーを修正**
   - `src/lib/parser.ts`でロケールに応じた属性を読み取る

3. **言語切り替えUIを追加**
   - ヘッダーに言語切り替えボタンを配置
   - `localStorage`に選択言語を保存
   - ページリロード時に自動適用

### 例：言語切り替えコンポーネント

```tsx
import { useState, useEffect } from 'react';
import { useGameDataStore } from '../stores/gameDataStore';

export function LanguageSwitcher() {
  const [locale, setLocale] = useState(
    localStorage.getItem('locale') || 'ja'
  );
  const { loadData } = useGameDataStore();
  
  const handleChange = async (newLocale: string) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
    
    // ゲームデータを再読み込み
    await loadData(newLocale);
  };
  
  return (
    <select 
      value={locale} 
      onChange={(e) => handleChange(e.target.value)}
      className="px-3 py-2 border rounded"
    >
      <option value="ja">日本語</option>
      <option value="en">English</option>
      <option value="zh">中文</option>
    </select>
  );
}
```

---

## 実装ステップ

### ステップ1: XMLファイルに翻訳を追加

`public/data/Items/Items.xml`の各`<Item>`に`name_en`属性を追加：

```xml
<Item id="1101" name="鉄鉱石" name_en="Iron Ore" iconPath="Icons/1101.png" />
```

### ステップ2: パーサーを修正

`src/lib/parser.ts`の`parseItems`、`parseRecipes`、`parseMachines`関数を修正して、ロケールに応じた名前を取得するようにします。

### ステップ3: gameDataStoreを修正

`src/stores/gameDataStore.ts`の`loadData`関数にロケールパラメータを追加：

```typescript
loadData: async (locale: string = 'ja') => {
  set({ isLoading: true, error: null });
  try {
    const data = await loadGameData(locale);
    set({ data, isLoading: false });
  } catch (err) {
    // ...
  }
}
```

### ステップ4: 言語切り替えUIを追加

ヘッダーに`LanguageSwitcher`コンポーネントを追加します。

---

## まとめ

### UIテキスト（ボタン、説明など）
- `src/i18n.ts`に翻訳を追加
- 各コンポーネントで`useTranslation()`を使用

#### 追加済みの新規キー（PlanManager / a11y 連携）

- 共通操作
  - `expand` / `collapse`（展開/折りたたみ）

- PlanManager（保存・読込・共有のオプション）
  - `includeNodeOverrides`（ノードオーバーライドを含める）
  - `mergeNodeOverridesOnLoad`（読込時にノードオーバーライドをマージ）
  - `includeNodeOverridesInURL`（URLにノードオーバーライドを含める）

### ゲームデータ（アイテム名、レシピ名）
- **推奨**: XMLファイルに`name_ja`、`name_en`属性を追加
- パーサーでロケールに応じて読み分け
- 言語切り替えUIでゲームデータを再読み込み

実装を希望される場合は、どちらの方法で進めるか教えてください！
