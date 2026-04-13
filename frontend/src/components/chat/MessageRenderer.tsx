'use client';

import { ExtractedRequirements } from '@/components/chat/ExtractedRequirements';
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

interface RequirementData {
  type: string;
  text: string;
  reason: string;
}

// [CLARIFY] 블록 — 코드펜스 래핑 및 직접 사용 모두 지원
const CLARIFY_BLOCK_RE =
  /```[\w]*\s*\[CLARIFY\]\s*([\s\S]*?)\s*\[\/CLARIFY\]\s*```|\[CLARIFY\]\s*([\s\S]*?)\s*\[\/CLARIFY\]/g;

// [REQUIREMENTS] 블록 — 동일 패턴
const REQUIREMENTS_BLOCK_RE =
  /```[\w]*\s*\[REQUIREMENTS\]\s*([\s\S]*?)\s*\[\/REQUIREMENTS\]\s*```|\[REQUIREMENTS\]\s*([\s\S]*?)\s*\[\/REQUIREMENTS\]/g;

interface ParsedBlocks {
  clarifyItems: QuestionData[];
  requirementItems: RequirementData[];
  cleanContent: string;
}

function parseStructuredBlocks(content: string): ParsedBlocks {
  const clarifyItems: QuestionData[] = [];
  const requirementItems: RequirementData[] = [];
  let cleanContent = content;

  // CLARIFY 블록 파싱
  for (const match of content.matchAll(CLARIFY_BLOCK_RE)) {
    const jsonStr = match[1] ?? match[2];
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        clarifyItems.push(...(parsed as QuestionData[]));
      } else {
        clarifyItems.push(parsed as QuestionData);
      }
    } catch {
      // JSON 파싱 실패 시 무시
    }
    cleanContent = cleanContent.replace(match[0], '');
  }

  // REQUIREMENTS 블록 파싱
  for (const match of content.matchAll(REQUIREMENTS_BLOCK_RE)) {
    const jsonStr = match[1] ?? match[2];
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        requirementItems.push(...(parsed as RequirementData[]));
      }
    } catch {
      // JSON 파싱 실패 시 무시
    }
    cleanContent = cleanContent.replace(match[0], '');
  }

  return { clarifyItems, requirementItems, cleanContent: cleanContent.trim() };
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

  // 스트리밍 중이 아닐 때만 구조화 블록 파싱 (스트리밍 중에는 불완전한 JSON일 수 있음)
  const parsed = useMemo(() => {
    if (isUser || (isLast && isStreaming))
      return { clarifyItems: [], requirementItems: [], cleanContent: message.content };
    return parseStructuredBlocks(message.content);
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

            {/* REQUIREMENTS 요구사항 카드 */}
            {parsed.requirementItems.length > 0 && (
              <ExtractedRequirements
                requirements={parsed.requirementItems}
                onAccept={() => {
                  // TODO: 수락된 요구사항을 레코드 스토어에 반영
                }}
              />
            )}

            {/* CLARIFY 질문지 */}
            {parsed.clarifyItems.length > 0 && onSendMessage && (
              <Questionnaire questions={parsed.clarifyItems} onSubmit={onSendMessage} />
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
