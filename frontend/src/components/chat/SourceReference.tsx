'use client';

import { useCallback, useState } from 'react';
import { FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useProjectStore } from '@/stores/project-store';

export interface SourceData {
  ref: number;
  document_id: string;
  document_name: string;
  chunk_index: number;
}

interface SourceReferenceProps {
  sources: SourceData[];
}

interface ChunkPreview {
  document_name: string;
  target: { index: number; content: string };
  before: { index: number; content: string }[];
  after: { index: number; content: string }[];
}

export function SourceReference({ sources }: SourceReferenceProps) {
  const projectId = useProjectStore((s) => s.currentProject?.project_id);
  const [preview, setPreview] = useState<ChunkPreview | null>(null);
  const [loadingRef, setLoadingRef] = useState<number | null>(null);

  const handleClick = useCallback(
    async (source: SourceData) => {
      if (!projectId) return;
      if (preview && loadingRef === source.ref) {
        setPreview(null);
        setLoadingRef(null);
        return;
      }

      setLoadingRef(source.ref);
      try {
        const data = await api.get<ChunkPreview>(
          `/api/v1/projects/${projectId}/knowledge/documents/${source.document_id}/chunks/${source.chunk_index}?context=1`,
        );
        setPreview(data);
      } catch {
        setPreview(null);
      }
      setLoadingRef(null);
    },
    [projectId, preview, loadingRef],
  );

  if (sources.length === 0) return null;

  return (
    <div className='mt-3 space-y-2'>
      {/* Source badges */}
      <div className='flex flex-wrap items-center gap-1.5'>
        <span className='text-fg-muted text-xs'>출처:</span>
        {sources.map((s) => (
          <button
            key={s.ref}
            onClick={() => handleClick(s)}
            className={cn(
              'border-line-primary text-fg-secondary hover:border-accent-primary hover:text-fg-primary',
              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors',
              preview && loadingRef === s.ref && 'border-accent-primary text-fg-primary',
            )}
          >
            <FileText className='size-3' />
            <span>[{s.ref}] {s.document_name}</span>
          </button>
        ))}
      </div>

      {/* Chunk preview panel */}
      {preview && (
        <div className='border-line-primary bg-canvas-surface rounded-lg border p-3'>
          <div className='mb-2 flex items-center justify-between'>
            <span className='text-fg-secondary text-xs font-medium'>
              {preview.document_name} - Chunk #{preview.target.index}
            </span>
            <Button
              variant='ghost'
              size='sm'
              className='size-6 p-0'
              onClick={() => setPreview(null)}
            >
              <X className='size-3.5' />
            </Button>
          </div>
          <div className='space-y-1 text-sm'>
            {preview.before.map((c) => (
              <p key={c.index} className='text-fg-muted text-xs opacity-60'>
                {c.content}
              </p>
            ))}
            <p className='border-accent-primary text-fg-primary border-l-2 pl-2 text-xs'>
              {preview.target.content}
            </p>
            {preview.after.map((c) => (
              <p key={c.index} className='text-fg-muted text-xs opacity-60'>
                {c.content}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
