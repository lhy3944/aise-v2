'use client';

import {
  Message,
  MessageBubble,
  MessageContent,
  MessageResponse,
  MessageActions,
} from '@/components/ui/ai-elements/message';
import { ToolCall } from '@/components/ui/ai-elements/tool-call';
import type { ChatMessage } from '@/stores/chat-store';

interface MessageRendererProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  extract_records: '레코드 추출',
  generate_srs: 'SRS 문서 생성',
};

function MessageItem({
  message,
  isLast,
  isStreaming,
}: {
  message: ChatMessage;
  isLast: boolean;
  isStreaming: boolean;
}) {
  const isUser = message.role === 'user';
  const showCursor = isLast && isStreaming && !isUser;

  return (
    <Message from={message.role}>
      <MessageContent from={message.role}>
        {isUser ? (
          <MessageBubble>{message.content}</MessageBubble>
        ) : (
          <>
            {/* 텍스트 응답 (마크다운) */}
            <MessageResponse streaming={showCursor}>
              {message.content}
            </MessageResponse>

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

            {/* 액션 (복사 등) — 스트리밍 아닐 때만 */}
            {!showCursor && message.content && (
              <MessageActions content={message.content} />
            )}
          </>
        )}
      </MessageContent>
    </Message>
  );
}

export function MessageRenderer({ messages, isStreaming }: MessageRendererProps) {
  if (messages.length === 0) return null;

  return (
    <div className='flex flex-col gap-6'>
      {messages.map((msg, i) => (
        <MessageItem
          key={msg.id}
          message={msg}
          isLast={i === messages.length - 1}
          isStreaming={isStreaming}
        />
      ))}
    </div>
  );
}
