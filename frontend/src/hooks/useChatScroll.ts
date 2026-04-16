'use client';

import type { ChatMessage } from '@/stores/chat-store';
import { useCallback, useEffect, useRef, useState } from 'react';

const BOTTOM_THRESHOLD = 80;

export function useChatScroll(messages: ChatMessage[]) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

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

  const hasCurrentTurn =
    messages.length >= 2 &&
    messages[messages.length - 2]?.role === 'user' &&
    messages[messages.length - 1]?.role === 'assistant';

  useEffect(() => {
    if (hasCurrentTurn) return;
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAtBottom, hasCurrentTurn]);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, []);

  return { scrollRef, isAtBottom, scrollToBottom };
}
