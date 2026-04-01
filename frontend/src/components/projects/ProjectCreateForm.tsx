'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type { ProjectCreate, ProjectModule } from '@/types/project';
import { useState } from 'react';

const MODULE_INFO: {
  value: ProjectModule;
  label: string;
  description: string;
}[] = [
  {
    value: 'requirements',
    label: 'Requirements',
    description: '요구사항 관리 + SRS 생성',
  },
  {
    value: 'design',
    label: 'Design',
    description: 'UCD/UCS/SAD 설계 문서 생성',
  },
  {
    value: 'testcase',
    label: 'Test Case',
    description: '테스트 케이스 자동 생성',
  },
];

const MODULE_PRESETS: { label: string; modules: ProjectModule[] }[] = [
  { label: 'All', modules: ['requirements', 'design', 'testcase'] },
  { label: 'Requirements Only', modules: ['requirements'] },
  { label: 'Req + Design', modules: ['requirements', 'design'] },
  { label: 'Req + Testcase', modules: ['requirements', 'testcase'] },
  { label: 'Testcase Only', modules: ['testcase'] },
];

interface ProjectCreateFormProps {
  onSubmit: (data: ProjectCreate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<ProjectCreate>;
}

export function ProjectCreateForm({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
}: ProjectCreateFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [domain, setDomain] = useState(initialData?.domain || '');
  const [productType, setProductType] = useState(initialData?.product_type || '');
  const [modules, setModules] = useState<ProjectModule[]>(
    initialData?.modules || ['requirements', 'design', 'testcase'],
  );

  function applyPreset(preset: ProjectModule[]) {
    setModules(preset);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || modules.length === 0) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      domain: domain.trim() || null,
      product_type: productType.trim() || null,
      modules,
    });
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
      {/* Name */}
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='project-name'>
          프로젝트 이름 <span className='text-destructive'>*</span>
        </Label>
        <Input
          id='project-name'
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='프로젝트 이름을 입력하세요'
          required
          autoFocus
        />
      </div>

      {/* Description */}
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='project-desc'>설명</Label>
        <Textarea
          id='project-desc'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='프로젝트에 대한 간단한 설명'
          className='min-h-20 resize-none'
        />
      </div>

      {/* Domain & Product Type */}
      <div className='grid grid-cols-2 gap-3'>
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='project-domain'>도메인</Label>
          <Input
            id='project-domain'
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder='예: robotics'
          />
        </div>
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='project-product'>제품 유형</Label>
          <Input
            id='project-product'
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            placeholder='예: embedded'
          />
        </div>
      </div>

      {/* Module Selection */}
      <div className='flex flex-col gap-2'>
        <Label>
          모듈 선택 <span className='text-destructive'>*</span>
        </Label>

        {/* Presets */}
        <div className='flex w-full flex-wrap gap-2'>
          {MODULE_PRESETS.map((preset) => {
            const isActive =
              preset.modules.length === modules.length &&
              preset.modules.every((m) => modules.includes(m));
            return (
              <Button
                type='button'
                variant={'ghost'}
                key={preset.label}
                onClick={() => applyPreset(preset.modules)}
                className={`flex-1 rounded-md border p-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'border-accent-primary bg-accent-primary/5 text-accent-primary'
                    : 'border-line-primary text-fg-secondary hover:border-fg-muted'
                }`}
              >
                {preset.label}
              </Button>
            );
          })}
        </div>

        {/* Module status display */}
        <div className='border-line-subtle flex flex-col gap-1.5 rounded-md border p-3'>
          {MODULE_INFO.map((mod) => {
            const isActive = modules.includes(mod.value);
            return (
              <div
                key={mod.value}
                className={`flex items-center gap-2.5 transition-opacity ${
                  isActive ? 'opacity-100' : 'opacity-35'
                }`}
              >
                <div
                  className={`h-2 w-2 rounded-full ${isActive ? 'bg-accent-primary' : 'bg-fg-muted'}`}
                />
                <div>
                  <span className='text-fg-primary text-sm font-medium'>{mod.label}</span>
                  <span className='text-fg-secondary ml-2 text-xs'>{mod.description}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className='flex justify-end gap-2 pt-2'>
        <Button type='button' variant='outline' onClick={onCancel} disabled={isLoading}>
          취소
        </Button>
        <Button
          type='submit'
          disabled={!name.trim() || modules.length === 0 || isLoading}
          className='w-[120px]'
        >
          {isLoading ? `생성중` : '프로젝트 생성'}
          {isLoading && <Spinner />}
        </Button>
      </div>
    </form>
  );
}
