'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useOverlay } from '@/hooks/useOverlay';
import { cn } from '@/lib/utils';
import { sectionService } from '@/services/section-service';
import type { Section, SectionCreate } from '@/types/project';
import { GripVertical, Loader2, Lock, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useReadinessStore } from '@/stores/readiness-store';

interface ProjectSectionsTabProps {
  projectId: string;
}

export function ProjectSectionsTab({ projectId }: ProjectSectionsTabProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('');
  const overlay = useOverlay();
  const invalidateReadiness = useReadinessStore((s) => s.invalidate);

  const fetchSections = useCallback(async () => {
    try {
      const res = await sectionService.list(projectId);
      setSections(res.sections);
    } catch {
      // 글로벌 핸들링
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const handleToggle = useCallback(
    async (section: Section) => {
      try {
        const updated = await sectionService.toggle(projectId, section.section_id, !section.is_active);
        setSections((prev) =>
          prev.map((s) => (s.section_id === updated.section_id ? updated : s)),
        );
        invalidateReadiness();
      } catch {
        // 글로벌 핸들링
      }
    },
    [projectId, invalidateReadiness],
  );

  const handleDelete = useCallback(
    (section: Section) => {
      overlay.confirm({
        title: '섹션 삭제',
        description: `"${section.name}" 섹션을 삭제하시겠습니까?`,
        confirmLabel: '삭제',
        variant: 'destructive',
        onConfirm: async () => {
          try {
            await sectionService.delete(projectId, section.section_id);
            setSections((prev) => prev.filter((s) => s.section_id !== section.section_id));
            invalidateReadiness();
          } catch {
            // 글로벌 핸들링
          }
        },
      });
    },
    [projectId, overlay, invalidateReadiness],
  );

  const handleAdd = useCallback(async () => {
    if (!newName.trim()) return;
    const data: SectionCreate = {
      name: newName.trim(),
      type: newType.trim() || 'other',
    };
    try {
      const created = await sectionService.create(projectId, data);
      setSections((prev) => [...prev, created]);
      setNewName('');
      setNewType('');
      setAdding(false);
      invalidateReadiness();
    } catch {
      // 글로벌 핸들링
    }
  }, [projectId, newName, newType]);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Loader2 className='text-fg-muted size-6 animate-spin' />
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Info Banner */}
      <div className='bg-primary/5 border-primary/20 rounded-lg border p-4'>
        <p className='text-sm'>
          섹션은 SRS 문서의 구조를 정의합니다. 기본 제공 섹션은 비활성화만 가능하며, 커스텀 섹션을
          추가할 수 있습니다.
        </p>
      </div>

      {/* Section List */}
      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between'>
          <h3 className='text-fg-primary text-sm font-semibold'>섹션 {sections.length}개</h3>
          <Button variant='outline' size='sm' onClick={() => setAdding(true)} className='gap-1'>
            <Plus className='size-3.5' />
            섹션 추가
          </Button>
        </div>

        <div className='border-line-primary divide-line-primary divide-y rounded-lg border'>
          {sections.map((section) => (
            <div
              key={section.section_id}
              className={cn(
                'flex items-center gap-3 px-4 py-3',
                !section.is_active && 'opacity-50',
              )}
            >
              <GripVertical className='text-fg-muted size-4 shrink-0 cursor-grab' />

              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <p className='text-fg-primary text-sm font-medium'>{section.name}</p>
                  {section.is_default && (
                    <Badge variant='secondary' className='gap-1 text-[10px]'>
                      <Lock className='size-2.5' />
                      기본
                    </Badge>
                  )}
                  {section.is_required && (
                    <Badge variant='outline' className='text-[10px]'>필수</Badge>
                  )}
                </div>
                {section.description && (
                  <p className='text-fg-muted mt-0.5 text-xs'>{section.description}</p>
                )}
                {section.output_format_hint && (
                  <p className='text-fg-muted mt-0.5 text-xs italic'>
                    출력 힌트: {section.output_format_hint}
                  </p>
                )}
              </div>

              <Badge variant='outline' className='shrink-0 text-[10px]'>
                {section.type}
              </Badge>

              <div onClick={(e) => e.stopPropagation()}>
                <Switch
                  checked={section.is_active}
                  onCheckedChange={() => handleToggle(section)}
                  className='shrink-0'
                  aria-label={section.is_active ? '비활성화' : '활성화'}
                />
              </div>

              {!section.is_default && (
                <Button
                  variant='ghost'
                  size='icon'
                  className='text-fg-muted hover:text-destructive size-8 shrink-0'
                  onClick={() => handleDelete(section)}
                  aria-label='삭제'
                >
                  <Trash2 className='size-3.5' />
                </Button>
              )}
              {section.is_default && <div className='size-8 shrink-0' />}
            </div>
          ))}

          {/* Add Section Row */}
          {adding && (
            <div className='flex items-center gap-3 px-4 py-3'>
              <div className='size-4 shrink-0' />
              <Input
                placeholder='섹션 이름'
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className='h-8 flex-1 text-sm'
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <Input
                placeholder='유형 (예: other)'
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className='h-8 w-32 text-sm'
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <Button size='sm' onClick={handleAdd} className='h-8'>
                추가
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => {
                  setAdding(false);
                  setNewName('');
                  setNewType('');
                }}
                className='h-8'
              >
                취소
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
