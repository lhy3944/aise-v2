'use client';

import { cn } from '@/lib/utils';
import { useReadinessStore } from '@/stores/readiness-store';
import { useProjectStore } from '@/stores/project-store';
import { BookOpen, Database, FileText, RefreshCw } from 'lucide-react';

interface ActionCardsProps {
  onAction: (action: string) => void;
}

interface ActionCard {
  id: string;
  icon: typeof Database;
  title: string;
  description: string;
  prompt: string;
  isEnabled: (ctx: ActionContext) => boolean;
  disabledReason: string;
}

interface ActionContext {
  isReady: boolean;
  hasRecords: boolean;
  hasUnapprovedGlossary: boolean;
  hasSrs: boolean;
}

const ACTIONS: ActionCard[] = [
  {
    id: 'extract',
    icon: Database,
    title: '레코드 추출',
    description: '지식 문서에서 섹션별 레코드를 추출합니다',
    prompt: '레코드 추출을 시작해주세요.',
    isEnabled: (ctx) => ctx.isReady,
    disabledReason: '프로젝트 준비가 필요합니다 (지식/용어/섹션)',
  },
  {
    id: 'srs',
    icon: FileText,
    title: 'SRS 문서 생성',
    description: '승인된 레코드로 SRS 문서를 생성합니다',
    prompt: 'SRS 문서 생성을 시작해주세요.',
    isEnabled: (ctx) => ctx.hasRecords,
    disabledReason: '먼저 레코드를 추출해주세요',
  },
  {
    id: 'glossary-review',
    icon: BookOpen,
    title: '용어집 검토',
    description: '미승인 용어를 검토하고 승인합니다',
    prompt: '미승인 용어를 검토해주세요.',
    isEnabled: (ctx) => ctx.hasUnapprovedGlossary,
    disabledReason: '미승인 용어가 없습니다',
  },
  {
    id: 'srs-regenerate',
    icon: RefreshCw,
    title: 'SRS 재생성',
    description: '수정된 레코드로 SRS를 다시 생성합니다',
    prompt: 'SRS 문서를 재생성해주세요.',
    isEnabled: (ctx) => ctx.hasSrs,
    disabledReason: '기존 SRS가 없습니다',
  },
];

export function ActionCards({ onAction }: ActionCardsProps) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const readiness = useReadinessStore((s) => s.data);

  // TODO: 실제 상태 조회 (records 수, SRS 존재 여부 등)
  const ctx: ActionContext = {
    isReady: readiness?.is_ready ?? false,
    hasRecords: false, // Phase 3 완료 후 연동
    hasUnapprovedGlossary: false,
    hasSrs: false,
  };

  if (!currentProject) return null;

  return (
    <div className='grid grid-cols-2 gap-3'>
      {ACTIONS.map((action) => {
        const enabled = action.isEnabled(ctx);
        return (
          <button
            key={action.id}
            onClick={() => enabled && onAction(action.prompt)}
            disabled={!enabled}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-4 text-left transition-all',
              enabled
                ? 'border-line-primary hover:border-accent-primary/50 hover:bg-canvas-surface/50 cursor-pointer'
                : 'border-line-primary/50 cursor-not-allowed opacity-50',
            )}
          >
            <div
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-md',
                enabled
                  ? 'bg-accent-primary/10 text-accent-primary'
                  : 'bg-canvas-surface text-fg-muted',
              )}
            >
              <action.icon className='size-4' />
            </div>
            <div className='min-w-0'>
              <p className='text-fg-primary text-sm font-medium'>{action.title}</p>
              <p className='text-fg-muted mt-0.5 text-xs'>
                {enabled ? action.description : action.disabledReason}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
