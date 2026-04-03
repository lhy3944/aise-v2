'use client';

import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { MobileBottomDrawer } from '@/components/layout/MobileBottomDrawer';
import { MobileRightDrawer } from '@/components/layout/MobileRightDrawer';
import { NotificationPanel } from '@/components/layout/NotificationPanel';
import { PanelToggleBar } from '@/components/layout/PanelToggleBar';
import { ResizeHandle } from '@/components/layout/ResizeHandle';
import { RightPanel } from '@/components/layout/RightPanel';
import { ProjectSelector } from '@/components/projects/ProjectSelector';
import { useResponsivePanel } from '@/hooks/useMediaQuery';
import { useResize } from '@/hooks/useResize';
import { cn } from '@/lib/utils';
import { usePanelStore } from '@/stores/panel-store';
import { useRef } from 'react';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { onPointerDown, isResizing } = useResize(containerRef, panelRef, sidebarRef);

  const leftSidebarOpen = usePanelStore((s) => s.leftSidebarOpen);
  const rightPanelOpen = usePanelStore((s) => s.rightPanelOpen);
  const rightPanelWidth = usePanelStore((s) => s.rightPanelWidth);
  const isMobile = usePanelStore((s) => s.isMobile);

  useResponsivePanel();

  const showLeftPanel = !isMobile;
  const showSidebar = leftSidebarOpen && !isMobile;
  const showRightPanel = rightPanelOpen;

  return (
    <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
      <div ref={containerRef} className='flex flex-1 overflow-hidden'>
        {/* LeftSidebar */}
        <div
          ref={sidebarRef}
          className={cn(
            'shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out',
            'max-md:w-0!',
            !showLeftPanel ? 'w-0' : showSidebar ? 'w-[220px]' : 'w-15',
          )}
          aria-hidden={!showLeftPanel}
        >
          <LeftSidebar />
        </div>

        {/* Sidebar divider */}
        <div
          className={cn(
            'bg-line-primary h-full w-px shrink-0 transition-opacity duration-300',
            showSidebar ? 'opacity-100' : 'opacity-0',
          )}
        />

        {/* Content area */}
        <div className='relative flex min-w-0 flex-1 flex-col overflow-hidden'>
          {/* Toolbar — 항상 표시, 하단 블러 그라데이션 */}
          <div className='relative z-10 shrink-0 px-2 py-1.5 sm:px-4'>
            <div className='flex items-center'>
              {/* 좌측: 모바일 버튼 or 데스크탑 PanelToggleBar */}
              <div className='flex shrink-0 items-center gap-1'>
                {isMobile && <MobileBottomDrawer />}
                <PanelToggleBar />
              </div>
              {isMobile && (
                <div className='absolute inset-x-0 flex justify-center pointer-events-none'>
                  <div className='pointer-events-auto min-w-[200px] max-w-[60%]'>
                    <ProjectSelector />
                  </div>
                </div>
              )}
              <div className='ml-auto flex shrink-0 items-center gap-1'>
                <MobileRightDrawer />
              </div>
            </div>
            {/* 하단 블러 페이드 — toolbar 아래 경계에서 메시지로 자연스럽게 전환 */}
            <div className='pointer-events-none absolute inset-x-0 bottom-0 h-4 translate-y-full bg-gradient-to-b from-canvas-primary/80 to-transparent' />
          </div>

          {children}
        </div>

        {/* ResizeHandle — 패널 바깥에 독립 배치 (잘림 방지) */}
        <div className='relative hidden h-full w-0 shrink-0 lg:block'>
          <ResizeHandle
            isOpen={showRightPanel}
            isResizing={isResizing}
            onPointerDown={onPointerDown}
          />
        </div>

        {/* RightPanel (lg 이상에서만 표시) */}
        <div
          ref={panelRef}
          className={cn(
            'hidden h-full shrink-0 overflow-hidden lg:block',
            isResizing ? 'transition-none' : 'transition-[width] duration-300 ease-in-out',
          )}
          style={{ width: showRightPanel ? `${rightPanelWidth}%` : '0%' }}
          aria-hidden={!showRightPanel}
        >
          <RightPanel />
        </div>

        {/* NotificationPanel — Drawer overlay */}
        <NotificationPanel />
      </div>
    </div>
  );
}
