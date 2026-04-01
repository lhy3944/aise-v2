'use client';

import { useCallback, useEffect, useState } from 'react';
import { Box, Check, ChevronsUpDown, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { projectService } from '@/services/project-service';
import { useProjectStore } from '@/stores/project-store';
import type { Project } from '@/types/project';

interface ProjectSelectorProps {
  collapsed?: boolean;
}

export function ProjectSelector({ collapsed = false }: ProjectSelectorProps) {
  const projects = useProjectStore((s) => s.projects);
  const currentProject = useProjectStore((s) => s.currentProject);
  const setProjects = useProjectStore((s) => s.setProjects);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const [open, setOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await projectService.list();
      setProjects(data.projects);
    } catch {
      // silently fail — projects page will handle errors
    }
  }, [setProjects]);

  useEffect(() => {
    if (projects.length === 0) {
      fetchProjects();
    }
  }, [projects.length, fetchProjects]);

  function handleSelect(project: Project) {
    setCurrentProject(
      currentProject?.project_id === project.project_id ? null : project,
    );
    setOpen(false);
  }

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className={cn(
              'h-9 w-9',
              currentProject
                ? 'text-accent-primary'
                : 'text-icon-default hover:text-icon-active',
            )}
            onClick={() => setOpen(!open)}
          >
            <Box className='size-5' />
          </Button>
        </TooltipTrigger>
        <TooltipContent side='right'>
          {currentProject ? currentProject.name : '프로젝트 선택'}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className='flex flex-col'>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'border-line-primary hover:bg-canvas-surface flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left transition-colors',
          open && 'bg-canvas-surface',
        )}
      >
        <Box
          className={cn(
            'size-4 shrink-0',
            currentProject ? 'text-accent-primary' : 'text-fg-muted',
          )}
        />
        <span
          className={cn(
            'flex-1 truncate text-xs font-medium',
            currentProject ? 'text-fg-primary' : 'text-fg-muted',
          )}
        >
          {currentProject?.name ?? '프로젝트 선택'}
        </span>
        <ChevronsUpDown className='text-fg-muted size-3.5 shrink-0' />
      </button>

      {/* Dropdown */}
      {open && (
        <div className='border-line-primary bg-canvas-primary mt-1 rounded-md border shadow-lg'>
          {projects.length === 0 ? (
            <div className='px-3 py-4 text-center'>
              <p className='text-fg-muted text-xs'>프로젝트가 없습니다</p>
              <Link
                href='/projects'
                className='text-accent-primary mt-1 inline-flex items-center gap-1 text-xs hover:underline'
                onClick={() => setOpen(false)}
              >
                프로젝트 만들기
                <ExternalLink className='size-3' />
              </Link>
            </div>
          ) : (
            <>
              <ScrollArea className='max-h-48'>
                <div className='flex flex-col p-1'>
                  {projects.map((project) => {
                    const isSelected =
                      currentProject?.project_id === project.project_id;
                    return (
                      <button
                        key={project.project_id}
                        onClick={() => handleSelect(project)}
                        className={cn(
                          'flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors',
                          isSelected
                            ? 'bg-accent-primary/10 text-accent-primary'
                            : 'text-fg-secondary hover:bg-canvas-surface',
                        )}
                      >
                        <Check
                          className={cn(
                            'size-3 shrink-0',
                            isSelected ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <span className='truncate'>{project.name}</span>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
              <div className='border-line-primary border-t p-1'>
                <Link
                  href='/projects'
                  className='text-fg-muted hover:bg-canvas-surface flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition-colors'
                  onClick={() => setOpen(false)}
                >
                  <ExternalLink className='size-3' />
                  프로젝트 관리
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
