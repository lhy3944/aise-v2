'use client';

import { cn } from '@/lib/utils';
import { cjk } from '@streamdown/cjk';
import { code } from '@streamdown/code';
import { math } from '@streamdown/math';
import { mermaid } from '@streamdown/mermaid';
import { Bot, Copy, User } from 'lucide-react';
import { type ReactNode, memo, useCallback } from 'react';
import { Streamdown } from 'streamdown';

// ── Message Container ──

type MessageRole = 'user' | 'assistant';

interface MessageProps {
  from: MessageRole;
  children: ReactNode;
  className?: string;
}

export function Message({ from, children, className }: MessageProps) {
  return (
    <div
      className={cn(
        'group flex gap-3',
        from === 'user' ? 'flex-row-reverse' : 'flex-row',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── Avatar ──

interface MessageAvatarProps {
  from: MessageRole;
  className?: string;
}

export function MessageAvatar({ from, className }: MessageAvatarProps) {
  return (
    <div
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-full',
        from === 'user'
          ? 'bg-accent-primary/10 text-accent-primary'
          : 'bg-canvas-surface text-fg-secondary',
        className,
      )}
    >
      {from === 'user' ? <User className='size-3.5' /> : <Bot className='size-3.5' />}
    </div>
  );
}

// ── Content Wrapper ──

interface MessageContentProps {
  from: MessageRole;
  children: ReactNode;
  className?: string;
}

export function MessageContent({ from, children, className }: MessageContentProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5',
        from === 'user' ? 'max-w-[85%] items-end' : 'w-full items-start',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── Markdown Response (assistant) ──

const streamdownPlugins = { cjk, code, math, mermaid };

interface MessageResponseProps {
  children: string;
  streaming?: boolean;
  className?: string;
}

export const MessageResponse = memo(
  function MessageResponse({ children: content, streaming, className }: MessageResponseProps) {
    if (!content && !streaming) return null;

    return (
      <div className={cn('text-fg-primary text-base leading-relaxed', className)}>
        {content ? (
          <Streamdown
            className='w-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0'
            plugins={streamdownPlugins}
            isAnimating={streaming}
          >
            {content}
          </Streamdown>
        ) : null}
        {streaming && !content && (
          <span className='ml-0.5 inline-block h-4 w-1 animate-pulse rounded-full bg-current align-middle' />
        )}
      </div>
    );
  },
  (prev, next) => prev.children === next.children && prev.streaming === next.streaming,
);

// ── User Bubble ──

interface MessageBubbleProps {
  children: ReactNode;
  className?: string;
}

export function MessageBubble({ children, className }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        'bg-canvas-surface text-fg-primary rounded-2xl px-4 py-2.5 text-base leading-relaxed whitespace-pre-wrap',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── Actions Toolbar ──

interface MessageActionsProps {
  content: string;
  className?: string;
}

export function MessageActions({ content, className }: MessageActionsProps) {
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
  }, [content]);

  return (
    <div
      className={cn(
        'flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100',
        className,
      )}
    >
      <button
        onClick={handleCopy}
        className='text-fg-muted hover:text-fg-primary rounded p-1 transition-colors'
        aria-label='복사'
      >
        <Copy className='size-3.5' />
      </button>
    </div>
  );
}
