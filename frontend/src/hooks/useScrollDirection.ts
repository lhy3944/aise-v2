'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { usePanelStore } from '@/stores/panel-store';

const SCROLL_THRESHOLD = 10;

/**
 * 스크롤 방향을 감지하여 헤더 표시/숨김을 제어하는 훅.
 * 모바일/태블릿(< lg)에서만 동작하며, 데스크탑에서는 항상 헤더 표시.
 */
export function useScrollDirection(scrollRef: RefObject<HTMLElement | null>) {
  const setHeaderVisible = usePanelStore((s) => s.setHeaderVisible);
  const isMobile = usePanelStore((s) => s.isMobile);
  const isTablet = usePanelStore((s) => s.isTablet);
  const lastScrollTop = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || (!isMobile && !isTablet)) {
      setHeaderVisible(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollTop = el.scrollTop;
      const delta = currentScrollTop - lastScrollTop.current;

      if (Math.abs(delta) < SCROLL_THRESHOLD) return;

      if (delta > 0 && currentScrollTop > 60) {
        // 스크롤 다운 + 상단에서 충분히 내려왔을 때 → 헤더 숨김
        setHeaderVisible(false);
      } else if (delta < 0) {
        // 스크롤 업 → 헤더 표시
        setHeaderVisible(true);
      }

      lastScrollTop.current = currentScrollTop;
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [scrollRef, isMobile, isTablet, setHeaderVisible]);
}
