'use client';

import { ChatInput } from '@/components/chat/ChatInput';
import { MessageRenderer } from '@/components/chat/MessageRenderer';
import { PromptSuggestions } from '@/components/chat/PromptSuggestions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatScroll } from '@/hooks/useChatScroll';
import { useChatStream } from '@/hooks/useChatStream';
import { useTurnLayout } from '@/hooks/useTurnLayout';
import { cn } from '@/lib/utils';
import { usePanelStore } from '@/stores/panel-store';
import { useProjectStore } from '@/stores/project-store';
import { ArrowDown, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface ChatAreaProps {
  sessionId?: string;
}

export function ChatArea({ sessionId }: ChatAreaProps) {
  const fullWidthMode = usePanelStore((s) => s.fullWidthMode);
  const currentProject = useProjectStore((s) => s.currentProject);

  const {
    messages,
    isStreaming,
    isLoadingMessages,
    isCreatingSession,
    sendMessage,
    stopStreaming,
    setInputValue,
  } = useChatStream(sessionId);

  const { scrollRef, isAtBottom, scrollToBottom } = useChatScroll(messages);
  const { pastMessages, currentTurn, currentTurnRef, answerAreaRef } =
    useTurnLayout(messages, scrollRef);

  const hasMessages = messages.length > 0;
  const showEmptyScreen =
    !hasMessages && !isLoadingMessages && !isCreatingSession;
  const maxW = fullWidthMode ? 'max-w-[896px]' : 'max-w-[768px]';

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* === 상단 영역: 로딩 / 빈 화면 / 메시지 — AnimatePresence로 전환 === */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {isCreatingSession || isLoadingMessages ? (
            /* 로딩 스피너 */
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="flex h-full items-center justify-center"
            >
              <Loader2 className="text-fg-muted size-8 animate-spin" />
            </motion.div>
          ) : showEmptyScreen ? (
            /* 빈 화면: 중앙 프롬프트 */
            <motion.div
              key="empty"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
              className="flex h-full flex-col justify-start px-4 pt-8 sm:pt-[12vh]"
            >
              <div
                className={cn(
                  'mx-auto w-full transition-[max-width] duration-300',
                  maxW,
                )}
              >
                <div className="flex justify-center py-4">
                  <h1 className="text-fg-primary flex items-center justify-center text-4xl font-bold">
                    {['A', 'I', 'S', 'E', '\u00A0', '3', '.', '0'].map(
                      (char, i) => (
                        <motion.span
                          key={i}
                          className="inline-block"
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
                      ),
                    )}
                  </h1>
                </div>

                {!currentProject && (
                  <div className="text-fg-muted mb-4 text-center text-sm">
                    프로젝트를 선택하면 에이전트와 대화를 시작할 수 있습니다.
                  </div>
                )}

                <div className="mt-4">
                  <ChatInput
                    onSubmit={sendMessage}
                    onAction={sendMessage}
                    onStop={stopStreaming}
                    isStreaming={isStreaming}
                    disabled={!currentProject}
                  />
                </div>
                <div className="flex flex-col items-center justify-center text-xs/5 tracking-normal">
                  <div className="text-muted-foreground">
                    AISE can make mistakes. Check important info.
                  </div>
                </div>
                <PromptSuggestions rows={1} onSelect={setInputValue} />
              </div>
            </motion.div>
          ) : (
            /* 대화 모드: 메시지 영역만 */
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.3 } }}
              className="relative h-full"
            >
              <ScrollArea className="h-full" viewportRef={scrollRef}>
                <div
                  className={cn(
                    'mx-auto px-4 sm:px-6 pt-6 transition-[max-width] duration-300',
                    maxW,
                  )}
                >
                  {pastMessages.length > 0 && (
                    <MessageRenderer
                      messages={pastMessages}
                      onSendMessage={sendMessage}
                    />
                  )}

                  {currentTurn && (
                    <section
                      ref={currentTurnRef}
                      className={cn(
                        'flex flex-col gap-6',
                        pastMessages.length > 0 && 'mt-6',
                      )}
                    >
                      <div className="shrink-0">
                        <MessageRenderer
                          messages={[currentTurn.question]}
                          onSendMessage={sendMessage}
                        />
                      </div>
                      <div ref={answerAreaRef}>
                        <MessageRenderer
                          messages={[currentTurn.answer]}
                          onSendMessage={sendMessage}
                        />
                      </div>
                    </section>
                  )}
                </div>
              </ScrollArea>

              {/* Scroll to bottom */}
              <AnimatePresence>
                {!isAtBottom && hasMessages && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    onClick={scrollToBottom}
                    className="bg-canvas-surface border-line-primary text-fg-secondary hover:text-fg-primary absolute bottom-3 left-1/2 -translate-x-1/2 cursor-pointer rounded-full border p-2 shadow-md transition-colors"
                    aria-label="하단으로 스크롤"
                  >
                    <ArrowDown className="size-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* === 하단 고정 입력 — AnimatePresence 바깥, 항상 유지 === */}
      {!showEmptyScreen && (
        <div className="shrink-0 px-4 pt-2 pb-4">
          <div
            className={cn('mx-auto transition-[max-width] duration-300', maxW)}
          >
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
      )}
    </div>
  );
}
