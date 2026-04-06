import { create } from 'zustand';
import type { RecordExtractedItem } from '@/types/project';

interface RecordState {
  /** 추출 중 여부 */
  extracting: boolean;
  /** 추출된 후보 목록 (승인 대기) */
  candidates: RecordExtractedItem[];
  /** 추출 에러 메시지 */
  extractError: string | null;

  setExtracting: (v: boolean) => void;
  setCandidates: (items: RecordExtractedItem[]) => void;
  clearCandidates: () => void;
  setExtractError: (msg: string | null) => void;
}

export const useRecordStore = create<RecordState>()((set) => ({
  extracting: false,
  candidates: [],
  extractError: null,

  setExtracting: (v) => set({ extracting: v }),
  setCandidates: (items) => set({ candidates: items, extracting: false, extractError: null }),
  clearCandidates: () => set({ candidates: [], extractError: null }),
  setExtractError: (msg) => set({ extractError: msg, extracting: false }),
}));
