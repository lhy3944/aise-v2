import { create } from 'zustand';

export interface Thread {
  id: string;
  title: string;
}

interface ChatState {
  threads: Thread[];
  activeThreadId: string | null;
  inputValue: string;
  setActiveThread: (id: string | null) => void;
  createThread: () => void;
  setInputValue: (val: string) => void;
}

const mockThreads: Thread[] = Array.from({ length: 5 }, (_, i) => ({
  id: `thread-${i + 1}`,
  title: `스레드 히스토리 ${i + 1}`,
}));

export const useChatStore = create<ChatState>()((set) => ({
  threads: mockThreads,
  activeThreadId: null,
  inputValue: '',

  setActiveThread: (id) => set({ activeThreadId: id }),

  createThread: () =>
    set((s) => {
      const newThread: Thread = {
        id: `thread-${Date.now()}`,
        title: `새 채팅 ${s.threads.length + 1}`,
      };
      return {
        threads: [newThread, ...s.threads],
        activeThreadId: newThread.id,
      };
    }),

  setInputValue: (val) => set({ inputValue: val }),
}));
