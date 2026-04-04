'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useOverlay } from '@/hooks/useOverlay';
import { cn } from '@/lib/utils';
import { knowledgeService } from '@/services/knowledge-service';
import type {
  KnowledgeDocument,
  KnowledgeDocumentFileType,
  KnowledgeDocumentStatus,
} from '@/types/project';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ProjectKnowledgeTabProps {
  projectId: string;
}

const FILE_TYPE_ICON: Record<KnowledgeDocumentFileType, typeof FileText> = {
  pdf: FileText,
  md: FileText,
  txt: FileText,
};

const FILE_TYPE_COLOR: Record<KnowledgeDocumentFileType, string> = {
  pdf: 'bg-red-500/10 text-red-600 dark:text-red-400',
  md: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  txt: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
};

const STATUS_CONFIG: Record<
  KnowledgeDocumentStatus,
  { icon: typeof FileText; label: string; color: string }
> = {
  pending: { icon: Clock, label: '대기', color: 'text-gray-500' },
  processing: { icon: Loader2, label: '분석중', color: 'text-amber-600 dark:text-amber-400' },
  completed: {
    icon: CheckCircle2,
    label: '완료',
    color: 'text-green-600 dark:text-green-400',
  },
  failed: { icon: AlertCircle, label: '실패', color: 'text-red-600 dark:text-red-400' },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectKnowledgeTab({ projectId }: ProjectKnowledgeTabProps) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{
    name: string;
    text: string;
    totalChars: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlay = useOverlay();

  // 문서 목록 조회
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await knowledgeService.list(projectId);
      setDocuments(res.documents);
    } catch {
      // api.ts의 글로벌 에러 핸들링이 토스트를 표시
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // processing 상태 문서가 있으면 5초마다 폴링
  useEffect(() => {
    const hasProcessing = documents.some(
      (d) => d.status === 'processing' || d.status === 'pending',
    );
    if (!hasProcessing) return;

    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

  // 파일 업로드 처리
  const handleUploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setUploading(true);

      for (const file of files) {
        try {
          await knowledgeService.upload(projectId, file);
        } catch (err: unknown) {
          const error = err as Error & { status?: number };
          // 409: 중복 파일 → 덮어쓰기 확인
          if (error.status === 409) {
            overlay.confirm({
              title: '중복 파일',
              description: `"${file.name}" 파일이 이미 존재합니다. 덮어쓰시겠습니까?`,
              confirmLabel: '덮어쓰기',
              variant: 'destructive',
              onConfirm: async () => {
                try {
                  await knowledgeService.upload(projectId, file, true);
                  await fetchDocuments();
                } catch {
                  // 글로벌 핸들링
                }
              },
            });
            continue;
          }
          // 다른 에러는 글로벌 핸들링
        }
      }

      await fetchDocuments();
      setUploading(false);
    },
    [projectId, fetchDocuments, overlay],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      handleUploadFiles(files);
    },
    [handleUploadFiles],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      handleUploadFiles(files);
      e.target.value = '';
    },
    [handleUploadFiles],
  );

  // 토글
  const handleToggle = useCallback(
    async (doc: KnowledgeDocument) => {
      try {
        const updated = await knowledgeService.toggle(projectId, doc.document_id, !doc.is_active);
        setDocuments((prev) =>
          prev.map((d) => (d.document_id === updated.document_id ? updated : d)),
        );
      } catch {
        // 글로벌 핸들링
      }
    },
    [projectId],
  );

  // 미리보기
  const handlePreview = useCallback(
    async (doc: KnowledgeDocument) => {
      try {
        const preview = await knowledgeService.preview(projectId, doc.document_id);
        setPreviewDoc({
          name: preview.name,
          text: preview.preview_text,
          totalChars: preview.total_characters,
        });
      } catch {
        // 글로벌 핸들링
      }
    },
    [projectId],
  );

  // 재처리
  const handleReprocess = useCallback(
    async (doc: KnowledgeDocument) => {
      try {
        const updated = await knowledgeService.reprocess(projectId, doc.document_id);
        setDocuments((prev) =>
          prev.map((d) => (d.document_id === updated.document_id ? updated : d)),
        );
      } catch {
        // 글로벌 핸들링
      }
    },
    [projectId],
  );

  // 삭제
  const handleDelete = useCallback(
    (doc: KnowledgeDocument) => {
      overlay.confirm({
        title: '문서 삭제',
        description: `"${doc.name}" 문서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
        confirmLabel: '삭제',
        variant: 'destructive',
        onConfirm: async () => {
          try {
            await knowledgeService.delete(projectId, doc.document_id);
            setDocuments((prev) => prev.filter((d) => d.document_id !== doc.document_id));
          } catch {
            // 글로벌 핸들링
          }
        },
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
          프로젝트에 관련 문서(PRD, 기술 스펙 등)를 업로드하면 에이전트가 분석하여 레코드를 추출하고
          SRS를 생성합니다.
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 transition-colors',
          dragging
            ? 'border-accent-primary bg-accent-primary/5'
            : 'border-line-primary hover:border-fg-muted hover:bg-canvas-surface/50',
          uploading && 'pointer-events-none opacity-50',
        )}
      >
        <div className='bg-canvas-surface mb-3 flex size-12 items-center justify-center rounded-full'>
          {uploading ? (
            <Loader2 className='text-fg-muted size-5 animate-spin' />
          ) : (
            <Upload className='text-fg-muted size-5' />
          )}
        </div>
        <p className='text-fg-primary text-sm font-medium'>
          {uploading ? '업로드 중...' : '파일을 드래그하거나 클릭하여 업로드'}
        </p>
        <p className='text-fg-muted mt-1 text-xs'>TXT, PDF, MD</p>
        <input
          ref={fileInputRef}
          type='file'
          className='hidden'
          multiple
          accept='.pdf,.md,.txt'
          onChange={handleFileSelect}
        />
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className='flex flex-col gap-2'>
          <h3 className='text-fg-primary text-sm font-semibold'>문서 {documents.length}개</h3>
          <div className='border-line-primary divide-line-primary divide-y rounded-lg border'>
            {documents.map((doc) => {
              const fileType = doc.file_type as KnowledgeDocumentFileType;
              const Icon = FILE_TYPE_ICON[fileType] ?? FileText;
              const statusConfig = STATUS_CONFIG[doc.status];
              const StatusIcon = statusConfig.icon;
              return (
                <div key={doc.document_id} className='flex items-center gap-3 px-4 py-3'>
                  {/* File type icon */}
                  <div
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-md',
                      FILE_TYPE_COLOR[fileType] ?? 'bg-gray-500/10 text-gray-600',
                    )}
                  >
                    <Icon className='size-4' />
                  </div>

                  {/* Name + size */}
                  <div className='min-w-0 flex-1'>
                    <p className='text-fg-primary truncate text-sm font-medium'>{doc.name}</p>
                    <div className='text-fg-muted flex items-center gap-2 text-xs'>
                      <span>{formatFileSize(doc.size_bytes)}</span>
                      {doc.status === 'completed' && (
                        <span>· {doc.chunk_count}개 청크</span>
                      )}
                      {doc.status === 'failed' && doc.error_message && (
                        <span className='text-red-500 truncate max-w-48' title={doc.error_message}>
                          · {doc.error_message}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <Badge variant='outline' className={cn('shrink-0 text-[10px]', statusConfig.color)}>
                    <StatusIcon
                      className={cn(
                        'mr-1 size-3',
                        doc.status === 'processing' && 'animate-spin',
                      )}
                    />
                    {statusConfig.label}
                  </Badge>

                  {/* Active toggle */}
                  <Switch
                    checked={doc.is_active}
                    onCheckedChange={() => handleToggle(doc)}
                    className='shrink-0'
                    aria-label={doc.is_active ? '비활성화' : '활성화'}
                  />

                  {/* Actions */}
                  <div className='flex shrink-0 items-center gap-1'>
                    {doc.status === 'completed' && (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='text-fg-muted hover:text-fg-primary size-8'
                        onClick={() => handlePreview(doc)}
                        aria-label='미리보기'
                      >
                        <Eye className='size-3.5' />
                      </Button>
                    )}
                    {doc.status === 'failed' && (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='text-fg-muted hover:text-fg-primary size-8'
                        onClick={() => handleReprocess(doc)}
                        aria-label='재시도'
                      >
                        <RefreshCw className='size-3.5' />
                      </Button>
                    )}
                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-fg-muted hover:text-destructive size-8'
                      onClick={() => handleDelete(doc)}
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

      {/* Empty state */}
      {documents.length === 0 && (
        <div className='flex flex-col items-center justify-center py-12 text-center'>
          <div className='bg-canvas-surface mb-4 flex size-16 items-center justify-center rounded-full'>
            <FileText className='text-fg-muted size-6' />
          </div>
          <p className='text-fg-primary text-sm font-medium'>아직 업로드된 문서가 없습니다</p>
          <p className='text-fg-muted mt-1 text-sm'>
            위 영역에 파일을 드래그하거나 클릭하여 업로드하세요
          </p>
        </div>
      )}

      {/* Preview Panel */}
      {previewDoc && (
        <div className='border-line-primary bg-canvas-surface rounded-lg border'>
          <div className='flex items-center justify-between border-b px-4 py-3'>
            <div>
              <h4 className='text-fg-primary text-sm font-semibold'>{previewDoc.name}</h4>
              <p className='text-fg-muted text-xs'>
                {previewDoc.totalChars.toLocaleString()}자
                {previewDoc.text.length < previewDoc.totalChars && ' (일부만 표시)'}
              </p>
            </div>
            <Button
              variant='ghost'
              size='icon'
              className='size-8'
              onClick={() => setPreviewDoc(null)}
            >
              <X className='size-4' />
            </Button>
          </div>
          <div className='max-h-80 overflow-y-auto p-4'>
            <pre className='text-fg-secondary whitespace-pre-wrap text-xs leading-relaxed'>
              {previewDoc.text}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
