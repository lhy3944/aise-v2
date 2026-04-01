'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MODULE_COLORS, MODULE_LABELS } from '@/constants/project';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import { projectService } from '@/services/project-service';
import { useProjectStore } from '@/stores/project-store';
import { useDeferredLoading } from '@/hooks/useDeferredLoading';
import type { Project, ProjectModule } from '@/types/project';

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
  const updateProjectInStore = useProjectStore((s) => s.updateProject);

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

  const fields: { label: string; value: React.ReactNode }[] = [
    { label: '이름', value: <span className='text-fg-primary font-medium'>{project.name}</span> },
    { label: '설명', value: project.description || '-' },
    { label: '도메인', value: project.domain || '-' },
    { label: '제품 유형', value: project.product_type || '-' },
    {
      label: '모듈',
      value: (
        <div className='flex flex-wrap gap-1.5'>
          {project.modules.map((mod) => (
            <Badge key={mod} variant='ghost' className={cn(MODULE_COLORS[mod], 'text-xs')}>
              {MODULE_LABELS[mod]}
            </Badge>
          ))}
        </div>
      ),
    },
    { label: '생성일', value: formatDate(project.created_at) },
    { label: '수정일', value: formatDate(project.updated_at) },
  ];

  return (
    <div className='w-full'>
      {/* Header */}
      <div className='flex items-center justify-end pb-4'>
        {!editing && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon-sm'
                onClick={() => setEditing(true)}
                className='text-fg-muted hover:text-fg-primary size-7'
              >
                <Pencil className='size-3.5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>편집</TooltipContent>
          </Tooltip>
        )}
      </div>

      {editing ? (
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='edit-name' className='text-fg-muted text-xs'>
              프로젝트 이름 <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='edit-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='프로젝트 이름'
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='edit-desc' className='text-fg-muted text-xs'>
              설명
            </Label>
            <Textarea
              id='edit-desc'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='프로젝트에 대한 간단한 설명'
              className='min-h-20 resize-none'
            />
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='edit-domain' className='text-fg-muted text-xs'>
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
              <Label htmlFor='edit-product' className='text-fg-muted text-xs'>
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
            <Label className='text-fg-muted text-xs'>
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
                        : 'border-line-primary text-fg-secondary hover:border-fg-muted',
                    )}
                  >
                    {preset.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Actions — 우하단 */}
          <div className='flex justify-end gap-2 pt-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                resetProjectForm(project);
                setEditing(false);
              }}
              disabled={saving}
            >
              취소
            </Button>
            <Button size='sm' onClick={handleSaveProject} disabled={saving || !name.trim()}>
              {saving && <Spinner className='mr-1.5' />}
              저장
            </Button>
          </div>
        </div>
      ) : (
        <div className='flex flex-col'>
          {fields.map((field, i) => (
            <div
              key={field.label}
              className={cn(
                'flex items-baseline gap-4 py-2.5 text-sm',
                i < fields.length - 1 && 'border-line-subtle border-b',
              )}
            >
              <span className='text-fg-muted w-20 shrink-0'>{field.label}</span>
              <span className='text-fg-secondary'>{field.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
