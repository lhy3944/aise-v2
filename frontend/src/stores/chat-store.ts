import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** 구조화된 데이터 (clarify, requirements, generate_srs) */
  toolData?: {
    type: 'clarify' | 'requirements' | 'generate_srs';
    data: unknown;
  } | null;
  createdAt: string;
}

export interface Thread {
  id: string;
  title: string;
  projectId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ChatState {
  threads: Thread[];
  activeThreadId: string | null;
  inputValue: string;
  isStreaming: boolean;

  setActiveThread: (id: string | null) => void;
  createThread: (projectId: string, firstMessage?: string) => string;
  deleteThread: (id: string) => void;
  setInputValue: (val: string) => void;
  setStreaming: (v: boolean) => void;

  addMessage: (threadId: string, message: ChatMessage) => void;
  appendToLastAssistant: (threadId: string, token: string) => void;
  updateLastAssistantMessage: (threadId: string, updater: (msg: ChatMessage) => ChatMessage) => void;

  getActiveThread: () => Thread | null;
  getThreadsForProject: (projectId: string) => Thread[];
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      threads: [],
      activeThreadId: null,
      inputValue: '',
      isStreaming: false,

      setActiveThread: (id) => set({ activeThreadId: id }),

      createThread: (projectId, firstMessage) => {
        const id = `thread-${Date.now()}`;
        const thread: Thread = {
          id,
          title: firstMessage?.slice(0, 40) || '새 대화',
          projectId,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({
          threads: [thread, ...s.threads],
          activeThreadId: id,
        }));
        return id;
      },

      deleteThread: (id) =>
        set((s) => ({
          threads: s.threads.filter((t) => t.id !== id),
          activeThreadId: s.activeThreadId === id ? null : s.activeThreadId,
        })),

      setInputValue: (val) => set({ inputValue: val }),
      setStreaming: (v) => set({ isStreaming: v }),

      addMessage: (threadId, message) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId
              ? { ...t, messages: [...t.messages, message], updatedAt: new Date().toISOString() }
              : t,
          ),
        })),

      appendToLastAssistant: (threadId, token) =>
        set((s) => ({
          threads: s.threads.map((t) => {
            if (t.id !== threadId) return t;
            const msgs = [...t.messages];
            const last = msgs[msgs.length - 1];
            if (last?.role === 'assistant') {
              msgs[msgs.length - 1] = { ...last, content: last.content + token };
            }
            return { ...t, messages: msgs };
          }),
        })),

      updateLastAssistantMessage: (threadId, updater) =>
        set((s) => ({
          threads: s.threads.map((t) => {
            if (t.id !== threadId) return t;
            const msgs = [...t.messages];
            const last = msgs[msgs.length - 1];
            if (last?.role === 'assistant') {
              msgs[msgs.length - 1] = updater(last);
            }
            return { ...t, messages: msgs };
          }),
        })),

      getActiveThread: () => {
        const { threads, activeThreadId } = get();
        return threads.find((t) => t.id === activeThreadId) ?? null;
      },

      getThreadsForProject: (projectId) => {
        return get().threads.filter((t) => t.projectId === projectId);
      },
    }),
    {
      name: 'aise-chat',
      partialize: (s) => ({
        threads: s.threads.map((t) => ({
          ...t,
          // 최근 50개 메시지만 persist
          messages: t.messages.slice(-50),
        })),
        activeThreadId: s.activeThreadId,
      }),
    },
  ),
);
