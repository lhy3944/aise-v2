import { api } from '@/lib/api';
import type {
  Section,
  SectionCreate,
  SectionListResponse,
  SectionReorderRequest,
  SectionUpdate,
  RequirementType,
} from '@/types/project';

function base(projectId: string) {
  return `/api/v1/projects/${projectId}/requirement-sections`;
}

export const sectionService = {
  list: (projectId: string, type?: RequirementType) => {
    const query = type ? `?type=${type}` : '';
    return api.get<SectionListResponse>(`${base(projectId)}${query}`);
  },

  create: (projectId: string, data: SectionCreate) => api.post<Section>(base(projectId), data),

  update: (projectId: string, sectionId: string, data: SectionUpdate) =>
    api.put<Section>(`${base(projectId)}/${sectionId}`, data),

  delete: (projectId: string, sectionId: string) =>
    api.delete<void>(`${base(projectId)}/${sectionId}`),

  reorder: (projectId: string, data: SectionReorderRequest) =>
    api.put<{ updated_count: number }>(`${base(projectId)}/reorder`, data),
};
