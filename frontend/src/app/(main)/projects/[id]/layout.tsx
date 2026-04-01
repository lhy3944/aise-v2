'use client';

import { BookOpen, FolderOpen, Info } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { use } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useFetch } from '@/hooks/useFetch';
import { cn } from '@/lib/utils';
import { usePanelStore } from '@/stores/panel-store';
import type { Project } from '@/types/project';

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default function ProjectDetailLayout({ children, params }: Props) {
  const { id } = use(params);
  const pathname = usePathname();
  const { data: project, isLoading } = useFetch<Project>(`/api/v1/projects/${id}`);
  const fullWidthMode = usePanelStore((s) => s.fullWidthMode);

  const maxW = fullWidthMode ? 'max-w-full' : 'max-w-6xl';

  const tabs = [
    { href: `/projects/${id}`, label: '개요', icon: Info },
    { href: `/projects/${id}/glossary`, label: '용어사전', icon: BookOpen },
    { href: `/projects/${id}/knowledge-sources`, label: '지식 소스', icon: FolderOpen },
  ];

  return (
    <div className='flex flex-1 flex-col overflow-hidden'>
      {/* Project Header */}
      <div className='border-line-primary bg-canvas-primary p-6'>
        <div
          className={cn(
            'mx-auto flex items-center gap-3 transition-[max-width] duration-300 ease-in-out',
            maxW,
          )}
        >
          {isLoading ? (
            <Skeleton className='h-5 w-40' />
          ) : project ? (
            <div className='flex items-center gap-3'>
              <h1 className='text-fg-primary text-base font-semibold'>{project.name}</h1>
              {project.domain && <span className='text-fg-muted text-xs'>{project.domain}</span>}
            </div>
          ) : (
            <span className='text-fg-muted text-sm'>프로젝트를 찾을 수 없습니다</span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='border-line-primary bg-canvas-primary border-b px-6'>
        <div
          className={cn('mx-auto flex gap-1 transition-[max-width] duration-300 ease-in-out', maxW)}
        >
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-accent-primary text-accent-primary'
                    : 'text-fg-muted hover:text-fg-secondary border-transparent',
                )}
              >
                <tab.icon className='size-4' />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto'>
        <div
          className={cn('mx-auto px-6 py-6 transition-[max-width] duration-300 ease-in-out', maxW)}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
