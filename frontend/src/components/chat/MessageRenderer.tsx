'use client';

import { Questionnaire, type QuestionData } from '@/components/chat/Questionnaire';
import {
  Message,
  MessageActions,
  MessageBubble,
  MessageContent,
  MessageResponse,
} from '@/components/ui/ai-elements/message';
import { Shimmer } from '@/components/ui/ai-elements/shimmer';
import { ToolCall } from '@/components/ui/ai-elements/tool-call';
import { Spinner } from '@/components/ui/spinner';
import type { ChatMessage } from '@/stores/chat-store';
import { useMemo } from 'react';

interface MessageRendererProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSendMessage?: (text: string) => void;
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  extract_records: '레코드 추출',
  generate_srs: 'SRS 문서 생성',
};

/* ── 구조화 블록 파싱 ── */

// [CLARIFY]{json}[/CLARIFY] 블록을 모두 추출하고 본문에서 제거
// 코드펜스(```...```)로 감싸진 경우도 함께 제거
// 배열 형식과 단일 객체 형식 모두 지원 (하위 호환)
const CLARIFY_BLOCK_RE =
  /```[\w]*\s*\[CLARIFY\]\s*([\s\S]*?)\s*\[\/CLARIFY\]\s*```|\[CLARIFY\]\s*([\s\S]*?)\s*\[\/CLARIFY\]/g;

function parseClarifyBlocks(content: string): {
  items: QuestionData[];
  cleanContent: string;
} {
  const items: QuestionData[] = [];
  let cleanContent = content;

  for (const match of content.matchAll(CLARIFY_BLOCK_RE)) {
    const jsonStr = match[1] ?? match[2];
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        items.push(...(parsed as QuestionData[]));
      } else {
        items.push(parsed as QuestionData);
      }
    } catch {
      // JSON 파싱 실패 시 무시
    }
    cleanContent = cleanContent.replace(match[0], '');
  }

  return { items, cleanContent: cleanContent.trim() };
}

/* ── Message Item ── */

function MessageItem({
  message,
  isLast,
  isStreaming,
  onSendMessage,
}: {
  message: ChatMessage;
  isLast: boolean;
  isStreaming: boolean;
  onSendMessage?: (text: string) => void;
}) {
  const isUser = message.role === 'user';
  const showCursor = isLast && isStreaming && !isUser;

  // 스트리밍 중이 아닐 때만 CLARIFY 블록 파싱 (스트리밍 중에는 불완전한 JSON일 수 있음)
  const parsed = useMemo(() => {
    if (isUser || (isLast && isStreaming)) return { items: [], cleanContent: message.content };
    return parseClarifyBlocks(message.content);
  }, [message.content, isUser, isLast, isStreaming]);

  const displayContent = parsed.cleanContent;

  return (
    <Message from={message.role}>
      <MessageContent from={message.role}>
        {isUser ? (
          <MessageBubble>{message.content}</MessageBubble>
        ) : (
          <>
            {/* 스트림 응답 대기 중 shimmer */}
            {showCursor && !message.content && (
              <div className='flex items-center gap-2'>
                <Spinner className='size-4' />
                <Shimmer className='text-sm' duration={1.5} spread={1.5}>
                  응답을 생성하고 있습니다...
                </Shimmer>
              </div>
            )}

            {/* 텍스트 응답 (마크다운) */}
            {displayContent && (
              <MessageResponse streaming={showCursor && !!displayContent} className='w-full'>
                {displayContent}
              </MessageResponse>
            )}

            {/* Tool Calls */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className='w-full'>
                {message.toolCalls.map((tc, i) => (
                  <ToolCall
                    key={i}
                    name={TOOL_DISPLAY_NAMES[tc.name] ?? tc.name}
                    state={tc.state}
                    input={Object.keys(tc.arguments).length > 0 ? tc.arguments : undefined}
                    output={tc.result}
                    error={tc.error}
                  />
                ))}
              </div>
            )}

            {/* CLARIFY 질문지 */}
            {parsed.items.length > 0 && onSendMessage && (
              <Questionnaire questions={parsed.items} onSubmit={onSendMessage} />
            )}

            {/* 액션 (복사 등) — 스트리밍 아닐 때만 */}
            {!showCursor && displayContent && <MessageActions content={displayContent} />}
          </>
        )}
      </MessageContent>
    </Message>
  );
}

export function MessageRenderer({ messages, isStreaming, onSendMessage }: MessageRendererProps) {
  if (messages.length === 0) return null;

  return (
    <div className='flex flex-col gap-6'>
      {messages.map((msg, i) => (
        <MessageItem
          key={msg.id}
          message={msg}
          isLast={i === messages.length - 1}
          isStreaming={isStreaming}
          onSendMessage={onSendMessage}
        />
      ))}
    </div>
  );
}
