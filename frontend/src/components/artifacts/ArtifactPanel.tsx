'use client';

import { Database, FileText, FlaskConical, Layers } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjectStore } from '@/stores/project-store';
import { useArtifactStore } from '@/stores/artifact-store';
import type { ArtifactType } from '@/stores/artifact-store';
import { RecordsArtifact } from '@/components/artifacts/RecordsArtifact';
import { SrsArtifact } from '@/components/artifacts/SrsArtifact';
import { DesignArtifact } from '@/components/artifacts/DesignArtifact';
import { TestCaseArtifact } from '@/components/artifacts/TestCaseArtifact';

const ARTIFACT_TABS = [
  { value: 'records' as const, label: 'Records', icon: Database },
  { value: 'srs' as const, label: 'SRS', icon: FileText },
  { value: 'design' as const, label: 'Design', icon: Layers },
  { value: 'testcase' as const, label: 'Test Cases', icon: FlaskConical },
];

export function ArtifactPanel() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const activeTab = useArtifactStore((s) => s.activeTab);
  const setActiveTab = useArtifactStore((s) => s.setActiveTab);

  if (!currentProject) {
    return (
      <div className='flex h-full items-center justify-center p-6'>
        <div className='text-center'>
          <Layers className='text-fg-muted mx-auto mb-3 size-10' />
          <p className='text-fg-secondary text-sm font-medium'>프로젝트를 선택해주세요</p>
          <p className='text-fg-muted mt-1 text-xs'>
            왼쪽 사이드바에서 프로젝트를 선택하면 산출물을 확인할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as ArtifactType)}
      className='flex h-full flex-col'
    >
      {/* Tab Bar */}
      <div className='shrink-0 px-2 pt-2'>
        <div className='relative'>
          <ScrollArea className='w-full *:data-[slot=scroll-area-viewport]:overflow-y-hidden'>
            <TabsList variant='line' className='border-line-subtle w-max min-w-full justify-start pb-0.5'>
              {ARTIFACT_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className='data-[state=active]:text-accent-primary after:bg-accent-primary gap-1.5 px-3 text-xs md:flex-initial'
                >
                  <tab.icon className='size-3.5' />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation='horizontal' />
          </ScrollArea>
          {/* Scroll fade indicators */}
          <div className='from-background pointer-events-none absolute top-0 bottom-2.5 left-0 w-4 bg-linear-to-r to-transparent' />
          <div className='from-background pointer-events-none absolute top-0 right-0 bottom-2.5 w-8 bg-linear-to-l to-transparent' />
        </div>
      </div>

      {/* Content */}
      <div className='min-h-0 flex-1'>
        <TabsContent value='records' className='mt-0 h-full'>
          <RecordsArtifact projectId={currentProject.project_id} />
        </TabsContent>
        <TabsContent value='srs' className='mt-0 h-full'>
          <SrsArtifact />
        </TabsContent>
        <TabsContent value='design' className='mt-0 h-full'>
          <DesignArtifact />
        </TabsContent>
        <TabsContent value='testcase' className='mt-0 h-full'>
          <TestCaseArtifact />
        </TabsContent>
      </div>
    </Tabs>
  );
}
