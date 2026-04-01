'use client';

import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface ResizeHandleProps {
  isOpen?: boolean;
  isResizing?: boolean;
  onPointerDown: (e: React.MouseEvent | React.TouchEvent) => void;
}

export function ResizeHandle({
  isOpen = false,
  isResizing = false,
  onPointerDown,
}: ResizeHandleProps) {
  return (
    <div
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
      className={cn(
        'absolute top-0 left-1/2 z-10 h-full w-6 -translate-x-1/2 cursor-col-resize select-none',
        'group flex items-center justify-center',
        'hover:bg-border/30 transition-colors duration-150',
      )}
    >
      {/* 가이드 선 */}
      <div
        className={cn(
          'h-full w-px transition-all duration-150',
          isOpen
            ? 'bg-line-primary group-hover:bg-accent-primary'
            : 'bg-accent-primary opacity-0 group-hover:opacity-100',
        )}
      />

      {/* 플로팅 토글 버튼 — Closed 상태 */}
      {!isOpen && (
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 transition-[right] duration-150',
            isResizing ? 'right-0' : 'right-2',
          )}
        >
          <Button
            variant={'ghost'}
            size='icon-sm'
            className='bg-border/30 w-6 border-0 shadow-none ring-0'
          >
            <GripVertical />
          </Button>
        </div>
      )}

      {/* 열린 상태에서 hover 시 닫기 인디케이터 */}
      {isOpen && (
        <div className='absolute top-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100'>
          <Button variant={'ghost'} size='icon-sm' className='w-6'>
            <GripVertical />
          </Button>
        </div>
      )}
    </div>
  );
}
