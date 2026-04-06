import { api } from '@/lib/api';
import type {
  Record,
  RecordCreate,
  RecordExtractResponse,
  RecordListResponse,
  RecordStatus,
  RecordUpdate,
} from '@/types/project';

function base(projectId: string) {
  return `/api/v1/projects/${projectId}/records`;
}

export const recordService = {
  list: (projectId: string, sectionId?: string) => {
    const query = sectionId ? `?section_id=${sectionId}` : '';
    return api.get<RecordListResponse>(`${base(projectId)}${query}`);
  },

  create: (projectId: string, data: RecordCreate) =>
    api.post<Record>(base(projectId), data),

  update: (projectId: string, recordId: string, data: RecordUpdate) =>
    api.put<Record>(`${base(projectId)}/${recordId}`, data),

  updateStatus: (projectId: string, recordId: string, status: RecordStatus) =>
    api.patch<Record>(`${base(projectId)}/${recordId}/status`, { status }),

  delete: (projectId: string, recordId: string) =>
    api.delete<void>(`${base(projectId)}/${recordId}`),

  reorder: (projectId: string, orderedIds: string[]) =>
    api.put<{ updated_count: number }>(`${base(projectId)}/reorder`, { ordered_ids: orderedIds }),

  /** 지식 문서 기반 레코드 추출 (전체 또는 특정 섹션) */
  extract: (projectId: string, sectionId?: string) => {
    const query = sectionId ? `?section_id=${sectionId}` : '';
    return api.post<RecordExtractResponse>(`${base(projectId)}/extract${query}`);
  },

  /** 추출된 레코드 후보 일괄 승인 저장 */
  approve: (projectId: string, items: RecordCreate[]) =>
    api.post<RecordListResponse>(`${base(projectId)}/approve`, { items }),
};
