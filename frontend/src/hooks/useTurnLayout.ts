'use client';

import type { ChatMessage } from '@/stores/chat-store';
import { useLayoutEffect, useMemo, useRef } from 'react';

interface TurnPair {
  question: ChatMessage;
  answer: ChatMessage;
}

/**
 * 마지막 user+assistant 쌍을 currentTurn으로 분리하여
 * 질문을 뷰포트 상단에 고정하는 턴 기반 레이아웃 관리
 */
export function useTurnLayout(
  messages: ChatMessage[],
  scrollRef: React.RefObject<HTMLDivElement | null>,
) {
  const currentTurnRef = useRef<HTMLElement>(null);
  const answerAreaRef = useRef<HTMLDivElement>(null);

  // 마지막 user+assistant 쌍을 currentTurn으로 분리
  const { pastMessages, currentTurn } = useMemo((): {
    pastMessages: ChatMessage[];
    currentTurn: TurnPair | null;
  } => {
    if (messages.length < 2) {
      return { pastMessages: messages, currentTurn: null };
    }
    const last = messages[messages.length - 1];
    const secondLast = messages[messages.length - 2];
    if (secondLast.role === 'user' && last.role === 'assistant') {
      return {
        pastMessages: messages.slice(0, -2),
        currentTurn: { question: secondLast, answer: last },
      };
    }
    return { pastMessages: messages, currentTurn: null };
  }, [messages]);

  const hasTurn = !!currentTurn;

  // 현재 턴: 섹션 min-height + 답변 영역 min-height를 뷰포트 기준으로 설정
  useLayoutEffect(() => {
    const viewport = scrollRef.current;
    const turnEl = currentTurnRef.current;
    const answerEl = answerAreaRef.current;
    if (!viewport || !turnEl || !answerEl) return;

    const GAP = 24; // gap-6
    const update = () => {
      const vh = viewport.clientHeight;
      turnEl.style.minHeight = `${vh}px`;
      const questionH = turnEl.firstElementChild?.getBoundingClientRect().height ?? 0;
      answerEl.style.minHeight = `${Math.max(0, vh - questionH - GAP)}px`;
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(viewport);
    return () => ro.disconnect();
  }, [hasTurn, scrollRef]);

  // 새 턴 시작 시 질문 말풍선을 뷰포트 상단으로 스크롤
  const prevHadTurnRef = useRef(false);
  useLayoutEffect(() => {
    if (hasTurn && !prevHadTurnRef.current && currentTurnRef.current) {
      currentTurnRef.current.scrollIntoView({ block: 'start' });
    }
    prevHadTurnRef.current = hasTurn;
  }, [hasTurn]);

  return { pastMessages, currentTurn, currentTurnRef, answerAreaRef };
}
