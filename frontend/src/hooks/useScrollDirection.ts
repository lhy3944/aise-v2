'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { usePanelStore } from '@/stores/panel-store';

/** 방향 전환으로 인정하려면 같은 방향으로 이 거리 이상 스크롤해야 함 */
const DIRECTION_CHANGE_THRESHOLD = 40;
/** 상단에서 이 이하면 헤더 항상 표시 */
const TOP_ZONE = 60;

/**
 * 스크롤 방향을 감지하여 헤더 표시/숨김을 제어하는 훅.
 * 모바일/태블릿(< lg)에서만 동작하며, 데스크탑에서는 항상 헤더 표시.
 */
export function useScrollDirection(scrollRef: RefObject<HTMLElement | null>) {
  const setHeaderVisible = usePanelStore((s) => s.setHeaderVisible);
  const isMobile = usePanelStore((s) => s.isMobile);
  const isTablet = usePanelStore((s) => s.isTablet);

  // 방향 전환 기준점 (마지막으로 상태가 바뀐 scrollTop)
  const anchorRef = useRef(0);
  const lastDirectionRef = useRef<'up' | 'down' | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || (!isMobile && !isTablet)) {
      setHeaderVisible(true);
      return;
    }

    const handleScroll = () => {
      const current = el.scrollTop;

      // 상단 근처면 항상 헤더 표시
      if (current <= TOP_ZONE) {
        setHeaderVisible(true);
        anchorRef.current = current;
        lastDirectionRef.current = null;
        return;
      }

      const distance = current - anchorRef.current;

      if (distance > DIRECTION_CHANGE_THRESHOLD && lastDirectionRef.current !== 'down') {
        // 충분히 아래로 스크롤 → 헤더 숨김
        setHeaderVisible(false);
        lastDirectionRef.current = 'down';
        anchorRef.current = current;
      } else if (distance < -DIRECTION_CHANGE_THRESHOLD && lastDirectionRef.current !== 'up') {
        // 충분히 위로 스크롤 → 헤더 표시
        setHeaderVisible(true);
        lastDirectionRef.current = 'up';
        anchorRef.current = current;
      }

      // 방향이 바뀌면 anchor를 현재 위치로 리셋 (누적 거리 재계산)
      if (
        (lastDirectionRef.current === 'down' && distance < 0) ||
        (lastDirectionRef.current === 'up' && distance > 0)
      ) {
        anchorRef.current = current;
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [scrollRef, isMobile, isTablet, setHeaderVisible]);
}
