'use client';

import { BookOpen, ChevronLeft, FolderOpen, Info } from 'lucide-react';
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
      {/* Tab Navigation with project name */}
      <div className='border-line-primary bg-canvas-primary border-b px-6'>
        <div
          className={cn(
            'mx-auto flex items-center gap-4 transition-[max-width] duration-300 ease-in-out',
            maxW,
          )}
        >
          {/* Back + Project Name */}
          <div className='flex items-center gap-1.5 pr-4'>
            <Link
              href='/projects'
              className='text-fg-muted hover:text-fg-secondary transition-colors'
            >
              <ChevronLeft className='size-4' />
            </Link>
            {isLoading ? (
              <Skeleton className='h-4 w-24' />
            ) : project ? (
              <span className='text-fg-primary text-sm font-semibold'>{project.name}</span>
            ) : (
              <span className='text-fg-muted text-xs'>프로젝트 없음</span>
            )}
          </div>

          {/* Tabs */}
          <div className='flex gap-1'>
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
