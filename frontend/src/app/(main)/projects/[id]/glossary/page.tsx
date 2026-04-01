'use client';

import { Sparkles } from 'lucide-react';
import { use, useCallback, useEffect, useState } from 'react';
import { GlossaryAddForm } from '@/components/projects/GlossaryAddForm';
import { GlossaryGeneratePanel } from '@/components/projects/GlossaryGeneratePanel';
import { GlossaryTable } from '@/components/projects/GlossaryTable';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api';
import { glossaryService } from '@/services/glossary-service';
import { useOverlayStore } from '@/stores/overlay-store';
import type { GlossaryCreate, GlossaryItem } from '@/types/project';

interface Props {
  params: Promise<{ id: string }>;
}

export default function GlossaryPage({ params }: Props) {
  const { id: projectId } = use(params);
  const { showAlert, showConfirm } = useOverlayStore();

  const [items, setItems] = useState<GlossaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GlossaryCreate[]>([]);

  const fetchGlossary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await glossaryService.list(projectId);
      setItems(data.glossary);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '용어 목록을 불러올 수 없습니다.';
      showAlert({ type: 'error', description: msg });
    } finally {
      setLoading(false);
    }
  }, [projectId, showAlert]);

  useEffect(() => {
    fetchGlossary();
  }, [fetchGlossary]);

  async function handleAdd(data: GlossaryCreate) {
    try {
      const created = await glossaryService.create(projectId, data);
      setItems((prev) => [...prev, created]);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '용어 추가에 실패했습니다.';
      showAlert({ type: 'error', description: msg });
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
      showAlert({ type: 'error', description: msg });
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
        } catch (err) {
          const msg = err instanceof ApiError ? err.message : '삭제에 실패했습니다.';
          showAlert({ type: 'error', description: msg });
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
      showAlert({ type: 'error', description: msg });
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
      showAlert({
        type: 'success',
        description: `${created.length}개 용어가 추가되었습니다.`,
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '용어 추가에 실패했습니다.';
      showAlert({ type: 'error', description: msg });
    }
  }

  return (
    <>
      {/* Header */}
      <div className='mb-4 flex items-center justify-between'>
        <div>
          <h2 className='text-fg-primary text-base font-semibold'>Glossary</h2>
          <p className='text-fg-muted text-xs'>프로젝트에서 사용하는 용어를 관리합니다.</p>
        </div>
        <Button size='sm' variant='outline' onClick={handleGenerate} disabled={generating}>
          <Sparkles className='size-3.5' />
          {generating ? '생성 중...' : '자동 생성'}
        </Button>
      </div>

      {/* Generated panel */}
      {generated.length > 0 && (
        <div className='mb-4'>
          <GlossaryGeneratePanel
            generated={generated}
            onAdd={handleAddGenerated}
            onClose={() => setGenerated([])}
          />
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className='flex flex-col gap-2'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className='h-10 w-full rounded-md' />
          ))}
        </div>
      ) : (
        <GlossaryTable items={items} onUpdate={handleUpdate} onDelete={handleDelete} />
      )}

      {/* Add Form */}
      <div className='border-line-primary mt-4 rounded-lg border p-4'>
        <span className='text-fg-muted mb-2 block text-xs font-medium'>새 용어 추가</span>
        <GlossaryAddForm onAdd={handleAdd} />
      </div>
    </>
  );
}
