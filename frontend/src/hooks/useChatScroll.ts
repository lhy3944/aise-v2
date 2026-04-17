'use client';

import type { ChatMessage } from '@/stores/chat-store';
import { usePanelStore } from '@/stores/panel-store';
import { useCallback, useEffect, useRef, useState } from 'react';

const BOTTOM_THRESHOLD = 80;

export function useChatScroll(messages: ChatMessage[]) {
  const isMobile = usePanelStore((s) => s.isMobile);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [mountVersion, setMountVersion] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // callback ref — AnimatePresence 등으로 ScrollArea 마운트가 지연되어도
  // viewport가 attach되는 시점에 리렌더를 유발해서 scroll listener 등록을 보장.
  const setScrollEl = useCallback((el: HTMLDivElement | null) => {
    scrollRef.current = el;
    setMountVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setIsAtBottom(distanceFromBottom <= BOTTOM_THRESHOLD);
    };
    // 마운트 직후 초기 상태 반영 (스크롤 이벤트 없이도 버튼 표시 여부 결정)
    handleScroll();
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [mountVersion]);

  const hasCurrentTurn =
    messages.length >= 2 &&
    messages[messages.length - 2]?.role === 'user' &&
    messages[messages.length - 1]?.role === 'assistant';
  // 모바일은 현재 턴을 상단 고정하되, 사용자가 하단 근처로 내려오면 자동 follow를 허용한다.
  const shouldPinCurrentTurn = isMobile && hasCurrentTurn && !isAtBottom;

  useEffect(() => {
    if (shouldPinCurrentTurn) return;
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAtBottom, shouldPinCurrentTurn, mountVersion]);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, []);

  return { scrollRef, setScrollEl, isAtBottom, scrollToBottom };
}
