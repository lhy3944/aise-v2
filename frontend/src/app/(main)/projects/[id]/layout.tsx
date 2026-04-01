'use client';

import { BookOpen, FolderOpen, Info } from 'lucide-react';
import { use, useState } from 'react';
import { ProjectOverviewTab } from '@/components/projects/ProjectOverviewTab';
import { ProjectGlossaryTab } from '@/components/projects/ProjectGlossaryTab';
import { ProjectKnowledgeTab } from '@/components/projects/ProjectKnowledgeTab';
import { cn } from '@/lib/utils';
import { usePanelStore } from '@/stores/panel-store';

type TabId = 'overview' | 'glossary' | 'knowledge';

const TABS: { id: TabId; label: string; icon: typeof Info }[] = [
  { id: 'overview', label: '개요', icon: Info },
  { id: 'glossary', label: '용어사전', icon: BookOpen },
  { id: 'knowledge', label: '지식 소스', icon: FolderOpen },
];

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default function ProjectDetailLayout({ children, params }: Props) {
  const { id } = use(params);
  const fullWidthMode = usePanelStore((s) => s.fullWidthMode);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const maxW = fullWidthMode ? 'max-w-full' : 'max-w-6xl';

  return (
    <div className='flex flex-1 flex-col overflow-hidden'>
      {/* Tab Navigation */}
      <div className='border-line-primary bg-canvas-primary border-b px-6'>
        <div
          className={cn(
            'mx-auto flex transition-[max-width] duration-300 ease-in-out',
            maxW,
          )}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-accent-primary text-accent-primary'
                    : 'text-fg-muted hover:text-fg-secondary border-transparent',
                )}
              >
                <tab.icon className='size-4' />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto'>
        <div
          className={cn('mx-auto px-6 py-6 transition-[max-width] duration-300 ease-in-out', maxW)}
        >
          {activeTab === 'overview' && <ProjectOverviewTab projectId={id} />}
          {activeTab === 'glossary' && <ProjectGlossaryTab projectId={id} />}
          {activeTab === 'knowledge' && <ProjectKnowledgeTab />}
        </div>
      </div>
    </div>
  );
}
