import { api } from '@/lib/api';
import type {
  GlossaryCreate,
  GlossaryGenerateResponse,
  GlossaryItem,
  GlossaryListResponse,
  GlossaryUpdate,
} from '@/types/project';

function base(projectId: string) {
  return `/api/v1/projects/${projectId}/glossary`;
}

export const glossaryService = {
  list: (projectId: string) => api.get<GlossaryListResponse>(base(projectId)),

  create: (projectId: string, data: GlossaryCreate) =>
    api.post<GlossaryItem>(base(projectId), data),

  update: (projectId: string, glossaryId: string, data: GlossaryUpdate) =>
    api.put<GlossaryItem>(`${base(projectId)}/${glossaryId}`, data),

  delete: (projectId: string, glossaryId: string) =>
    api.delete<void>(`${base(projectId)}/${glossaryId}`),

  generate: (projectId: string) =>
    api.post<GlossaryGenerateResponse>(`${base(projectId)}/generate`),
};
