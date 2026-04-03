'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { MODULE_COLORS, MODULE_LABELS } from '@/constants/project';
import { useDeferredLoading } from '@/hooks/useDeferredLoading';
import { useOverlay } from '@/hooks/useOverlay';
import { ApiError } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { projectService } from '@/services/project-service';
import { useProjectStore } from '@/stores/project-store';
import type { Project, ProjectModule } from '@/types/project';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Pencil, Trash2 } from 'lucide-react';

const MODULE_PRESETS: { label: string; modules: ProjectModule[] }[] = [
  { label: 'All', modules: ['requirements', 'design', 'testcase'] },
  { label: 'Requirements Only', modules: ['requirements'] },
  { label: 'Req + Design', modules: ['requirements', 'design'] },
  { label: 'Req + Testcase', modules: ['requirements', 'testcase'] },
  { label: 'Testcase Only', modules: ['testcase'] },
];

interface ProjectOverviewTabProps {
  projectId: string;
}

export function ProjectOverviewTab({ projectId }: ProjectOverviewTabProps) {
  const router = useRouter();
  const overlay = useOverlay();
  const updateProjectInStore = useProjectStore((s) => s.updateProject);
  const removeProjectFromStore = useProjectStore((s) => s.removeProject);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('');
  const [productType, setProductType] = useState('');
  const [modules, setModules] = useState<ProjectModule[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const proj = await projectService.get(projectId);
      setProject(proj);
      resetProjectForm(proj);
    } catch {
      // error handled globally
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function resetProjectForm(p: Project) {
    setName(p.name);
    setDescription(p.description ?? '');
    setDomain(p.domain ?? '');
    setProductType(p.product_type ?? '');
    setModules(p.modules);
  }

  async function handleSaveProject() {
    if (!name.trim() || modules.length === 0) return;
    setSaving(true);
    try {
      const updated = await projectService.update(projectId, {
        name: name.trim(),
        description: description.trim() || null,
        domain: domain.trim() || null,
        product_type: productType.trim() || null,
        modules,
      });
      setProject(updated);
      updateProjectInStore(updated);
      setEditing(false);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '프로젝트 업데이트에 실패했습니다.';
      console.error(message);
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteProject() {
    overlay.confirm({
      title: '프로젝트를 삭제하시겠습니까?',
      description: '삭제된 프로젝트는 복구할 수 없습니다.',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await projectService.delete(projectId);
          removeProjectFromStore(projectId);
          router.push('/projects');
        } catch (err) {
          const message = err instanceof ApiError ? err.message : '프로젝트 삭제에 실패했습니다.';
          console.error(message);
        }
      },
    });
  }

  const showSkeleton = useDeferredLoading(loading);

  if (showSkeleton) {
    return (
      <div className='flex flex-col gap-6'>
        <Skeleton className='h-8 w-60' />
        <Skeleton className='h-32 w-full' />
      </div>
    );
  }

  if (loading) return null;

  if (!project) {
    return <p className='text-fg-muted text-sm'>프로젝트를 찾을 수 없습니다.</p>;
  }

  return (
    <div className='w-full'>
      <div>
        {editing ? (
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='edit-name' variant='field'>
                프로젝트 <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='edit-name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='프로젝트 이름'
              />
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='edit-desc' variant='field'>
                설명
              </Label>
              <Textarea
                id='edit-desc'
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='프로젝트에 대한 간단한 설명'
                className='field-sizing-fixed resize-none overflow-y-auto'
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='edit-domain' variant='field'>
                  도메인
                </Label>
                <Input
                  id='edit-domain'
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder='예: robotics'
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='edit-product' variant='field'>
                  제품 유형
                </Label>
                <Input
                  id='edit-product'
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  placeholder='예: embedded'
                />
              </div>
            </div>
            <div className='flex flex-col gap-2'>
              <Label variant='field'>
                모듈 선택 <span className='text-destructive'>*</span>
              </Label>
              <div className='grid grid-cols-2 gap-2 sm:grid-cols-1 md:grid-cols-5'>
                {MODULE_PRESETS.map((preset) => {
                  const isActive =
                    preset.modules.length === modules.length &&
                    preset.modules.every((m) => modules.includes(m));
                  return (
                    <Button
                      type='button'
                      variant='ghost'
                      key={preset.label}
                      onClick={() => setModules(preset.modules)}
                      className={cn(
                        'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                        isActive
                          ? 'border-accent-primary bg-accent-primary/5 text-accent-primary'
                          : 'border-line-primary hover:border-fg-muted',
                      )}
                    >
                      {preset.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className='flex justify-end gap-2 pt-2'>
              <Button
                variant='ghost'
                size='sm'
                className='px-6'
                onClick={() => {
                  resetProjectForm(project);
                  setEditing(false);
                }}
                disabled={saving}
              >
                취소
              </Button>
              <Button
                size='sm'
                className='px-6'
                onClick={handleSaveProject}
                disabled={saving || !name.trim()}
              >
                {saving && <Spinner className='mr-1.5' />}
                저장
              </Button>
            </div>
          </div>
        ) : (
          <div className='divide-line-subtle flex flex-col divide-y'>
            <div className='flex items-start justify-between gap-4 pb-5'>
              <div className='flex flex-col gap-1'>
                <Label variant='field'>프로젝트</Label>
                <span className='text-sm font-medium'>{project.name}</span>
              </div>
              <div className='flex items-center gap-1'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={handleDeleteProject}
                      className='text-fg-muted hover:text-destructive size-8'
                    >
                      <Trash2 className='size-3.5' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>삭제</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => setEditing(true)}
                      className='text-fg-muted hover:text-fg-primary size-8'
                    >
                      <Pencil className='size-3.5' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>편집</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* 설명 */}
            <div className='flex flex-col gap-1 py-5'>
              <Label variant='field'>설명</Label>
              <span className='text-sm leading-relaxed whitespace-pre-wrap'>
                {project.description || '-'}
              </span>
            </div>

            {/* 도메인 / 제품 유형 */}
            <div className='grid grid-cols-2 gap-3 py-5'>
              <div className='flex flex-col gap-2'>
                <Label variant='field'>도메인</Label>
                {project.domain ? (
                  <div>
                    <Badge variant='default' className='px-4'>
                      {project.domain}
                    </Badge>
                  </div>
                ) : (
                  <span className='text-fg-muted text-sm'>-</span>
                )}
              </div>
              <div className='flex flex-col gap-2'>
                <Label variant='field'>제품 유형</Label>
                {project.product_type ? (
                  <div>
                    <Badge variant='default' className='px-4'>
                      {project.product_type}
                    </Badge>
                  </div>
                ) : (
                  <span className='text-fg-muted text-sm'>-</span>
                )}
              </div>
            </div>

            {/* 모듈 */}
            <div className='flex flex-col gap-2 py-5'>
              <Label variant='field'>모듈</Label>
              <div className='flex flex-wrap gap-1.5'>
                {project.modules.map((mod) => (
                  <Badge key={mod} variant='ghost' className={cn(MODULE_COLORS[mod], 'text-xs')}>
                    {MODULE_LABELS[mod]}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 수정일 / 생성일 */}
            <div className='grid grid-cols-2 gap-3 pt-5'>
              <div className='flex flex-col gap-1'>
                <Label variant='field'>수정일</Label>
                <span className='text-sm'>{formatDateTime(project.updated_at)}</span>
              </div>
              <div className='flex flex-col gap-1'>
                <Label variant='field'>생성일</Label>
                <span className='text-sm'>{formatDateTime(project.created_at)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
