'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, Pencil, Plus, Search, Sparkles, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GlossaryCreate, GlossaryItem } from '@/types/project';

/** 공통 그리드 컬럼 — 모바일: 제품군 숨김, 데스크탑: 4열 */
const GRID_COLS = 'grid max-sm:grid-cols-[1fr_2fr_40px] sm:grid-cols-[minmax(120px,1fr)_2fr_120px_60px]';

/* ─── Inline Edit Row ─── */

interface EditRowProps {
  initial?: { term: string; definition: string; productGroup: string };
  onSave: (data: { term: string; definition: string; product_group: string | null }) => void;
  onCancel: () => void;
  autoFocus?: boolean;
}

function EditRow({ initial, onSave, onCancel, autoFocus }: EditRowProps) {
  const [term, setTerm] = useState(initial?.term ?? '');
  const [definition, setDefinition] = useState(initial?.definition ?? '');
  const [productGroup, setProductGroup] = useState(initial?.productGroup ?? '');

  function handleSave() {
    if (!term.trim() || !definition.trim()) return;
    onSave({
      term: term.trim(),
      definition: definition.trim(),
      product_group: productGroup.trim() || null,
    });
  }

  return (
    <div className='border-accent-primary/30 bg-canvas-surface/30 border-b px-4 py-3'>
      <div className='flex flex-col gap-2.5'>
        <div className='grid max-sm:grid-cols-1 sm:grid-cols-[1fr_1fr_140px] gap-2'>
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder='용어'
            className='text-sm'
            autoFocus={autoFocus}
          />
          <Textarea
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            placeholder='정의'
            className='min-h-9 resize-none text-sm'
            rows={1}
          />
          <Input
            value={productGroup}
            onChange={(e) => setProductGroup(e.target.value)}
            placeholder='제품군 (선택)'
            className='text-sm'
          />
        </div>
        <div className='flex justify-end gap-1.5'>
          <Button size='sm' variant='ghost' onClick={onCancel} className='h-7 text-xs'>
            취소
          </Button>
          <Button
            size='sm'
            onClick={handleSave}
            disabled={!term.trim() || !definition.trim()}
            className='h-7 text-xs'
          >
            <Check className='mr-1 size-3' />
            {initial ? '저장' : '추가'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Table Row ─── */

interface RowProps {
  item: GlossaryItem;
  editing: boolean;
  onStartEdit: () => void;
  onUpdate: (
    id: string,
    data: { term?: string; definition?: string; product_group?: string | null },
  ) => void;
  onDelete: (id: string) => void;
  onCancelEdit: () => void;
}

function GlossaryRow({
  item,
  editing,
  onStartEdit,
  onUpdate,
  onDelete,
  onCancelEdit,
}: RowProps) {
  if (editing) {
    return (
      <EditRow
        initial={{
          term: item.term,
          definition: item.definition,
          productGroup: item.product_group || '',
        }}
        onSave={(data) => {
          onUpdate(item.glossary_id, data);
          onCancelEdit();
        }}
        onCancel={onCancelEdit}
        autoFocus
      />
    );
  }

  return (
    <div className={cn('border-line-subtle hover:bg-canvas-surface/40 group items-baseline gap-3 border-b px-4 py-2.5 text-sm transition-colors', GRID_COLS)}>
      <span className='text-fg-primary truncate font-medium'>{item.term}</span>
      <span className='text-fg-secondary line-clamp-2 leading-relaxed'>{item.definition}</span>
      <span className='text-fg-muted max-sm:hidden truncate text-xs'>{item.product_group || '-'}</span>
      <div className='flex justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size='icon-sm'
              variant='ghost'
              onClick={onStartEdit}
              className='text-fg-muted hover:text-fg-primary size-6'
            >
              <Pencil className='size-3' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>수정</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size='icon-sm'
              variant='ghost'
              onClick={() => onDelete(item.glossary_id)}
              className='text-fg-muted hover:text-destructive size-6'
            >
              <Trash2 className='size-3' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>삭제</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

/* ─── Main Table ─── */

interface GlossaryTableProps {
  items: GlossaryItem[];
  onAdd: (data: GlossaryCreate) => void;
  onUpdate: (
    id: string,
    data: { term?: string; definition?: string; product_group?: string | null },
  ) => void;
  onDelete: (id: string) => void;
  generating?: boolean;
  onGenerate?: () => void;
}

export function GlossaryTable({
  items,
  onAdd,
  onUpdate,
  onDelete,
  generating,
  onGenerate,
}: GlossaryTableProps) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // 제품군 필터 목록
  const productGroups = useMemo(() => {
    const groups = new Set<string>();
    for (const item of items) {
      if (item.product_group) groups.add(item.product_group);
    }
    return Array.from(groups).sort();
  }, [items]);

  const filtered = useMemo(() => {
    let result = items;
    if (activeFilter) {
      result = result.filter((item) => item.product_group === activeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.term.toLowerCase().includes(q) ||
          item.definition.toLowerCase().includes(q),
      );
    }
    return result;
  }, [items, search, activeFilter]);

  return (
    <div className='flex flex-col'>
      {/* ─── Sticky Toolbar ─── */}
      <div className='bg-canvas-primary sticky top-0 z-10 flex flex-col gap-3 pb-3'>
        <div className='flex items-center gap-3'>
          {/* Search */}
          <div className='relative flex-1'>
            <Search className='text-fg-muted absolute top-1/2 left-3 size-3.5 -translate-y-1/2' />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='용어 검색...'
              className='h-8 pl-9 text-sm'
            />
          </div>

          {/* Actions */}
          <div className='flex shrink-0 gap-1.5'>
            <Button
              size='sm'
              variant='outline'
              className='h-8 text-xs'
              onClick={() => {
                setAdding(true);
                setEditingId(null);
              }}
            >
              <Plus className='size-3.5' />
              추가
            </Button>
            {onGenerate && (
              <Button
                size='sm'
                variant='outline'
                className='h-8 text-xs'
                onClick={onGenerate}
                disabled={generating}
              >
                <Sparkles className='size-3.5' />
                {generating ? '생성 중...' : 'AI 생성'}
              </Button>
            )}
          </div>
        </div>

        {/* Count + Product Group Filters */}
        <div className='flex flex-wrap items-center gap-1.5'>
          <span className='text-fg-muted text-xs'>
            {search || activeFilter
              ? `${filtered.length} / ${items.length}건`
              : `총 ${items.length}건`}
          </span>
          {productGroups.length > 0 && (
            <>
              <span className='text-fg-muted text-xs'>·</span>
              <button
                onClick={() => setActiveFilter(null)}
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                  !activeFilter
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-fg-muted hover:text-fg-secondary hover:bg-canvas-surface',
                )}
              >
                전체
              </button>
              {productGroups.map((group) => (
                <button
                  key={group}
                  onClick={() => setActiveFilter(activeFilter === group ? null : group)}
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                    activeFilter === group
                      ? 'bg-accent-primary/10 text-accent-primary'
                      : 'text-fg-muted hover:text-fg-secondary hover:bg-canvas-surface',
                  )}
                >
                  {group}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ─── Column Header ─── */}
      <div className={cn('border-line-subtle gap-3 border-b px-4 py-2 text-xs whitespace-nowrap', GRID_COLS)}>
        <span className='text-fg-muted text-center font-medium'>용어</span>
        <span className='text-fg-muted text-center font-medium'>정의</span>
        <span className='text-fg-muted max-sm:hidden text-center font-medium'>제품군</span>
        <span />
      </div>

      {/* ─── Inline Add (상단) ─── */}
      {adding && (
        <EditRow
          onSave={(data) => {
            onAdd(data);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
          autoFocus
        />
      )}

      {/* ─── Rows ─── */}
      {filtered.map((item) => (
        <GlossaryRow
          key={item.glossary_id}
          item={item}
          editing={editingId === item.glossary_id}
          onStartEdit={() => {
            setEditingId(item.glossary_id);
            setAdding(false);
          }}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onCancelEdit={() => setEditingId(null)}
        />
      ))}

      {/* ─── Empty States ─── */}
      {filtered.length === 0 && (
        <div className='py-12 text-center'>
          {search || activeFilter ? (
            <p className='text-fg-muted text-sm'>검색 결과가 없습니다.</p>
          ) : (
            <>
              <p className='text-fg-muted text-sm'>아직 용어가 없습니다.</p>
              <p className='text-fg-muted mt-1 text-xs'>
                상단의 추가 버튼이나 AI 생성을 사용하세요.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
