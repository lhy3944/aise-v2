'use client';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import { useReadinessStore } from '@/stores/readiness-store';
import { BookOpen, CheckCircle2, FolderOpen, LayoutList, XCircle } from 'lucide-react';
import { useEffect } from 'react';

interface ProjectReadinessCardProps {
  projectId: string;
  onNavigate?: (tab: string) => void;
}

const ITEMS = [
  { key: 'knowledge' as const, icon: FolderOpen, tab: 'knowledge' },
  { key: 'glossary' as const, icon: BookOpen, tab: 'glossary' },
  { key: 'sections' as const, icon: LayoutList, tab: 'sections' },
];

export function ProjectReadinessCard({ projectId, onNavigate }: ProjectReadinessCardProps) {
  const data = useReadinessStore((s) => s.data);
  const fetch = useReadinessStore((s) => s.fetch);

  useEffect(() => {
    fetch(projectId);
  }, [fetch, projectId]);

  if (!data) return null;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            data.is_ready
              ? 'border-green-500/30 bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:text-green-400'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400',
          )}
        >
          <span
            className={cn(
              'size-2 rounded-full',
              data.is_ready ? 'bg-green-500' : 'bg-amber-500',
            )}
          />
          {data.is_ready ? '준비 완료' : '준비 필요'}
        </button>
      </HoverCardTrigger>
      <HoverCardContent align='start' className='w-64 p-3'>
        <p className='text-fg-primary mb-2 text-xs font-semibold'>Agent 실행 준비도</p>
        <div className='flex flex-col gap-1.5'>
          {ITEMS.map(({ key, icon: Icon, tab }) => {
            const item = data[key];
            return (
              <button
                key={key}
                onClick={() => onNavigate?.(tab)}
                className='hover:bg-canvas-surface flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors'
              >
                {item.sufficient ? (
                  <CheckCircle2 className='size-3.5 shrink-0 text-green-500' />
                ) : (
                  <XCircle className='size-3.5 shrink-0 text-amber-500' />
                )}
                <span className='text-fg-secondary flex-1 text-xs'>{item.label}</span>
                <Icon className='text-fg-muted size-3.5 shrink-0' />
                <span
                  className={cn(
                    'text-xs font-medium',
                    item.sufficient ? 'text-green-600' : 'text-amber-600',
                  )}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
