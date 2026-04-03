'use client';

import { HeaderActions } from '@/components/layout/HeaderActions';
import { HeaderTabs } from '@/components/layout/HeaderTabs';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { Logo } from '@/components/shared/Logo';
import { layoutMaxW } from '@/config/layout';
import { cn } from '@/lib/utils';
import { usePanelStore } from '@/stores/panel-store';

interface HeaderProps {
  showLayoutToggle?: boolean;
}

export function Header({ showLayoutToggle = false }: HeaderProps) {
  const fullWidthMode = usePanelStore((s) => s.fullWidthMode);
  const headerVisible = usePanelStore((s) => s.headerVisible);
  const isMobile = usePanelStore((s) => s.isMobile);
  const isTablet = usePanelStore((s) => s.isTablet);

  const canHide = isMobile || isTablet;

  return (
    <header
      className={cn(
        'border-line-primary z-50 flex shrink-0 items-center border-b backdrop-blur-xl',
        canHide
          ? 'transition-[height] duration-300 ease-in-out overflow-hidden'
          : 'h-15',
        canHide && headerVisible && 'h-15',
        canHide && !headerVisible && 'h-0 border-b-0',
      )}
    >
      <div
        className={cn(
          'mx-auto flex h-full w-full items-center justify-between px-2 transition-[max-width] duration-300 ease-in-out sm:px-6 lg:px-8',
          layoutMaxW(fullWidthMode),
        )}
      >
        <div className='flex flex-1 items-center'>
          <MobileMenu />
          <Logo />
        </div>

        <div className='flex flex-1 items-center justify-center'>
          <HeaderTabs />
        </div>

        <div className='flex flex-1 items-center justify-end gap-1'>
          <HeaderActions showLayoutToggle={showLayoutToggle} />
        </div>
      </div>
    </header>
  );
}
