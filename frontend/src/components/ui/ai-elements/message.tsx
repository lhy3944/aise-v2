'use client';

import '@/components/ui/ai-elements/css/markdown.css';
import { cn } from '@/lib/utils';
import { cjk } from '@streamdown/cjk';
import { code } from '@streamdown/code';
import { math } from '@streamdown/math';
import { createMermaidPlugin } from '@streamdown/mermaid';
import { Bot, Check, Copy, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { type ReactNode, memo, useCallback, useEffect, useRef, useState } from 'react';
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

const mermaidDark = createMermaidPlugin({ config: { theme: 'dark' } });
const mermaidLight = createMermaidPlugin({ config: { theme: 'neutral' } });
const pluginsDark = { cjk, code, math, mermaid: mermaidDark };
const pluginsLight = { cjk, code, math, mermaid: mermaidLight };

interface MessageResponseProps {
  children: string;
  streaming?: boolean;
  className?: string;
}

export const MessageResponse = memo(
  function MessageResponse({ children: content, streaming, className }: MessageResponseProps) {
    const { resolvedTheme } = useTheme();
    const plugins = resolvedTheme === 'dark' ? pluginsDark : pluginsLight;

    if (!content && !streaming) return null;

    return (
      <div className={cn('markdown-body text-fg-primary overflow-hidden text-sm', className)}>
        {content ? (
          <Streamdown
            className='w-full **:data-language:w-full [&_svg]:max-w-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0'
            plugins={plugins}
            // mermaid={{
            //   config: {
            //     theme: 'dark',
            //     themeVariables: {
            //       primaryColor: '#ff6b6b',
            //       primaryTextColor: '#fff',
            //       primaryBorderColor: '#ff6b6b',
            //       lineColor: '#f5f5f5',
            //       secondaryColor: '#4ecdc4',
            //       tertiaryColor: '#45b7d1',
            //     },
            //   },
            // }}
            mermaid={{
              config: {
                themeVariables: {
                  fontSize: '16px',
                  fontFamily: 'Inter, sans-serif',
                },
                look: 'classic',
              },
            }}
            isAnimating={streaming}
            controls={{
              code: { copy: true, download: true },
              table: { fullscreen: true, copy: true, download: true },
              mermaid: { fullscreen: true, download: true, copy: true, panZoom: true },
            }}
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
        'bg-canvas-surface text-fg-primary rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
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
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // HTTP 환경: Clipboard API 불가 → textarea + execCommand fallback
      const ta = document.createElement('textarea');
      ta.value = content;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
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
        className={cn('rounded p-1 transition-colors', 'text-fg-muted hover:text-fg-primary')}
        aria-label='복사'
      >
        {copied ? <Check className='size-3.5' /> : <Copy className='size-3.5' />}
      </button>
    </div>
  );
}
