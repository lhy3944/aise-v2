'use client';

import { ChatInput } from '@/components/chat/ChatInput';
import { MessageRenderer } from '@/components/chat/MessageRenderer';
import { PromptSuggestions } from '@/components/chat/PromptSuggestions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { streamAgentChat } from '@/services/agent-service';
import { recordService } from '@/services/record-service';
import { sessionService } from '@/services/session-service';
import { useArtifactStore } from '@/stores/artifact-store';
import type { ChatMessage, ToolCallData } from '@/stores/chat-store';
import { useChatStore } from '@/stores/chat-store';
import { LayoutMode, usePanelStore } from '@/stores/panel-store';
import { useProjectStore } from '@/stores/project-store';
import { useRecordStore } from '@/stores/record-store';
import { ArrowDown, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const EMPTY_MESSAGES: ChatMessage[] = [];

interface ChatAreaProps {
  sessionId?: string;
}

export function ChatArea({ sessionId }: ChatAreaProps) {
  const router = useRouter();
  const fullWidthMode = usePanelStore((s) => s.fullWidthMode);
  const setRightPanelPreset = usePanelStore((s) => s.setRightPanelPreset);
  const currentProject = useProjectStore((s) => s.currentProject);

  const setInputValue = useChatStore((s) => s.setInputValue);
  const addMessage = useChatStore((s) => s.addMessage);
  const appendToLastAssistant = useChatStore((s) => s.appendToLastAssistant);
  const setMessages = useChatStore((s) => s.setMessages);
  const setSessionStreaming = useChatStore((s) => s.setSessionStreaming);

  const messages = useChatStore(
    (s) => (sessionId ? s.sessionMessages[sessionId] : undefined) ?? EMPTY_MESSAGES,
  );
  const isStreaming = useChatStore((s) =>
    sessionId ? s.streamingSessionIds.has(sessionId) : false,
  );
  const hasMessages = messages.length > 0;

  const scrollRef = useRef<HTMLDivElement>(null);
  const currentTurnRef = useRef<HTMLElement>(null);
  const abortControllersRef = useRef<Map<string, () => void>>(new Map());
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(
    // sessionId가 있고 캐시가 없으면 로딩 상태로 시작 (빈 화면 깜빡임 방지)
    () => !!sessionId && !useChatStore.getState().sessionMessages[sessionId],
  );
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // sessionId 변경 시 로딩 상태 동기화 (effect 내 동기 setState 대신 렌더 중 조정)
  const prevSessionIdRef = useRef(sessionId);
  if (prevSessionIdRef.current !== sessionId) {
    prevSessionIdRef.current = sessionId;
    const needsLoading = !!sessionId && !useChatStore.getState().sessionMessages[sessionId];
    if (needsLoading !== isLoadingMessages) {
      setIsLoadingMessages(needsLoading);
    }
  }

  // Record store
  const setExtracting = useRecordStore((s) => s.setExtracting);
  const setCandidates = useRecordStore((s) => s.setCandidates);
  const setExtractError = useRecordStore((s) => s.setExtractError);
  const setActiveTab = useArtifactStore((s) => s.setActiveTab);

  const BOTTOM_THRESHOLD = 80;

  // 턴 기반 메시지 분리: 스트리밍 중 → 과거 메시지 + 현재 턴(질문+답변)
  // 스트리밍 종료 → 전체를 일반 리스트로 렌더
  const { pastMessages, currentTurn } = useMemo(() => {
    if (!isStreaming || messages.length < 2) {
      return { pastMessages: messages, currentTurn: null };
    }
    const last = messages[messages.length - 1];
    const secondLast = messages[messages.length - 2];
    if (secondLast.role === 'user' && last.role === 'assistant') {
      return {
        pastMessages: messages.slice(0, -2),
        currentTurn: { question: secondLast, answer: last },
      };
    }
    return { pastMessages: messages, currentTurn: null };
  }, [messages, isStreaming]);

  // 현재 턴 섹션의 min-height를 스크롤 뷰포트 높이로 설정
  // → 질문이 상단에 anchor, 답변이 남은 공간을 채움
  useLayoutEffect(() => {
    const viewport = scrollRef.current;
    const turnEl = currentTurnRef.current;
    if (!viewport || !turnEl) return;

    const update = () => {
      turnEl.style.minHeight = `${viewport.clientHeight}px`;
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(viewport);
    return () => ro.disconnect();
  }, [!!currentTurn]);

  // 세션 메시지 로드
  useEffect(() => {
    if (!sessionId) return;
    // 이미 캐시에 있으면 스킵
    const cached = useChatStore.getState().sessionMessages[sessionId];
    if (cached) return;

    let cancelled = false;
    sessionService
      .get(sessionId)
      .then((detail) => {
        if (cancelled) return;
        const msgs: ChatMessage[] = detail.messages.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          toolCalls: m.tool_calls?.map((tc) => ({
            name: tc.name,
            arguments: tc.arguments,
            state: 'completed' as const,
          })),
          toolData: m.tool_data ? { type: 'requirements' as const, data: m.tool_data } : undefined,
          createdAt: m.created_at,
        }));
        setMessages(sessionId, msgs);
        setIsLoadingMessages(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoadingMessages(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, setMessages]);

  // Scroll position tracking
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsAtBottom(distanceFromBottom <= BOTTOM_THRESHOLD);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Auto-scroll only when user is at bottom
  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAtBottom]);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, []);

  // 레코드 추출 실행
  const triggerExtractRecords = useCallback(
    async (projectId: string, sid: string) => {
      setExtracting(true);
      setActiveTab('records');
      setRightPanelPreset(LayoutMode.SPLIT);
      const updateLast = useChatStore.getState().updateLastAssistantMessage;
      try {
        const result = await recordService.extract(projectId);
        setCandidates(result.candidates);
        updateLast(sid, (msg) => ({
          ...msg,
          toolCalls: msg.toolCalls?.map((tc) =>
            tc.name === 'extract_records'
              ? {
                  ...tc,
                  state: 'completed' as const,
                  result: `${result.candidates.length}개 후보 추출`,
                }
              : tc,
          ),
        }));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '레코드 추출 실패';
        setExtractError(errorMsg);
        updateLast(sid, (msg) => ({
          ...msg,
          toolCalls: msg.toolCalls?.map((tc) =>
            tc.name === 'extract_records'
              ? { ...tc, state: 'error' as const, error: errorMsg }
              : tc,
          ),
        }));
      }
    },
    [setExtracting, setCandidates, setExtractError, setActiveTab, setRightPanelPreset],
  );

  // Tool call 실행 디스패처
  const executeToolCall = useCallback(
    (sid: string, name: string, _args: Record<string, unknown>) => {
      if (!currentProject) return;
      switch (name) {
        case 'extract_records':
          triggerExtractRecords(currentProject.project_id, sid);
          break;
        case 'generate_srs':
          // TODO: SRS 생성 연동
          break;
      }
    },
    [currentProject, triggerExtractRecords],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !currentProject || (sessionId && isStreaming)) return;

      let activeSessionId = sessionId;

      // 세션이 없으면 서버에서 생성 → URL 변경
      if (!activeSessionId) {
        setIsCreatingSession(true);
        try {
          const newSession = await sessionService.create(
            currentProject.project_id,
            text.slice(0, 40),
          );
          activeSessionId = newSession.id;
          setRightPanelPreset(LayoutMode.SPLIT);
          useChatStore.getState().bumpSessionListNonce();
          // URL 변경 (replace로 뒤로가기 시 빈 /agent로 안 돌아감)
          router.replace(`/agent/${activeSessionId}`);
        } catch {
          setIsCreatingSession(false);
          return;
        }
      }

      // UI에 user 메시지 즉시 추가
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      };
      addMessage(activeSessionId, userMsg);
      setInputValue('');

      // 빈 assistant 메시지 추가 (스트리밍용)
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };
      addMessage(activeSessionId, assistantMsg);
      setSessionStreaming(activeSessionId, true);

      const updateLastAssistant = useChatStore.getState().updateLastAssistantMessage;

      const abort = streamAgentChat(
        {
          session_id: activeSessionId,
          message: text,
        },
        {
          onToken: (token) => {
            appendToLastAssistant(activeSessionId!, token);
          },
          onToolCall: (toolCall) => {
            const tc: ToolCallData = {
              name: toolCall.name,
              arguments: toolCall.arguments,
              state: 'running',
            };
            updateLastAssistant(activeSessionId!, (msg) => ({
              ...msg,
              toolCalls: [...(msg.toolCalls ?? []), tc],
            }));
            executeToolCall(activeSessionId!, toolCall.name, toolCall.arguments);
          },
          onDone: () => {
            setSessionStreaming(activeSessionId!, false);
          },
          onError: (error) => {
            appendToLastAssistant(activeSessionId!, `\n\n⚠️ ${error}`);
            setSessionStreaming(activeSessionId!, false);
          },
        },
      );

      abortControllersRef.current.set(activeSessionId, abort);
    },
    [
      currentProject,
      sessionId,
      isStreaming,
      addMessage,
      setInputValue,
      appendToLastAssistant,
      setSessionStreaming,
      setRightPanelPreset,
      executeToolCall,
      router,
    ],
  );

  // 스트리밍 중지
  const stopStreaming = useCallback(() => {
    if (!sessionId) return;
    abortControllersRef.current.get(sessionId)?.();
    abortControllersRef.current.delete(sessionId);
    setSessionStreaming(sessionId, false);
  }, [sessionId, setSessionStreaming]);

  // Cleanup on unmount — abort only the current session's stream
  useEffect(() => {
    const controllers = abortControllersRef.current;
    return () => {
      if (sessionId) {
        controllers.get(sessionId)?.();
        controllers.delete(sessionId);
      }
    };
  }, [sessionId]);

  const maxW = fullWidthMode ? 'max-w-[896px]' : 'max-w-[768px]';

  return (
    <div className='flex flex-1 flex-col overflow-hidden'>
      <AnimatePresence mode='wait'>
        {isCreatingSession ? (
          /* === 세션 생성 중: 스피너 === */
          <motion.div
            key='creating'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className='flex flex-1 flex-col items-center justify-center gap-3'
          >
            <Loader2 className='text-fg-muted size-8 animate-spin' />
            <p className='text-fg-muted text-sm'>세션을 시작하는 중...</p>
          </motion.div>
        ) : !hasMessages && !isLoadingMessages ? (
          /* === 빈 화면: 중앙 프롬프트 === */
          <motion.div
            key='empty'
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
            className='flex flex-1 flex-col justify-start px-4 pt-[4vh] sm:pt-[12vh]'
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
                  프로젝트를 선택하면 에이전트와 대화를 시작할 수 있습니다.
                </div>
              )}

              <div className='mt-4'>
                <ChatInput
                  onSubmit={sendMessage}
                  onAction={sendMessage}
                  onStop={stopStreaming}
                  isStreaming={isStreaming}
                  disabled={!currentProject}
                />
              </div>
              <div className='flex flex-col items-center justify-center text-xs/5 tracking-normal'>
                <div className='text-muted-foreground'>
                  AISE can make mistakes. Check important info.
                </div>
              </div>
              <PromptSuggestions rows={1} onSelect={setInputValue} />
            </div>
          </motion.div>
        ) : (
          /* === 대화 모드: 상단 메시지 + 하단 여백 + 고정 입력 === */
          <motion.div
            key='chat'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
            className='flex flex-1 flex-col overflow-hidden'
          >
            {/* 메시지 영역 — 하단 여백으로 새 메시지가 뷰포트 상단에 위치 */}
            <div className='relative flex-1 overflow-hidden'>
              <ScrollArea className='h-full' viewportRef={scrollRef}>
                <div className={cn('mx-auto px-6 pt-6 transition-[max-width] duration-300', maxW)}>
                  {/* 과거 완료된 턴들 — 일반 리스트 */}
                  {pastMessages.length > 0 && (
                    <MessageRenderer
                      messages={pastMessages}
                      isStreaming={!currentTurn && isStreaming}
                    />
                  )}

                  {/* 현재 턴 — 질문이 anchor, 답변이 남은 viewport를 채움 */}
                  {currentTurn && (
                    <section
                      ref={currentTurnRef}
                      className={cn(
                        'flex flex-col gap-6',
                        pastMessages.length > 0 && 'mt-6',
                      )}
                    >
                      <div className='shrink-0'>
                        <MessageRenderer
                          messages={[currentTurn.question]}
                          isStreaming={false}
                        />
                      </div>
                      <div className='min-h-0 flex-1'>
                        <MessageRenderer
                          messages={[currentTurn.answer]}
                          isStreaming
                        />
                      </div>
                    </section>
                  )}
                </div>
              </ScrollArea>

              {/* Scroll to bottom floating button */}
              <AnimatePresence>
                {!isAtBottom && hasMessages && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    onClick={scrollToBottom}
                    className='bg-canvas-surface border-line-primary text-fg-secondary hover:text-fg-primary absolute bottom-3 left-1/2 -translate-x-1/2 cursor-pointer rounded-full border p-2 shadow-md transition-colors'
                    aria-label='하단으로 스크롤'
                  >
                    <ArrowDown className='size-4' />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* 하단 고정 입력 */}
            <div className='shrink-0 px-4 pt-2 pb-4'>
              <div className={cn('mx-auto transition-[max-width] duration-300', maxW)}>
                <ChatInput
                  onSubmit={sendMessage}
                  onAction={sendMessage}
                  onStop={stopStreaming}
                  isStreaming={isStreaming}
                  disabled={!currentProject}
                  autoFocus={false}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
