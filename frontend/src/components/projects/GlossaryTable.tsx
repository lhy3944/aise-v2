'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Check, X, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GlossaryCreate, GlossaryItem } from '@/types/project';

interface GlossaryCardProps {
  item: GlossaryItem;
  onUpdate: (
    id: string,
    data: { term?: string; definition?: string; product_group?: string | null },
  ) => void;
  onDelete: (id: string) => void;
}

function GlossaryCard({ item, onUpdate, onDelete }: GlossaryCardProps) {
  const [editing, setEditing] = useState(false);
  const [term, setTerm] = useState(item.term);
  const [definition, setDefinition] = useState(item.definition);
  const [productGroup, setProductGroup] = useState(item.product_group || '');

  function handleSave() {
    if (!term.trim() || !definition.trim()) return;
    onUpdate(item.glossary_id, {
      term: term.trim(),
      definition: definition.trim(),
      product_group: productGroup.trim() || null,
    });
    setEditing(false);
  }

  function handleCancel() {
    setTerm(item.term);
    setDefinition(item.definition);
    setProductGroup(item.product_group || '');
    setEditing(false);
  }

  if (editing) {
    return (
      <div className='border-accent-primary/30 bg-canvas-surface/50 rounded-lg border p-4'>
        <div className='flex flex-col gap-3'>
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder='용어'
            className='text-sm font-medium'
            autoFocus
          />
          <Textarea
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            placeholder='정의'
            className='min-h-16 resize-none text-sm'
          />
          <Input
            value={productGroup}
            onChange={(e) => setProductGroup(e.target.value)}
            placeholder='제품군 (선택)'
            className='text-sm'
          />
          <div className='flex justify-end gap-2'>
            <Button size='sm' variant='ghost' onClick={handleCancel}>
              <X className='mr-1 size-3' />
              취소
            </Button>
            <Button
              size='sm'
              onClick={handleSave}
              disabled={!term.trim() || !definition.trim()}
            >
              <Check className='mr-1 size-3' />
              저장
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='border-line-primary hover:border-line-subtle group rounded-lg border p-4 transition-colors'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <h4 className='text-fg-primary text-sm font-semibold'>{item.term}</h4>
            {item.product_group && (
              <Badge variant='outline' className='px-1.5 py-0 text-[10px]'>
                {item.product_group}
              </Badge>
            )}
          </div>
          <p className='text-fg-secondary mt-1 text-sm leading-relaxed'>{item.definition}</p>
        </div>
        <div className='flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
          <Button
            size='icon-xs'
            variant='ghost'
            onClick={() => setEditing(true)}
            aria-label='수정'
          >
            <Pencil className='size-3' />
          </Button>
          <Button
            size='icon-xs'
            variant='ghost'
            onClick={() => onDelete(item.glossary_id)}
            aria-label='삭제'
            className='text-destructive hover:text-destructive'
          >
            <Trash2 className='size-3' />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface InlineAddFormProps {
  onAdd: (data: GlossaryCreate) => void;
}

function InlineAddForm({ onAdd }: InlineAddFormProps) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [productGroup, setProductGroup] = useState('');

  function handleSubmit() {
    if (!term.trim() || !definition.trim()) return;
    onAdd({
      term: term.trim(),
      definition: definition.trim(),
      product_group: productGroup.trim() || null,
    });
    setTerm('');
    setDefinition('');
    setProductGroup('');
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className='border-line-primary hover:border-fg-muted hover:bg-canvas-surface/50 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 transition-colors'
      >
        <Plus className='text-fg-muted size-4' />
        <span className='text-fg-muted text-sm'>새 용어 추가</span>
      </button>
    );
  }

  return (
    <div className='border-accent-primary/30 bg-accent-primary/5 rounded-lg border p-4'>
      <div className='flex flex-col gap-3'>
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder='용어를 입력하세요'
          className='text-sm font-medium'
          autoFocus
        />
        <Textarea
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          placeholder='용어의 정의를 입력하세요'
          className='min-h-16 resize-none text-sm'
        />
        <Input
          value={productGroup}
          onChange={(e) => setProductGroup(e.target.value)}
          placeholder='제품군 (선택)'
          className='text-sm'
        />
        <div className='flex justify-end gap-2'>
          <Button
            size='sm'
            variant='ghost'
            onClick={() => {
              setOpen(false);
              setTerm('');
              setDefinition('');
              setProductGroup('');
            }}
          >
            취소
          </Button>
          <Button
            size='sm'
            onClick={handleSubmit}
            disabled={!term.trim() || !definition.trim()}
          >
            <Plus className='mr-1 size-3' />
            추가
          </Button>
        </div>
      </div>
    </div>
  );
}

interface GlossaryTableProps {
  items: GlossaryItem[];
  onAdd: (data: GlossaryCreate) => void;
  onUpdate: (
    id: string,
    data: { term?: string; definition?: string; product_group?: string | null },
  ) => void;
  onDelete: (id: string) => void;
}

export function GlossaryTable({ items, onAdd, onUpdate, onDelete }: GlossaryTableProps) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? items.filter(
        (item) =>
          item.term.toLowerCase().includes(search.toLowerCase()) ||
          item.definition.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  return (
    <div className='flex flex-col gap-4'>
      {/* Search */}
      {items.length > 0 && (
        <div className='relative'>
          <Search className='text-fg-muted absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='용어 검색...'
            className='pl-9 text-sm'
          />
        </div>
      )}

      {/* Count */}
      {items.length > 0 && (
        <div className='text-fg-muted text-xs'>
          {search ? `${filtered.length} / ${items.length}건` : `총 ${items.length}건`}
        </div>
      )}

      {/* Cards */}
      <div className='flex flex-col gap-2'>
        {filtered.map((item) => (
          <GlossaryCard
            key={item.glossary_id}
            item={item}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}

        {search && filtered.length === 0 && (
          <div className='py-8 text-center'>
            <p className='text-fg-muted text-sm'>검색 결과가 없습니다.</p>
          </div>
        )}

        {!search && items.length === 0 && (
          <div className={cn('py-8 text-center')}>
            <p className='text-fg-muted text-sm'>아직 용어가 없습니다.</p>
            <p className='text-fg-muted mt-1 text-xs'>
              아래에서 직접 추가하거나 AI 자동 생성을 사용하세요.
            </p>
          </div>
        )}
      </div>

      {/* Inline Add */}
      <InlineAddForm onAdd={onAdd} />
    </div>
  );
}
