'use client';

import { useCallback, useEffect, useState } from 'react';
import { GlossaryGeneratePanel } from '@/components/projects/GlossaryGeneratePanel';
import { GlossaryTable } from '@/components/projects/GlossaryTable';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';
import { glossaryService } from '@/services/glossary-service';
import { useOverlayStore } from '@/stores/overlay-store';
import { useReadinessStore } from '@/stores/readiness-store';
import { useDeferredLoading } from '@/hooks/useDeferredLoading';
import type { GlossaryCreate, GlossaryItem } from '@/types/project';

interface ProjectGlossaryTabProps {
  projectId: string;
}

export function ProjectGlossaryTab({ projectId }: ProjectGlossaryTabProps) {
  const { showConfirm } = useOverlayStore();
  const invalidateReadiness = useReadinessStore((s) => s.invalidate);

  const [items, setItems] = useState<GlossaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useDeferredLoading(loading);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GlossaryCreate[]>([]);

  const fetchGlossary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await glossaryService.list(projectId);
      setItems(data.glossary);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '용어 목록을 불러올 수 없습니다.';
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchGlossary();
  }, [fetchGlossary]);

  async function handleAdd(data: GlossaryCreate) {
    try {
      const created = await glossaryService.create(projectId, data);
      setItems((prev) => [...prev, created]);
      invalidateReadiness();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '용어 추가에 실패했습니다.';
      showToast.error(msg);
    }
  }

  async function handleUpdate(
    glossaryId: string,
    data: { term?: string; definition?: string; product_group?: string | null },
  ) {
    try {
      const updated = await glossaryService.update(projectId, glossaryId, data);
      setItems((prev) => prev.map((item) => (item.glossary_id === glossaryId ? updated : item)));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '용어 수정에 실패했습니다.';
      showToast.error(msg);
    }
  }

  function handleDelete(glossaryId: string) {
    showConfirm({
      title: '용어 삭제',
      description: '이 용어를 삭제하시겠습니까?',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await glossaryService.delete(projectId, glossaryId);
          setItems((prev) => prev.filter((item) => item.glossary_id !== glossaryId));
          invalidateReadiness();
        } catch (err) {
          const msg = err instanceof ApiError ? err.message : '삭제에 실패했습니다.';
          showToast.error(msg);
        }
      },
    });
  }

  function handleBulkDelete(ids: string[]) {
    showConfirm({
      title: '용어 일괄 삭제',
      description: `선택한 ${ids.length}개 용어를 삭제하시겠습니까?`,
      variant: 'destructive',
      onConfirm: async () => {
        try {
          // TODO: bulk delete API 추가 후 glossaryService.bulkDelete(projectId, ids) 로 교체
          await Promise.all(ids.map((id) => glossaryService.delete(projectId, id)));
          setItems((prev) => prev.filter((item) => !ids.includes(item.glossary_id)));
          invalidateReadiness();
          showToast.success(`${ids.length}개 용어가 삭제되었습니다.`);
        } catch (err) {
          const msg = err instanceof ApiError ? err.message : '일괄 삭제에 실패했습니다.';
          showToast.error(msg);
        }
      },
    });
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenerated([]);
    try {
      const result = await glossaryService.generate(projectId);
      setGenerated(result.generated_glossary);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '자동 생성에 실패했습니다.';
      showToast.error(msg);
    } finally {
      setGenerating(false);
    }
  }

  async function handleAddGenerated(newItems: GlossaryCreate[]) {
    try {
      const created = await Promise.all(
        newItems.map((item) => glossaryService.create(projectId, item)),
      );
      setItems((prev) => [...prev, ...created]);
      setGenerated([]);
      invalidateReadiness();
      showToast.success(`${created.length}개 용어가 추가되었습니다.`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '용어 추가에 실패했습니다.';
      showToast.error(msg);
    }
  }

  if (showSkeleton) {
    return (
      <div className='flex flex-col gap-2'>
        <Skeleton className='h-8 w-full rounded-md' />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className='h-10 w-full rounded-md' />
        ))}
      </div>
    );
  }

  if (loading) return null;

  return (
    <div className='flex flex-col gap-4'>
      {generated.length > 0 && (
        <GlossaryGeneratePanel
          generated={generated}
          onAdd={handleAddGenerated}
          onClose={() => setGenerated([])}
        />
      )}

      <GlossaryTable
        items={items}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        generating={generating}
        onGenerate={handleGenerate}
      />
    </div>
  );
}
