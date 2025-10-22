import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BackgroundEffects } from '../BackgroundEffects';

describe('BackgroundEffects', () => {
  it('正しくレンダリングされる', () => {
    const { container } = render(<BackgroundEffects />);
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('固定配置のコンテナが存在する', () => {
    const { container } = render(<BackgroundEffects />);
    
    const fixedContainer = container.querySelector('.fixed.inset-0.pointer-events-none');
    expect(fixedContainer).toBeInTheDocument();
  });

  it('nebula-gradientの背景要素が存在する', () => {
    const { container } = render(<BackgroundEffects />);
    
    const nebulaGradient = container.querySelector('.bg-nebula-gradient');
    expect(nebulaGradient).toBeInTheDocument();
    expect(nebulaGradient).toHaveClass('opacity-40');
  });

  it('grid-bgの背景要素が存在する', () => {
    const { container } = render(<BackgroundEffects />);
    
    const gridBg = container.querySelector('.grid-bg');
    expect(gridBg).toBeInTheDocument();
    expect(gridBg).toHaveClass('opacity-30');
  });

  it('ポインターイベントが無効化されている', () => {
    const { container } = render(<BackgroundEffects />);
    
    const fixedContainer = container.querySelector('.fixed');
    expect(fixedContainer).toHaveClass('pointer-events-none');
  });
});

