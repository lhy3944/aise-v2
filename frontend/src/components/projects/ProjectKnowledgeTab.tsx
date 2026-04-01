'use client';

import { useCallback, useRef, useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { KnowledgeSource, KnowledgeSourceFileType } from '@/types/project';

const FILE_TYPE_ICON: Record<KnowledgeSourceFileType, typeof FileText> = {
  pdf: FileText,
  md: FileText,
  docx: FileText,
  xlsx: FileSpreadsheet,
  pptx: Presentation,
};

const FILE_TYPE_COLOR: Record<KnowledgeSourceFileType, string> = {
  pdf: 'bg-red-500/10 text-red-600 dark:text-red-400',
  md: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  docx: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  xlsx: 'bg-green-500/10 text-green-600 dark:text-green-400',
  pptx: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
};

const STATUS_CONFIG = {
  ready: { icon: CheckCircle2, label: '준비됨', color: 'text-green-600 dark:text-green-400' },
  processing: { icon: Loader2, label: '처리중', color: 'text-amber-600 dark:text-amber-400' },
  error: { icon: AlertCircle, label: '오류', color: 'text-red-600 dark:text-red-400' },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Mock data - will be replaced with API calls when backend is ready
const MOCK_SOURCES: KnowledgeSource[] = [
  {
    id: '1',
    name: 'Product Requirements Document v2.3.pdf',
    file_type: 'pdf',
    size_bytes: 2_458_624,
    uploaded_at: '2026-03-28T09:15:00Z',
    status: 'ready',
  },
  {
    id: '2',
    name: 'System Architecture Overview.md',
    file_type: 'md',
    size_bytes: 45_312,
    uploaded_at: '2026-03-29T14:22:00Z',
    status: 'ready',
  },
  {
    id: '3',
    name: 'API Specification.docx',
    file_type: 'docx',
    size_bytes: 892_160,
    uploaded_at: '2026-03-30T11:05:00Z',
    status: 'processing',
  },
];

export function ProjectKnowledgeTab() {
  const [sources, setSources] = useState<KnowledgeSource[]>(MOCK_SOURCES);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    // Mock: just add file names
    const files = Array.from(e.dataTransfer.files);
    const newSources: KnowledgeSource[] = files.map((file, i) => ({
      id: `new-${Date.now()}-${i}`,
      name: file.name,
      file_type: getFileType(file.name),
      size_bytes: file.size,
      uploaded_at: new Date().toISOString(),
      status: 'processing' as const,
    }));
    setSources((prev) => [...prev, ...newSources]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newSources: KnowledgeSource[] = files.map((file, i) => ({
      id: `new-${Date.now()}-${i}`,
      name: file.name,
      file_type: getFileType(file.name),
      size_bytes: file.size,
      uploaded_at: new Date().toISOString(),
      status: 'processing' as const,
    }));
    setSources((prev) => [...prev, ...newSources]);
    e.target.value = '';
  }, []);

  function handleDelete(id: string) {
    setSources((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Info Banner */}
      <div className='bg-accent-primary/5 border-accent-primary/20 rounded-lg border p-4'>
        <p className='text-fg-secondary text-sm'>
          프로젝트에 관련 문서(PRD, 기술 스펙 등)를 업로드하면 에이전트가 RAG 방식으로 참조하여
          더 정확한 산출물을 생성합니다.
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors',
          dragging
            ? 'border-accent-primary bg-accent-primary/5'
            : 'border-line-primary hover:border-fg-muted hover:bg-canvas-surface/50',
        )}
      >
        <div className='bg-canvas-surface mb-3 flex size-12 items-center justify-center rounded-full'>
          <Upload className='text-fg-muted size-5' />
        </div>
        <p className='text-fg-primary text-sm font-medium'>
          파일을 드래그하거나 클릭하여 업로드
        </p>
        <p className='text-fg-muted mt-1 text-xs'>PDF, Markdown, Word, Excel, PowerPoint</p>
        <input
          ref={fileInputRef}
          type='file'
          className='hidden'
          multiple
          accept='.pdf,.md,.docx,.xlsx,.pptx'
          onChange={handleFileSelect}
        />
      </div>

      {/* File List */}
      {sources.length > 0 && (
        <div className='flex flex-col gap-2'>
          <h3 className='text-fg-primary text-sm font-semibold'>
            업로드된 문서 ({sources.length})
          </h3>
          <div className='border-line-primary divide-line-primary divide-y rounded-lg border'>
            {sources.map((source) => {
              const Icon = FILE_TYPE_ICON[source.file_type] ?? FileText;
              const statusConfig = STATUS_CONFIG[source.status];
              const StatusIcon = statusConfig.icon;
              return (
                <div
                  key={source.id}
                  className='flex items-center gap-3 px-4 py-3'
                >
                  <div
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-md',
                      FILE_TYPE_COLOR[source.file_type],
                    )}
                  >
                    <Icon className='size-4' />
                  </div>

                  <div className='min-w-0 flex-1'>
                    <p className='text-fg-primary truncate text-sm font-medium'>{source.name}</p>
                    <p className='text-fg-muted text-xs'>
                      {formatFileSize(source.size_bytes)}
                    </p>
                  </div>

                  <div className='flex shrink-0 items-center gap-3'>
                    <Badge variant='outline' className={cn('text-[10px]', statusConfig.color)}>
                      <StatusIcon
                        className={cn(
                          'mr-1 size-3',
                          source.status === 'processing' && 'animate-spin',
                        )}
                      />
                      {statusConfig.label}
                    </Badge>

                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-fg-muted hover:text-destructive size-8'
                      onClick={() => handleDelete(source.id)}
                      aria-label='삭제'
                    >
                      <Trash2 className='size-3.5' />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sources.length === 0 && (
        <div className='flex flex-col items-center justify-center py-12 text-center'>
          <div className='bg-canvas-surface mb-4 flex size-16 items-center justify-center rounded-full'>
            <FileText className='text-fg-muted size-6' />
          </div>
          <p className='text-fg-primary text-sm font-medium'>아직 업로드된 문서가 없습니다</p>
          <p className='text-fg-muted mt-1 text-xs'>
            위 영역에 파일을 드래그하거나 클릭하여 업로드하세요
          </p>
        </div>
      )}
    </div>
  );
}

function getFileType(filename: string): KnowledgeSourceFileType {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'md':
      return 'md';
    case 'docx':
      return 'docx';
    case 'xlsx':
      return 'xlsx';
    case 'pptx':
      return 'pptx';
    default:
      return 'pdf';
  }
}
