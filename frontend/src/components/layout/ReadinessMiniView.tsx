'use client';

import { cn } from '@/lib/utils';
import { useReadinessStore } from '@/stores/readiness-store';
import { useProjectStore } from '@/stores/project-store';
import { BookOpen, FolderOpen, LayoutList } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ITEMS = [
  { key: 'knowledge' as const, icon: FolderOpen },
  { key: 'glossary' as const, icon: BookOpen },
  { key: 'sections' as const, icon: LayoutList },
];

export function ReadinessMiniView() {
  const router = useRouter();
  const currentProject = useProjectStore((s) => s.currentProject);
  const data = useReadinessStore((s) => s.data);
  const fetch = useReadinessStore((s) => s.fetch);

  useEffect(() => {
    if (currentProject) {
      fetch(currentProject.project_id);
    }
  }, [currentProject, fetch]);

  if (!currentProject || !data) return null;

  return (
    <div
      className='border-line-primary flex items-center justify-between rounded-md border px-2 py-1.5 cursor-pointer hover:bg-canvas-surface/50 transition-colors'
      onClick={() => router.push(`/projects/${currentProject.project_id}`)}
    >
      {ITEMS.map(({ key, icon: Icon }) => {
        const item = data[key];
        return (
          <div key={key} className='flex items-center gap-1'>
            <Icon
              className={cn(
                'size-3',
                item.sufficient ? 'text-green-500' : 'text-amber-500',
              )}
            />
            <span
              className={cn(
                'text-[10px] font-semibold',
                item.sufficient ? 'text-green-600' : 'text-amber-600',
              )}
            >
              {item.count}
            </span>
          </div>
        );
      })}
      <span
        className={cn(
          'size-2 rounded-full',
          data.is_ready ? 'bg-green-500' : 'bg-amber-500',
        )}
      />
    </div>
  );
}
