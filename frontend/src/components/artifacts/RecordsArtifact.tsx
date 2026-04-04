'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { recordService } from '@/services/record-service';
import type { Record as RecordType, RecordStatus } from '@/types/project';
import {
  CheckCircle2,
  FileText,
  Loader2,
  MinusCircle,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface RecordsArtifactProps {
  projectId: string;
}

const STATUS_CONFIG: Record<
  RecordStatus,
  { icon: typeof CheckCircle2; label: string; color: string }
> = {
  draft: { icon: FileText, label: '초안', color: 'text-gray-500' },
  approved: { icon: CheckCircle2, label: '승인', color: 'text-green-600' },
  excluded: { icon: MinusCircle, label: '제외', color: 'text-red-500' },
};

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? 'text-green-600 bg-green-500/10' :
    pct >= 50 ? 'text-amber-600 bg-amber-500/10' :
    'text-red-600 bg-red-500/10';
  return (
    <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', color)}>
      {pct}%
    </span>
  );
}

export function RecordsArtifact({ projectId }: RecordsArtifactProps) {
  const [records, setRecords] = useState<RecordType[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionFilter, setSectionFilter] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await recordService.list(projectId, sectionFilter ?? undefined);
      setRecords(res.records);
    } catch {
      // 글로벌 핸들링
    } finally {
      setLoading(false);
    }
  }, [projectId, sectionFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // 섹션 목록 추출
  const sections = Array.from(
    new Map(
      records
        .filter((r) => r.section_id && r.section_name)
        .map((r) => [r.section_id!, r.section_name!]),
    ),
  );

  // 섹션별 그룹핑
  const grouped = records.reduce<Record<string, RecordType[]>>((acc, r) => {
    const key = r.section_name || '미분류';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const handleStatusChange = useCallback(
    async (record: RecordType, status: RecordStatus) => {
      try {
        const updated = await recordService.updateStatus(projectId, record.record_id, status);
        setRecords((prev) =>
          prev.map((r) => (r.record_id === updated.record_id ? updated : r)),
        );
      } catch {
        // 글로벌 핸들링
      }
    },
    [projectId],
  );

  const handleDelete = useCallback(
    async (recordId: string) => {
      try {
        await recordService.delete(projectId, recordId);
        setRecords((prev) => prev.filter((r) => r.record_id !== recordId));
      } catch {
        // 글로벌 핸들링
      }
    },
    [projectId],
  );

  if (loading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <Loader2 className='text-fg-muted size-6 animate-spin' />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className='flex h-full flex-col items-center justify-center p-6 text-center'>
        <FileText className='text-fg-muted mb-3 size-10' />
        <p className='text-fg-secondary text-sm font-medium'>레코드가 없습니다</p>
        <p className='text-fg-muted mt-1 text-xs'>
          채팅에서 &quot;레코드 추출&quot;을 실행하면 지식 문서에서 자동으로 추출됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className='flex h-full flex-col'>
      {/* Header */}
      <div className='border-line-primary flex items-center justify-between border-b px-4 py-2'>
        <div className='flex items-center gap-2'>
          <span className='text-fg-primary text-xs font-semibold'>{records.length}개 레코드</span>
          {/* Section filter chips */}
          <div className='flex gap-1'>
            <button
              onClick={() => setSectionFilter(null)}
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] transition-colors',
                !sectionFilter
                  ? 'bg-accent-primary/10 text-accent-primary font-medium'
                  : 'text-fg-muted hover:bg-canvas-surface',
              )}
            >
              전체
            </button>
            {sections.map(([id, name]) => (
              <button
                key={id}
                onClick={() => setSectionFilter(id)}
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] transition-colors',
                  sectionFilter === id
                    ? 'bg-accent-primary/10 text-accent-primary font-medium'
                    : 'text-fg-muted hover:bg-canvas-surface',
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Record list */}
      <ScrollArea className='flex-1'>
        <div className='p-3'>
          {Object.entries(grouped).map(([sectionName, sectionRecords]) => (
            <div key={sectionName} className='mb-4'>
              <h4 className='text-fg-muted mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider'>
                {sectionName}
              </h4>
              <div className='flex flex-col gap-1.5'>
                {sectionRecords.map((record) => {
                  const statusCfg = STATUS_CONFIG[record.status];
                  const StatusIcon = statusCfg.icon;
                  return (
                    <div
                      key={record.record_id}
                      className={cn(
                        'group border-line-primary hover:bg-canvas-surface/50 rounded-md border px-3 py-2 transition-colors',
                        record.status === 'excluded' && 'opacity-50',
                      )}
                    >
                      {/* Top row: ID + confidence + status */}
                      <div className='mb-1 flex items-center gap-2'>
                        <span className='text-fg-muted text-[10px] font-mono'>
                          {record.display_id}
                        </span>
                        <ConfidenceBadge score={record.confidence_score} />
                        <Badge
                          variant='outline'
                          className={cn('ml-auto text-[10px] [&>svg]:size-3', statusCfg.color)}
                        >
                          <StatusIcon />
                          {statusCfg.label}
                        </Badge>
                      </div>

                      {/* Content */}
                      <p className='text-fg-primary text-xs leading-relaxed'>{record.content}</p>

                      {/* Source */}
                      {record.source_document_name && (
                        <p className='text-fg-muted mt-1 text-[10px]'>
                          출처: {record.source_document_name}
                          {record.source_location && ` · ${record.source_location}`}
                        </p>
                      )}

                      {/* Actions (visible on hover) */}
                      <div className='mt-1.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                        {record.status !== 'approved' && (
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-6 gap-1 px-2 text-[10px] text-green-600'
                            onClick={() => handleStatusChange(record, 'approved')}
                          >
                            <CheckCircle2 className='size-3' />
                            승인
                          </Button>
                        )}
                        {record.status !== 'excluded' && (
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-6 gap-1 px-2 text-[10px] text-amber-600'
                            onClick={() => handleStatusChange(record, 'excluded')}
                          >
                            <XCircle className='size-3' />
                            제외
                          </Button>
                        )}
                        {record.status === 'excluded' && (
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-6 gap-1 px-2 text-[10px]'
                            onClick={() => handleStatusChange(record, 'draft')}
                          >
                            복원
                          </Button>
                        )}
                        <Button
                          variant='ghost'
                          size='icon'
                          className='text-fg-muted hover:text-destructive ml-auto size-6'
                          onClick={() => handleDelete(record.record_id)}
                        >
                          <Trash2 className='size-3' />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
