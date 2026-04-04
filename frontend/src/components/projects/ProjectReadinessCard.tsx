'use client';

import { cn } from '@/lib/utils';
import { projectService } from '@/services/project-service';
import type { ReadinessResponse } from '@/types/project';
import { AlertTriangle, BookOpen, CheckCircle2, FileText, FolderOpen } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface ProjectReadinessCardProps {
  projectId: string;
  onNavigate?: (tab: string) => void;
}

const READINESS_ITEMS = [
  { key: 'knowledge' as const, icon: FolderOpen, tab: 'knowledge' },
  { key: 'glossary' as const, icon: BookOpen, tab: 'glossary' },
  { key: 'sections' as const, icon: FileText, tab: 'sections' },
];

export function ProjectReadinessCard({ projectId, onNavigate }: ProjectReadinessCardProps) {
  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null);

  const fetchReadiness = useCallback(async () => {
    try {
      const res = await projectService.getReadiness(projectId);
      setReadiness(res);
    } catch {
      // 글로벌 핸들링
    }
  }, [projectId]);

  useEffect(() => {
    fetchReadiness();
  }, [fetchReadiness]);

  if (!readiness) return null;

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        readiness.is_ready
          ? 'border-green-500/30 bg-green-500/5'
          : 'border-amber-500/30 bg-amber-500/5',
      )}
    >
      <div className='mb-3 flex items-center gap-2'>
        {readiness.is_ready ? (
          <CheckCircle2 className='size-4 text-green-600' />
        ) : (
          <AlertTriangle className='size-4 text-amber-600' />
        )}
        <h4 className='text-fg-primary text-sm font-semibold'>
          {readiness.is_ready ? 'Agent 실행 준비 완료' : 'Agent 실행 전 준비가 필요합니다'}
        </h4>
      </div>

      <div className='flex gap-3'>
        {READINESS_ITEMS.map(({ key, icon: Icon, tab }) => {
          const item = readiness[key];
          return (
            <button
              key={key}
              onClick={() => onNavigate?.(tab)}
              className={cn(
                'flex flex-1 items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors',
                item.sufficient
                  ? 'border-green-500/20 bg-green-500/5 hover:bg-green-500/10'
                  : 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10',
              )}
            >
              <Icon
                className={cn(
                  'size-4 shrink-0',
                  item.sufficient ? 'text-green-600' : 'text-amber-600',
                )}
              />
              <div className='min-w-0'>
                <p className='text-fg-primary text-xs font-medium'>{item.label}</p>
                <p
                  className={cn(
                    'text-xs font-semibold',
                    item.sufficient ? 'text-green-600' : 'text-amber-600',
                  )}
                >
                  {item.count}개
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
