'use client';

import { ChatInput } from '@/components/chat/ChatInput';
import { MessageRenderer } from '@/components/chat/MessageRenderer';
import { PromptSuggestions } from '@/components/chat/PromptSuggestions';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';
import { streamAgentChat } from '@/services/agent-service';
import type { ChatMessage } from '@/stores/chat-store';
import { useChatStore } from '@/stores/chat-store';
import { LayoutMode, usePanelStore } from '@/stores/panel-store';
import { useProjectStore } from '@/stores/project-store';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef } from 'react';

const EMPTY_MESSAGES: ChatMessage[] = [];

export function ChatArea() {
  const fullWidthMode = usePanelStore((s) => s.fullWidthMode);
  const setRightPanelPreset = usePanelStore((s) => s.setRightPanelPreset);
  const currentProject = useProjectStore((s) => s.currentProject);

  const inputValue = useChatStore((s) => s.inputValue);
  const setInputValue = useChatStore((s) => s.setInputValue);
  const activeThreadId = useChatStore((s) => s.activeThreadId);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const createThread = useChatStore((s) => s.createThread);
  const addMessage = useChatStore((s) => s.addMessage);
  const appendToLastAssistant = useChatStore((s) => s.appendToLastAssistant);
  const setStreaming = useChatStore((s) => s.setStreaming);

  const messages = useChatStore(
    (s) => s.threads.find((t) => t.id === s.activeThreadId)?.messages ?? EMPTY_MESSAGES,
  );
  const hasMessages = messages.length > 0;

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const lastUserMsgIdRef = useRef<string | null>(null);

  useScrollDirection(scrollRef);

  // 새 사용자 메시지 → 상단으로 스크롤 / 그 외 → 하단으로 스크롤
  useEffect(() => {
    if (!scrollRef.current) return;

    const lastUserMsg = messages.findLast((m) => m.role === 'user');

    if (lastUserMsg && lastUserMsg.id !== lastUserMsgIdRef.current) {
      lastUserMsgIdRef.current = lastUserMsg.id;
      requestAnimationFrame(() => {
        const el = scrollRef.current?.querySelector(
          `[data-message-id="${lastUserMsg.id}"]`,
        );
        if (el) {
          el.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
      });
    } else {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isStreaming]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !currentProject || isStreaming) return;

      // 1. 세션이 없으면 생성
      let threadId = activeThreadId;
      if (!threadId) {
        threadId = createThread(currentProject.project_id, text);
        // 우패널 오픈 (대화 시작 시)
        setRightPanelPreset(LayoutMode.SPLIT);
      }

      // 2. 사용자 메시지 추가
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      };
      addMessage(threadId, userMsg);
      setInputValue('');

      // 3. 어시스턴트 빈 메시지 추가 (스트리밍용)
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };
      addMessage(threadId, assistantMsg);
      setStreaming(true);

      // 4. SSE 스트리밍 시작
      const history = (useChatStore.getState().getActiveThread()?.messages ?? [])
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(0, -2) // 방금 추가한 두 메시지 제외
        .map((m) => ({ role: m.role, content: m.content }));

      const abort = streamAgentChat(
        {
          project_id: currentProject.project_id,
          message: text,
          history,
        },
        {
          onToken: (token) => {
            appendToLastAssistant(threadId!, token);
          },
          onDone: () => {
            setStreaming(false);
          },
          onError: (error) => {
            appendToLastAssistant(threadId!, `\n\n⚠️ ${error}`);
            setStreaming(false);
          },
        },
      );

      abortRef.current = abort;
    },
    [
      currentProject,
      isStreaming,
      activeThreadId,
      createThread,
      addMessage,
      setInputValue,
      appendToLastAssistant,
      setStreaming,
      setRightPanelPreset,
    ],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.();
  }, []);

  // Handlers for structured messages
  const handleClarifyAnswer = useCallback(
    (answer: string) => {
      sendMessage(answer);
    },
    [sendMessage],
  );

  const handleAcceptRequirements = useCallback(
    (reqs: { type: string; text: string }[]) => {
      // TODO: 요구사항을 RequirementsArtifact에 추가하는 로직
      const summary = reqs.map((r) => `[${r.type.toUpperCase()}] ${r.text}`).join('\n');
      sendMessage(`다음 요구사항을 반영했습니다:\n${summary}\n\n계속 진행해주세요.`);
    },
    [sendMessage],
  );

  const handleConfirmGenerateSrs = useCallback(() => {
    sendMessage('SRS 문서 생성을 시작해주세요.');
  }, [sendMessage]);

  const maxW = fullWidthMode ? 'max-w-[896px]' : 'max-w-[768px]';

  return (
    <div className='flex flex-1 flex-col overflow-hidden'>
      <AnimatePresence mode='wait'>
        {!hasMessages ? (
          /* === 빈 화면: 중앙 프롬프트 === */
          <motion.div
            key='empty'
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
            className='flex flex-1 flex-col justify-start px-4 pt-[12vh]'
          >
            <div className={cn('mx-auto w-full transition-[max-width] duration-300', maxW)}>
              <div className='flex justify-center py-4'>
                <h1 className='text-fg-primary flex items-center justify-center text-4xl font-bold'>
                  {['A', 'I', 'S', 'E', '\u00A0', '3', '.', '0'].map((char, i) => (
                    <motion.span
                      key={i}
                      className='inline-block'
                      animate={{ y: [0, -6, 0] }}
                      transition={{
                        duration: 0.4,
                        repeat: Infinity,
                        repeatDelay: 5,
                        delay: i * 0.1,
                      }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </h1>
              </div>

              {!currentProject && (
                <div className='text-fg-muted mb-4 text-center text-sm'>
                  사이드바에서 프로젝트를 선택하면 AI 어시스턴트와 대화를 시작할 수 있습니다.
                </div>
              )}

              <ChatInput onSubmit={sendMessage} disabled={!currentProject} />
              <div className='flex flex-col items-center justify-center text-xs/5 tracking-normal'>
                <div className='text-muted-foreground'>
                  AISE can make mistakes. Check important info.
                </div>
              </div>
              <PromptSuggestions rows={1} onSelect={setInputValue} />
            </div>
          </motion.div>
        ) : (
          /* === 대화 모드: 메시지 + 하단 입력 === */
          <motion.div
            key='chat'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
            className='flex flex-1 flex-col overflow-hidden'
          >
            {/* 메시지 영역 */}
            <div ref={scrollRef} className='flex-1 overflow-y-auto px-4 py-4'>
              <div className={cn('mx-auto', maxW)}>
                <MessageRenderer
                  messages={messages}
                  isStreaming={isStreaming}
                  onClarifyAnswer={handleClarifyAnswer}
                  onAcceptRequirements={handleAcceptRequirements}
                  onConfirmGenerateSrs={handleConfirmGenerateSrs}
                />
              </div>
            </div>

            {/* 하단 입력 */}
            <div className='shrink-0 border-t border-transparent px-4 pt-2 pb-4'>
              <div className={cn('mx-auto', maxW)}>
                <ChatInput onSubmit={sendMessage} disabled={!currentProject} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
