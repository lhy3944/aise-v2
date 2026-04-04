'use client';

import { ProjectGlossaryTab } from '@/components/projects/ProjectGlossaryTab';
import { ProjectKnowledgeTab } from '@/components/projects/ProjectKnowledgeTab';
import { ProjectOverviewTab } from '@/components/projects/ProjectOverviewTab';
import { ProjectReadinessCard } from '@/components/projects/ProjectReadinessCard';
import { ProjectSectionsTab } from '@/components/projects/ProjectSectionsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { layoutMaxW } from '@/config/layout';
import { cn } from '@/lib/utils';
import { usePanelStore } from '@/stores/panel-store';
import { BookOpen, Box, FolderOpen, LayoutList } from 'lucide-react';
import { use, useRef } from 'react';

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailLayout({ params }: Props) {
  const { id } = use(params);
  const fullWidthMode = usePanelStore((s) => s.fullWidthMode);
  const tabsRef = useRef<HTMLDivElement>(null);

  const maxW = layoutMaxW(fullWidthMode);

  function handleReadinessNavigate(tab: string) {
    const trigger = tabsRef.current?.querySelector(`[data-value="${tab}"]`) as HTMLElement | null;
    trigger?.click();
  }

  return (
    <Tabs defaultValue='overview' className='flex flex-1 flex-col overflow-hidden' ref={tabsRef}>
      {/* Tab Navigation */}
      <div className='bg-canvas-primary'>
        <div
          className={cn(
            'mx-auto pt-11 transition-[max-width] duration-300 ease-in-out sm:px-6',
            maxW,
          )}
        >
          <div className='border-line-subtle flex items-center justify-between border-b'>
            <TabsList variant='line' className='w-full justify-start'>
              <TabsTrigger
                value='overview'
                data-value='overview'
                className='data-[state=active]:text-accent-primary after:bg-accent-primary px-6 md:flex-initial'
              >
                <Box className='size-4' />
                기본 정보
              </TabsTrigger>
              <TabsTrigger
                value='knowledge'
                data-value='knowledge'
                className='data-[state=active]:text-accent-primary after:bg-accent-primary px-6 md:flex-initial'
              >
                <FolderOpen className='size-4' />
                지식 저장소
              </TabsTrigger>
              <TabsTrigger
                value='glossary'
                data-value='glossary'
                className='data-[state=active]:text-accent-primary after:bg-accent-primary px-6 md:flex-initial'
              >
                <BookOpen className='size-4' />
                용어 사전
              </TabsTrigger>
              <TabsTrigger
                value='sections'
                data-value='sections'
                className='data-[state=active]:text-accent-primary after:bg-accent-primary px-6 md:flex-initial'
              >
                <LayoutList className='size-4' />
                섹션
              </TabsTrigger>
            </TabsList>

            {/* Readiness indicator */}
            <div className='shrink-0 pb-1 pr-2'>
              <ProjectReadinessCard projectId={id} onNavigate={handleReadinessNavigate} />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto'>
        <div
          className={cn('mx-auto px-6 py-6 transition-[max-width] duration-300 ease-in-out', maxW)}
        >
          <TabsContent value='overview'>
            <ProjectOverviewTab projectId={id} />
          </TabsContent>
          <TabsContent value='knowledge'>
            <ProjectKnowledgeTab projectId={id} />
          </TabsContent>
          <TabsContent value='glossary'>
            <ProjectGlossaryTab projectId={id} />
          </TabsContent>
          <TabsContent value='sections'>
            <ProjectSectionsTab projectId={id} />
          </TabsContent>
        </div>
      </div>
    </Tabs>
  );
}
