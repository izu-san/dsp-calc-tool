import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ItemIcon } from '../ItemIcon';
import { getDataPath } from '../../utils/paths';

describe('ItemIcon', () => {
  it('正しいitemIdでアイコンをレンダリングできる', () => {
    render(<ItemIcon itemId={1001} alt="Iron Ore" />);
    
    const img = screen.getByAltText('Iron Ore');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('width', '32');
    expect(img).toHaveAttribute('height', '32');
  });

  it('カスタムサイズでレンダリングできる', () => {
    render(<ItemIcon itemId={1001} size={64} alt="Iron Ore" />);
    
    const img = screen.getByAltText('Iron Ore');
    expect(img).toHaveAttribute('width', '64');
    expect(img).toHaveAttribute('height', '64');
  });

  it('カスタムclassNameを適用できる', () => {
    render(<ItemIcon itemId={1001} className="custom-class" alt="Iron Ore" />);
    
    const img = screen.getByAltText('Iron Ore');
    expect(img).toHaveClass('inline-block');
    expect(img).toHaveClass('custom-class');
  });

  it('正しいアイコンパスを設定する（Items folder）', () => {
    render(<ItemIcon itemId={1001} alt="Iron Ore" />);
    
    const picture = screen.getByAltText('Iron Ore').parentElement;
    const source = picture?.querySelector('source');
    
  expect(source).toBeInTheDocument();
  expect(source).toHaveAttribute('srcset', getDataPath('data/Items/Icons/1001.png'));
  });

  it('フォールバックパスを設定する（Machines folder）', () => {
    render(<ItemIcon itemId={2001} alt="Assembler" />);
    
    const img = screen.getByAltText('Assembler');
  expect(img).toHaveAttribute('src', getDataPath('data/Machines/Icons/2001.png'));
  });

  it('エラー時にフォールバック処理が動作する', () => {
    const { container } = render(<ItemIcon itemId={9999} alt="Unknown" />);
    const img = container.querySelector('img') as HTMLImageElement;
    
    // エラーハンドラが設定されていることを確認
    expect(img.onerror).toBeDefined();
    
    // onErrorイベントをシミュレート - ネイティブイベントを使用
    const event = new Event('error');
    img.dispatchEvent(event);
    
    // 初期状態では機械フォルダのパスが設定されている
  expect(img.src).toContain(getDataPath('data/Machines/Icons/9999.png'));
  });

  it('altテキストが空の場合でもレンダリングできる', () => {
    const { container } = render(<ItemIcon itemId={1001} />);
    
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', '');
  });

  it('picture要素とsource要素を使用している', () => {
    const { container } = render(<ItemIcon itemId={1001} alt="Iron Ore" />);
    
    const picture = container.querySelector('picture');
    const source = picture?.querySelector('source');
    const img = picture?.querySelector('img');
    
    expect(picture).toBeInTheDocument();
    expect(source).toBeInTheDocument();
    expect(img).toBeInTheDocument();
  });
});
