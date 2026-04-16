'use client';

import { ExtractedRequirements } from '@/components/chat/ExtractedRequirements';
import { Questionnaire, type QuestionData } from '@/components/chat/Questionnaire';
import { SourceReference, type SourceData } from '@/components/chat/SourceReference';
import { SuggestionChips } from '@/components/chat/SuggestionChips';
import {
  Message,
  MessageActions,
  MessageBubble,
  MessageContent,
  MessageResponse,
} from '@/components/ui/ai-elements/message';
import { ToolCall } from '@/components/ui/ai-elements/tool-call';
import { WaveDots } from '@/components/ui/ai-elements/wave-dots';
import { usePanelStore } from '@/stores/panel-store';
import type { ChatMessage } from '@/stores/chat-store';
import { useCallback, useEffect, useMemo, useRef } from 'react';

interface MessageRendererProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSendMessage?: (text: string) => void;
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  extract_records: '레코드 추출',
  generate_srs: 'SRS 문서 생성',
  create_record: '레코드 생성',
  update_record: '레코드 수정',
  delete_record: '레코드 삭제',
  update_record_status: '상태 변경',
  search_records: '레코드 검색',
};

interface RequirementData {
  type: string;
  text: string;
  reason: string;
}

const CLARIFY_BLOCK_RE =
  /```[\w]*\s*\[CLARIFY\]\s*([\s\S]*?)\s*\[\/CLARIFY\]\s*```|\[CLARIFY\]\s*([\s\S]*?)\s*\[\/CLARIFY\]/g;
const REQUIREMENTS_BLOCK_RE =
  /```[\w]*\s*\[REQUIREMENTS\]\s*([\s\S]*?)\s*\[\/REQUIREMENTS\]\s*```|\[REQUIREMENTS\]\s*([\s\S]*?)\s*\[\/REQUIREMENTS\]/g;
const SUGGESTIONS_BLOCK_RE =
  /```[\w]*\s*\[SUGGESTIONS\]\s*([\s\S]*?)\s*\[\/SUGGESTIONS\]\s*```|\[SUGGESTIONS\]\s*([\s\S]*?)\s*\[\/SUGGESTIONS\]/g;
const SOURCES_BLOCK_RE =
  /```[\w]*\s*\[SOURCES\]\s*([\s\S]*?)\s*(?:\[\/SOURCES\]\s*```|\[\/SOURCES\])|\[SOURCES\]\s*([\s\S]*?)\s*(?:\[\/SOURCES\]|$)/g;

interface ParsedBlocks {
  clarifyItems: QuestionData[];
  requirementItems: RequirementData[];
  suggestions: string[];
  sources: SourceData[];
  cleanContent: string;
}

function parseStructuredBlocks(content: string): ParsedBlocks {
  const clarifyItems: QuestionData[] = [];
  const requirementItems: RequirementData[] = [];
  const suggestions: string[] = [];
  const sources: SourceData[] = [];
  let cleanContent = content;

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
      // ignore partial JSON while streaming
    }
    cleanContent = cleanContent.replace(match[0], '');
  }

  for (const match of content.matchAll(REQUIREMENTS_BLOCK_RE)) {
    const jsonStr = match[1] ?? match[2];
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        requirementItems.push(...(parsed as RequirementData[]));
      }
    } catch {
      // ignore partial JSON while streaming
    }
    cleanContent = cleanContent.replace(match[0], '');
  }

  for (const match of content.matchAll(SUGGESTIONS_BLOCK_RE)) {
    const jsonStr = match[1] ?? match[2];
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        suggestions.push(...(parsed as string[]));
      }
    } catch {
      // ignore partial JSON while streaming
    }
    cleanContent = cleanContent.replace(match[0], '');
  }

  for (const match of content.matchAll(SOURCES_BLOCK_RE)) {
    const jsonStr = match[1] ?? match[2];
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        sources.push(...(parsed as SourceData[]));
      }
    } catch {
      // ignore partial JSON while streaming
    }
    cleanContent = cleanContent.replace(match[0], '');
  }

  return {
    clarifyItems,
    requirementItems,
    suggestions,
    sources,
    cleanContent: cleanContent.trim(),
  };
}

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
  const showStreamingIndicator = isLast && isStreaming && !isUser;

  const parsed = useMemo(() => {
    if (isUser || showStreamingIndicator) {
      return {
        clarifyItems: [],
        requirementItems: [],
        suggestions: [],
        sources: [],
        cleanContent: message.content,
      };
    }
    return parseStructuredBlocks(message.content);
  }, [message.content, isUser, showStreamingIndicator]);

  const displayContent = parsed.cleanContent;
  const openSourceViewer = usePanelStore((s) => s.openSourceViewer);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el || parsed.sources.length === 0) return;

    const sourceMap = new Map(parsed.sources.map((s) => [s.ref, s]));

    el.querySelectorAll('.citation-inline').forEach((span) => {
      span.replaceWith(document.createTextNode(span.textContent || ''));
    });
    el.normalize();

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let n: Node | null;

    while ((n = walker.nextNode())) {
      if (/\[\d+\]/.test(n.textContent || '')) {
        if ((n as Text).parentElement?.closest('pre, code')) continue;
        nodes.push(n as Text);
      }
    }

    for (const textNode of nodes) {
      const text = textNode.textContent || '';
      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      let hasMatch = false;

      for (const m of text.matchAll(/\[(\d+)\]/g)) {
        const ref = parseInt(m[1], 10);
        if (!sourceMap.has(ref)) continue;
        hasMatch = true;

        if ((m.index ?? 0) > lastIdx) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx, m.index)));
        }

        const span = document.createElement('span');
        span.textContent = m[0];
        span.className = 'citation-inline';
        span.dataset.citationRef = String(ref);
        frag.appendChild(span);
        lastIdx = (m.index ?? 0) + m[0].length;
      }

      if (!hasMatch) continue;

      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      }
      textNode.parentNode?.replaceChild(frag, textNode);
    }
  }, [displayContent, parsed.sources]);

  const handleCitationClick = useCallback(
    (e: React.MouseEvent) => {
      const span = (e.target as HTMLElement).closest<HTMLElement>('[data-citation-ref]');
      if (!span) return;

      const refNum = parseInt(span.dataset.citationRef || '', 10);
      const source = parsed.sources.find((s) => s.ref === refNum);
      if (source) {
        openSourceViewer({
          documentId: source.document_id,
          documentName: source.document_name,
          chunkIndex: source.chunk_index,
          refNumber: source.ref,
          fileType: source.file_type,
        });
      }
    },
    [openSourceViewer, parsed.sources],
  );

  return (
    <Message from={message.role}>
      <MessageContent from={message.role}>
        {isUser ? (
          <MessageBubble>{message.content}</MessageBubble>
        ) : (
          <>
            {displayContent && (
              <div
                ref={contentRef}
                className='w-full min-w-0'
                onClick={parsed.sources.length > 0 ? handleCitationClick : undefined}
              >
                <MessageResponse streaming={showStreamingIndicator && !!displayContent} className='w-full'>
                  {displayContent}
                </MessageResponse>
              </div>
            )}

            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className='w-full min-w-0'>
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

            {parsed.requirementItems.length > 0 && (
              <ExtractedRequirements
                requirements={parsed.requirementItems}
                onAccept={() => {
                  // TODO: accepted requirements should be reflected in record state
                }}
              />
            )}

            {isLast && parsed.clarifyItems.length > 0 && onSendMessage && (
              <Questionnaire questions={parsed.clarifyItems} onSubmit={onSendMessage} />
            )}

            {parsed.sources.length > 0 && <SourceReference sources={parsed.sources} />}

            {isLast && parsed.suggestions.length > 0 && onSendMessage && (
              <SuggestionChips suggestions={parsed.suggestions} onSelect={onSendMessage} />
            )}

            {showStreamingIndicator && (
              <div className='flex w-full justify-end pr-1'>
                <WaveDots className='text-fg-muted' />
              </div>
            )}

            {!showStreamingIndicator && displayContent && <MessageActions content={displayContent} />}
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
