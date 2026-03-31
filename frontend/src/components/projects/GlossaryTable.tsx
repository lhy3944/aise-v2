'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import type { GlossaryItem } from '@/types/project';

interface GlossaryRowProps {
  item: GlossaryItem;
  onUpdate: (id: string, data: { term?: string; definition?: string; product_group?: string | null }) => void;
  onDelete: (id: string) => void;
}

function GlossaryRow({ item, onUpdate, onDelete }: GlossaryRowProps) {
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
      <tr className="border-b border-line-subtle">
        <td className="px-4 py-2">
          <Input value={term} onChange={(e) => setTerm(e.target.value)} className="h-8 text-sm" />
        </td>
        <td className="px-4 py-2">
          <Input value={definition} onChange={(e) => setDefinition(e.target.value)} className="h-8 text-sm" />
        </td>
        <td className="px-4 py-2">
          <Input value={productGroup} onChange={(e) => setProductGroup(e.target.value)} className="h-8 text-sm" />
        </td>
        <td className="px-4 py-2">
          <div className="flex gap-1">
            <Button size="icon-xs" onClick={handleSave} disabled={!term.trim() || !definition.trim()}>
              <Check className="size-3" />
            </Button>
            <Button size="icon-xs" variant="ghost" onClick={handleCancel}>
              <X className="size-3" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="group border-b border-line-subtle hover:bg-canvas-surface/50 transition-colors">
      <td className="px-4 py-2.5 text-sm font-medium text-fg-primary">{item.term}</td>
      <td className="px-4 py-2.5 text-sm text-fg-secondary">{item.definition}</td>
      <td className="px-4 py-2.5 text-sm text-fg-muted">{item.product_group || '-'}</td>
      <td className="px-4 py-2.5">
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon-xs" variant="ghost" onClick={() => setEditing(true)} title="수정">
            <Pencil className="size-3" />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={() => onDelete(item.glossary_id)}
            title="삭제"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

interface GlossaryTableProps {
  items: GlossaryItem[];
  onUpdate: (id: string, data: { term?: string; definition?: string; product_group?: string | null }) => void;
  onDelete: (id: string) => void;
}

export function GlossaryTable({ items, onUpdate, onDelete }: GlossaryTableProps) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-fg-muted">
        아직 용어가 없습니다. 아래에서 추가하거나 자동 생성하세요.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line-primary">
      <table className="w-full">
        <thead>
          <tr className="border-b border-line-primary bg-canvas-surface">
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-fg-secondary">용어</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-fg-secondary">정의</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-fg-secondary">제품군</th>
            <th className="w-20 px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <GlossaryRow key={item.glossary_id} item={item} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
