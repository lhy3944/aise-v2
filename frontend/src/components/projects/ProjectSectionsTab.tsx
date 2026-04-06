'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useOverlay } from '@/hooks/useOverlay';
import { cn } from '@/lib/utils';
import { sectionService } from '@/services/section-service';
import { useReadinessStore } from '@/stores/readiness-store';
import type { Section, SectionCreate, SectionUpdate } from '@/types/project';
import { GripVertical, Loader2, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ProjectSectionsTabProps {
  projectId: string;
}

/* ─── Section Add/Edit Form (used inside modal) ─── */

interface SectionFormProps {
  mode: 'add' | 'edit';
  initial?: { name: string; type: string; description: string; outputFormatHint: string };
  onSubmit: (data: {
    name: string;
    type: string;
    description: string;
    outputFormatHint: string;
  }) => void;
  onCancel: () => void;
}

function SectionForm({ mode, initial, onSubmit, onCancel }: SectionFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState(initial?.type ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [outputFormatHint, setOutputFormatHint] = useState(initial?.outputFormatHint ?? '');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), type: type.trim(), description: description.trim(), outputFormatHint: outputFormatHint.trim() });
  };

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='section-name'>섹션 이름 *</Label>
        <Input
          id='section-name'
          placeholder='예: Performance Requirements'
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
      </div>
      {mode === 'add' && (
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='section-type'>유형</Label>
          <Input
            id='section-type'
            placeholder='예: other'
            value={type}
            onChange={(e) => setType(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <p className='text-fg-muted text-xs'>비워두면 &quot;other&quot;로 설정됩니다.</p>
        </div>
      )}
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='section-desc'>설명</Label>
        <Textarea
          id='section-desc'
          placeholder='이 섹션의 목적이나 포함할 내용을 설명해주세요.'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='section-hint'>출력 형식 힌트</Label>
        <Input
          id='section-hint'
          placeholder='예: 표 형태, 번호 목록 등'
          value={outputFormatHint}
          onChange={(e) => setOutputFormatHint(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
      </div>
      <div className='flex justify-end gap-2 pt-2'>
        <Button variant='ghost' size='sm' onClick={onCancel}>
          취소
        </Button>
        <Button size='sm' onClick={handleSubmit} disabled={!name.trim()}>
          {mode === 'add' ? '추가' : '저장'}
        </Button>
      </div>
    </div>
  );
}

/* ─── Inline Add Row (desktop only) ─── */

interface InlineAddRowProps {
  onAdd: (name: string, type: string) => void;
  onCancel: () => void;
}

function InlineAddRow({ onAdd, onCancel }: InlineAddRowProps) {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim(), newType.trim());
  };

  return (
    <div className='flex items-center gap-3 px-4 py-3'>
      <div className='size-4 shrink-0' />
      <Input
        ref={inputRef}
        placeholder='섹션 이름'
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        className='h-8 flex-1 text-sm'
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
      <Button size='sm' variant='ghost' onClick={onCancel} className='h-8'>
        취소
      </Button>
    </div>
  );
}

/* ─── Main Component ─── */

export function ProjectSectionsTab({ projectId }: ProjectSectionsTabProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const overlay = useOverlay();
  const isMobile = useIsMobile();
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
        const updated = await sectionService.toggle(
          projectId,
          section.section_id,
          !section.is_active,
        );
        setSections((prev) => prev.map((s) => (s.section_id === updated.section_id ? updated : s)));
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

  /* ─── Add Section ─── */

  const handleAddSubmit = useCallback(
    async (data: { name: string; type: string; description: string; outputFormatHint: string }) => {
      const createData: SectionCreate = {
        name: data.name,
        type: data.type || 'other',
        description: data.description || null,
        output_format_hint: data.outputFormatHint || null,
      };
      try {
        const created = await sectionService.create(projectId, createData);
        setSections((prev) => [...prev, created]);
        invalidateReadiness();
        overlay.closeModal();
        setAdding(false);
      } catch {
        // 글로벌 핸들링
      }
    },
    [projectId, invalidateReadiness, overlay],
  );

  const handleAddClick = useCallback(() => {
    if (isMobile) {
      overlay.modal({
        title: '섹션 추가',
        size: 'md',
        content: (
          <SectionForm
            mode='add'
            onSubmit={handleAddSubmit}
            onCancel={() => overlay.closeModal()}
          />
        ),
      });
    } else {
      setAdding(true);
    }
  }, [isMobile, overlay, handleAddSubmit]);

  const handleInlineAdd = useCallback(
    async (name: string, type: string) => {
      const data: SectionCreate = { name, type: type || 'other' };
      try {
        const created = await sectionService.create(projectId, data);
        setSections((prev) => [...prev, created]);
        setAdding(false);
        invalidateReadiness();
      } catch {
        // 글로벌 핸들링
      }
    },
    [projectId, invalidateReadiness],
  );

  /* ─── Edit Section ─── */

  const handleEdit = useCallback(
    (section: Section) => {
      const handleEditSubmit = async (data: {
        name: string;
        type: string;
        description: string;
        outputFormatHint: string;
      }) => {
        const updateData: SectionUpdate = {
          name: data.name || null,
          description: data.description || null,
          output_format_hint: data.outputFormatHint || null,
        };
        try {
          const updated = await sectionService.update(projectId, section.section_id, updateData);
          setSections((prev) =>
            prev.map((s) => (s.section_id === updated.section_id ? updated : s)),
          );
          overlay.closeModal();
        } catch {
          // 글로벌 핸들링
        }
      };

      overlay.modal({
        title: '섹션 편집',
        size: 'md',
        content: (
          <SectionForm
            mode='edit'
            initial={{
              name: section.name,
              type: section.type,
              description: section.description ?? '',
              outputFormatHint: section.output_format_hint ?? '',
            }}
            onSubmit={handleEditSubmit}
            onCancel={() => overlay.closeModal()}
          />
        ),
      });
    },
    [projectId, overlay],
  );

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
          <Button variant='outline' size='sm' onClick={handleAddClick} className='gap-1'>
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
              {/* Drag handle — hidden on mobile */}
              <GripVertical className='text-fg-muted size-4 shrink-0 cursor-grab max-md:hidden' />

              {/* Content area: name + badges on line 1, type + description on line 2 */}
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-1.5'>
                  <p className='text-fg-primary truncate text-sm font-medium'>{section.name}</p>
                  {section.is_default && (
                    <Badge variant='secondary' className='shrink-0 gap-1 text-xs'>
                      <Lock className='size-2.5' />
                      기본
                    </Badge>
                  )}
                </div>
                <div className='mt-0.5 flex flex-wrap items-center gap-1.5'>
                  <Badge variant='default' className='shrink-0 text-xs'>
                    {section.type}
                  </Badge>
                  {section.description && (
                    <span className='text-fg-muted text-xs'>{section.description}</span>
                  )}
                </div>
                {section.output_format_hint && (
                  <p className='text-fg-muted mt-0.5 text-xs italic'>
                    출력 힌트: {section.output_format_hint}
                  </p>
                )}
              </div>

              {/* Actions: toggle + edit + delete — always far right */}
              <div className='flex shrink-0 items-center gap-1'>
                <div onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={section.is_active}
                    onCheckedChange={() => handleToggle(section)}
                    className='shrink-0'
                    aria-label={section.is_active ? '비활성화' : '활성화'}
                  />
                </div>

                {!section.is_default && (
                  <>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-fg-muted hover:text-fg-primary size-8 shrink-0'
                      onClick={() => handleEdit(section)}
                      aria-label='편집'
                    >
                      <Pencil className='size-3.5' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-fg-muted hover:text-destructive size-8 shrink-0'
                      onClick={() => handleDelete(section)}
                      aria-label='삭제'
                    >
                      <Trash2 className='size-3.5' />
                    </Button>
                  </>
                )}
                {section.is_default && <div className='size-8 shrink-0' />}
              </div>
            </div>
          ))}

          {/* Inline Add Row — desktop only */}
          {adding && !isMobile && (
            <InlineAddRow
              onAdd={handleInlineAdd}
              onCancel={() => setAdding(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
