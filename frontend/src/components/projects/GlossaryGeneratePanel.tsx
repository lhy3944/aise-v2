'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, X, Plus } from 'lucide-react';
import { useState } from 'react';
import type { GlossaryCreate } from '@/types/project';

interface GlossaryGeneratePanelProps {
  generated: GlossaryCreate[];
  onAdd: (items: GlossaryCreate[]) => void;
  onClose: () => void;
}

export function GlossaryGeneratePanel({
  generated,
  onAdd,
  onClose,
}: GlossaryGeneratePanelProps) {
  const [selected, setSelected] = useState<Set<number>>(
    new Set(generated.map((_, i) => i)),
  );

  function toggleItem(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function handleAddSelected() {
    const items = generated.filter((_, i) => selected.has(i));
    onAdd(items);
  }

  if (generated.length === 0) return null;

  return (
    <div className="rounded-lg border border-accent-primary/30 bg-accent-primary/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-accent-primary" />
          <span className="text-sm font-semibold text-fg-primary">
            자동 생성된 용어 ({generated.length}건)
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleAddSelected}
            disabled={selected.size === 0}
          >
            <Plus className="size-3.5" />
            선택 항목 추가 ({selected.size})
          </Button>
          <Button size="icon-xs" variant="ghost" onClick={onClose}>
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {generated.map((item, idx) => (
          <label
            key={idx}
            className="flex cursor-pointer items-start gap-2.5 rounded-md border border-line-subtle bg-canvas-primary px-3 py-2 transition-colors hover:bg-canvas-surface/50"
          >
            <Checkbox
              checked={selected.has(idx)}
              onCheckedChange={() => toggleItem(idx)}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-fg-primary">{item.term}</span>
              <p className="text-xs text-fg-secondary">{item.definition}</p>
              {item.product_group && (
                <span className="text-xs text-fg-muted">{item.product_group}</span>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
