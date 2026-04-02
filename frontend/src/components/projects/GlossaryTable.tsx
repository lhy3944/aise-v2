'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, Pencil, Plus, Search, Sparkles, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GlossaryCreate, GlossaryItem } from '@/types/project';

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
    <TableRow className='border-accent-primary/30 bg-canvas-surface/30 hover:bg-canvas-surface/30'>
      <TableCell colSpan={4} className='p-2 md:hidden'>
        <div className='flex flex-col gap-2'>
          <div className='flex flex-col gap-1'>
            <label className='text-fg-muted text-xs'>용어</label>
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder='용어 입력'
              className='text-sm'
              autoFocus={autoFocus}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-fg-muted text-xs'>정의</label>
            <Textarea
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder='정의 입력'
              className='min-h-16 resize-none text-sm'
              rows={2}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-fg-muted text-xs'>제품군</label>
            <Input
              value={productGroup}
              onChange={(e) => setProductGroup(e.target.value)}
              placeholder='제품군 (선택)'
              className='text-sm'
            />
          </div>
          <div className='flex justify-end gap-1.5 pt-1'>
            <Button size='sm' variant='ghost' onClick={onCancel} className='h-8 text-xs'>
              취소
            </Button>
            <Button
              size='sm'
              onClick={handleSave}
              disabled={!term.trim() || !definition.trim()}
              className='h-8 text-xs'
            >
              <Check className='mr-1 size-3' />
              {initial ? '저장' : '추가'}
            </Button>
          </div>
        </div>
      </TableCell>
      <TableCell className='max-md:hidden'>
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder='용어'
          className='text-sm'
          autoFocus={autoFocus}
        />
      </TableCell>
      <TableCell className='max-md:hidden'>
        <Textarea
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          placeholder='정의'
          className='min-h-9 resize-none text-sm'
          rows={1}
        />
      </TableCell>
      <TableCell className='max-md:hidden'>
        <Input
          value={productGroup}
          onChange={(e) => setProductGroup(e.target.value)}
          placeholder='제품군 (선택)'
          className='text-sm'
        />
      </TableCell>
      <TableCell className='max-md:hidden text-right'>
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
      </TableCell>
    </TableRow>
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

function GlossaryRow({ item, editing, onStartEdit, onUpdate, onDelete, onCancelEdit }: RowProps) {
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
    <TableRow className='group'>
      {/* Mobile: stacked layout */}
      <TableCell className='p-3 md:hidden'>
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0 flex-1'>
            <p className='text-fg-primary truncate font-medium'>{item.term}</p>
            <p className='text-fg-secondary mt-1 line-clamp-3 text-sm leading-relaxed'>
              {item.definition}
            </p>
            {item.product_group && (
              <p className='text-fg-muted mt-1 text-xs'>{item.product_group}</p>
            )}
          </div>
          <div className='flex shrink-0 gap-0.5'>
            <Button
              size='icon-sm'
              variant='ghost'
              onClick={onStartEdit}
              className='text-fg-muted hover:text-fg-primary size-7'
            >
              <Pencil className='size-3.5' />
            </Button>
            <Button
              size='icon-sm'
              variant='ghost'
              onClick={() => onDelete(item.glossary_id)}
              className='text-fg-muted hover:text-destructive size-7'
            >
              <Trash2 className='size-3.5' />
            </Button>
          </div>
        </div>
      </TableCell>

      {/* Desktop: table columns */}
      <TableCell className='text-fg-primary max-md:hidden truncate font-medium'>{item.term}</TableCell>
      <TableCell className='text-fg-secondary max-md:hidden line-clamp-2 leading-relaxed'>
        {item.definition}
      </TableCell>
      <TableCell className='text-fg-muted max-md:hidden truncate text-xs'>{item.product_group || '-'}</TableCell>
      <TableCell className='max-md:hidden text-right'>
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
      </TableCell>
    </TableRow>
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
        (item) => item.term.toLowerCase().includes(q) || item.definition.toLowerCase().includes(q),
      );
    }
    return result;
  }, [items, search, activeFilter]);

  return (
    <div className='flex flex-col'>
      {/* ─── Sticky Toolbar ─── */}
      <div className='bg-canvas-primary sticky top-0 z-10 flex flex-col gap-3 pb-3'>
        <div className='flex flex-wrap items-center justify-between gap-2 md:gap-3'>
          {/* Search + Count */}
          <div className='flex min-w-0 flex-1 items-center gap-2 md:gap-3'>
            <div className='relative min-w-0 flex-1 md:max-w-60 md:flex-none'>
              <Search className='text-fg-muted absolute top-1/2 left-3 size-3.5 -translate-y-1/2' />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='검색'
                className='h-8 pl-9 text-sm'
              />
            </div>
            <span className='text-fg-muted shrink-0 text-xs'>
              {search || activeFilter
                ? `${filtered.length} / ${items.length}건`
                : `${items.length}건`}
            </span>
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

        {/* Product Group Filters */}
        {productGroups.length > 0 && (
          <div className='flex flex-wrap gap-1.5'>
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
          </div>
        )}
      </div>

      {/* ─── Table ─── */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[20%] max-md:hidden'>용어</TableHead>
            <TableHead className='w-[50%] max-md:hidden'>정의</TableHead>
            <TableHead className='w-[20%] max-md:hidden'>제품군</TableHead>
            <TableHead className='w-[10%] max-md:hidden' />
            <TableHead className='md:hidden'>용어 / 정의</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
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
        </TableBody>
      </Table>

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
