'use client';

import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClarifyQuestion } from '@/components/chat/ClarifyQuestion';
import { ExtractedRequirements } from '@/components/chat/ExtractedRequirements';
import { GenerateSrsProposal } from '@/components/chat/GenerateSrsProposal';
import { ToolCall } from '@/components/ui/ai-elements/tool-call';
import type { ChatMessage } from '@/stores/chat-store';

interface MessageRendererProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onClarifyAnswer: (answer: string) => void;
  onAcceptRequirements: (requirements: { type: string; text: string }[]) => void;
  onConfirmGenerateSrs: () => void;
}

/** [TAG]...[/TAG] 패턴에서 구조화된 데이터를 파싱 */
function parseStructuredContent(content: string) {
  const parts: { type: 'text' | 'clarify' | 'requirements' | 'generate_srs'; data: unknown }[] =
    [];
  let remaining = content;

  const patterns = [
    { tag: 'CLARIFY', type: 'clarify' as const },
    { tag: 'REQUIREMENTS', type: 'requirements' as const },
    { tag: 'GENERATE_SRS', type: 'generate_srs' as const },
  ];

  for (const { tag, type } of patterns) {
    const openTag = `[${tag}]`;
    const closeTag = `[/${tag}]`;
    const openIdx = remaining.indexOf(openTag);
    const closeIdx = remaining.indexOf(closeTag);

    if (openIdx !== -1 && closeIdx !== -1 && closeIdx > openIdx) {
      // 태그 앞 텍스트
      const before = remaining.slice(0, openIdx).trim();
      if (before) parts.push({ type: 'text', data: before });

      // 태그 내용 파싱
      const jsonStr = remaining.slice(openIdx + openTag.length, closeIdx).trim();
      try {
        const parsed = JSON.parse(jsonStr);
        parts.push({ type, data: parsed });
      } catch {
        // JSON 파싱 실패 시 텍스트로 처리
        parts.push({ type: 'text', data: jsonStr });
      }

      // 태그 뒤 텍스트
      remaining = remaining.slice(closeIdx + closeTag.length).trim();
    }
  }

  if (remaining) parts.push({ type: 'text', data: remaining });

  return parts.length > 0 ? parts : [{ type: 'text' as const, data: content }];
}

function MessageBubble({
  message,
  isLast,
  isStreaming,
  onClarifyAnswer,
  onAcceptRequirements,
  onConfirmGenerateSrs,
}: {
  message: ChatMessage;
  isLast: boolean;
  isStreaming: boolean;
  onClarifyAnswer: (answer: string) => void;
  onAcceptRequirements: (reqs: { type: string; text: string }[]) => void;
  onConfirmGenerateSrs: () => void;
}) {
  const isUser = message.role === 'user';
  const parts = isUser ? [{ type: 'text' as const, data: message.content }] : parseStructuredContent(message.content);

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-accent-primary/10 text-accent-primary' : 'bg-canvas-surface text-fg-secondary',
        )}
      >
        {isUser ? <User className='size-4' /> : <Bot className='size-4' />}
      </div>

      {/* Content */}
      <div className={cn('flex max-w-[80%] flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
        {parts.map((part, i) => {
          if (part.type === 'text') {
            return (
              <div
                key={i}
                className={cn(
                  'rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                  isUser
                    ? 'bg-accent-primary text-white'
                    : 'bg-canvas-surface text-fg-primary',
                )}
              >
                {part.data as string}
                {isLast && isStreaming && !isUser && (
                  <span className='ml-0.5 inline-block h-4 w-1 animate-pulse rounded-full bg-current' />
                )}
              </div>
            );
          }

          if (part.type === 'clarify') {
            return (
              <ClarifyQuestion
                key={i}
                data={part.data as { question: string; options: string[]; allow_custom: boolean }}
                onAnswer={onClarifyAnswer}
              />
            );
          }

          if (part.type === 'requirements') {
            return (
              <ExtractedRequirements
                key={i}
                requirements={part.data as { type: string; text: string; reason: string }[]}
                onAccept={onAcceptRequirements}
              />
            );
          }

          if (part.type === 'generate_srs') {
            return (
              <GenerateSrsProposal
                key={i}
                data={
                  part.data as {
                    title: string;
                    summary: string;
                    requirement_count: number;
                    sections: string[];
                  }
                }
                onConfirm={onConfirmGenerateSrs}
              />
            );
          }

          return null;
        })}

        {/* Tool Calls */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
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
      </div>
    </div>
  );
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  extract_records: '레코드 추출',
  generate_srs: 'SRS 문서 생성',
};

export function MessageRenderer({
  messages,
  isStreaming,
  onClarifyAnswer,
  onAcceptRequirements,
  onConfirmGenerateSrs,
}: MessageRendererProps) {
  if (messages.length === 0) return null;

  return (
    <div className='flex flex-col gap-4'>
      {messages.map((msg, i) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isLast={i === messages.length - 1}
          isStreaming={isStreaming}
          onClarifyAnswer={onClarifyAnswer}
          onAcceptRequirements={onAcceptRequirements}
          onConfirmGenerateSrs={onConfirmGenerateSrs}
        />
      ))}
    </div>
  );
}
