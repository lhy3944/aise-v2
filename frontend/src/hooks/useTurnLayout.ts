'use client';

import type { ChatMessage } from '@/stores/chat-store';
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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
  // callback ref + version counter — AnimatePresence mode="wait"로 마운트가 지연되어도
  // element가 attach되는 시점에 리렌더가 유발되어 min-height/스크롤 로직이 정상 실행됨.
  const turnRef = useRef<HTMLElement | null>(null);
  const answerRef = useRef<HTMLDivElement | null>(null);
  const [mountVersion, setMountVersion] = useState(0);

  const currentTurnRef = useCallback((el: HTMLElement | null) => {
    turnRef.current = el;
    setMountVersion((v) => v + 1);
  }, []);
  const answerAreaRef = useCallback((el: HTMLDivElement | null) => {
    answerRef.current = el;
    setMountVersion((v) => v + 1);
  }, []);

  // 마지막 user+assistant 쌍을 currentTurn으로 분리
  const prevPastRef = useRef<ChatMessage[]>([]);

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
      const newPast = messages.slice(0, -2);
      // 참조 안정화: 개별 아이템이 같으면 이전 배열 반환 → 불필요한 재렌더 방지
      const prev = prevPastRef.current;
      if (
        newPast.length === prev.length &&
        newPast.every((msg, i) => msg === prev[i])
      ) {
        return {
          pastMessages: prev,
          currentTurn: { question: secondLast, answer: last },
        };
      }
      prevPastRef.current = newPast;
      return {
        pastMessages: newPast,
        currentTurn: { question: secondLast, answer: last },
      };
    }
    return { pastMessages: messages, currentTurn: null };
  }, [messages]);

  const questionId = currentTurn?.question.id ?? null;

  /** currentTurn 섹션의 상단을 스크롤 뷰포트 상단에 맞춤 */
  const scrollTurnToTop = useCallback(
    (smooth = false) => {
      const viewport = scrollRef.current;
      const turnEl = turnRef.current;
      if (!viewport || !turnEl) return;
      viewport.scrollTo({
        top: turnEl.offsetTop,
        behavior: smooth ? 'smooth' : 'instant',
      });
    },
    [scrollRef],
  );

  // 현재 턴: 섹션 min-height + 답변 영역 min-height를 뷰포트 기준으로 설정
  // mountVersion/questionId가 dep이라 element attach 또는 턴 교체 시 재계산됨.
  useLayoutEffect(() => {
    const viewport = scrollRef.current;
    const turnEl = turnRef.current;
    const answerEl = answerRef.current;
    if (!viewport || !turnEl || !answerEl) return;

    const GAP = 24; // gap-6
    const update = () => {
      const vh = viewport.clientHeight;
      turnEl.style.minHeight = `${vh}px`;
      const questionH =
        turnEl.firstElementChild?.getBoundingClientRect().height ?? 0;
      answerEl.style.minHeight = `${Math.max(0, vh - questionH - GAP)}px`;
    };
    update();

    // 뷰포트 크기 변경 시 (모바일 키보드 열림/닫힘 포함) min-height 재계산
    const ro = new ResizeObserver(() => {
      update();
      // 모바일 키보드로 뷰포트가 변해도 질문이 상단에 유지되도록 스크롤 보정
      scrollTurnToTop();
    });
    ro.observe(viewport);
    return () => ro.disconnect();
  }, [mountVersion, questionId, scrollRef, scrollTurnToTop]);

  // 턴 변경 시 스크롤 처리
  // - 히스토리 로드(서버에서 이미 완료된 답변): 하단으로 instant scroll
  // - 새 메시지 전송(스트리밍/빈 어시스턴트): 질문을 상단으로 smooth scroll
  const prevTurnQuestionIdRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (!questionId || questionId === prevTurnQuestionIdRef.current) return;
    if (!scrollRef.current || !turnRef.current) return;

    const answer = currentTurn!.answer;
    const isNewTurn =
      answer.status === 'streaming' || answer.content.length === 0;

    if (isNewTurn) {
      requestAnimationFrame(() => scrollTurnToTop(true));
    } else {
      requestAnimationFrame(() => {
        const viewport = scrollRef.current;
        if (viewport) viewport.scrollTop = viewport.scrollHeight;
      });
    }
    prevTurnQuestionIdRef.current = questionId;
  }, [mountVersion, questionId, currentTurn, scrollTurnToTop, scrollRef]);

  return { pastMessages, currentTurn, currentTurnRef, answerAreaRef };
}
