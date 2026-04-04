'use client';

import { ProjectGlossaryTab } from '@/components/projects/ProjectGlossaryTab';
import { ProjectKnowledgeTab } from '@/components/projects/ProjectKnowledgeTab';
import { ProjectOverviewTab } from '@/components/projects/ProjectOverviewTab';
import { ProjectReadinessCard } from '@/components/projects/ProjectReadinessCard';
import { ProjectSectionsTab } from '@/components/projects/ProjectSectionsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { layoutMaxW } from '@/config/layout';
import { cn } from '@/lib/utils';
import { usePanelStore } from '@/stores/panel-store';
import { BookOpen, Box, FolderOpen, LayoutList } from 'lucide-react';
import { use, useRef } from 'react';

interface Props {
  params: Promise<{ id: string }>;
}

const TABS = [
  { value: 'overview', icon: Box, label: '기본 정보' },
  { value: 'knowledge', icon: FolderOpen, label: '지식 저장소' },
  { value: 'glossary', icon: BookOpen, label: '용어 사전' },
  { value: 'sections', icon: LayoutList, label: '섹션' },
];

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
          <div className='border-line-subtle flex items-center border-b'>
            <TabsList
              variant='line'
              className='flex-1 justify-start overflow-x-auto scrollbar-none'
            >
              {TABS.map(({ value, icon: Icon, label }) => (
                <Tooltip key={value}>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value={value}
                      data-value={value}
                      className='data-[state=active]:text-accent-primary after:bg-accent-primary shrink-0 gap-1.5 px-3 md:px-5'
                    >
                      <Icon className='size-4' />
                      <span className='hidden md:inline'>{label}</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent className='md:hidden'>{label}</TooltipContent>
                </Tooltip>
              ))}
            </TabsList>

            {/* Readiness indicator */}
            <div className='shrink-0 pb-1 pl-2 pr-2'>
              <ProjectReadinessCard projectId={id} onNavigate={handleReadinessNavigate} />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto'>
        <div
          className={cn(
            'mx-auto px-4 py-6 transition-[max-width] duration-300 ease-in-out sm:px-6',
            maxW,
          )}
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
