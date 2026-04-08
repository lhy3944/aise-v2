import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

/**
 * 로딩이 짧으면 스켈레톤을 보여주지 않아서 깜빡임을 방지
 * - loading이 true가 된 후 delay(기본 300ms) 이내에 false가 되면 스켈레톤 미표시
 * - delay를 넘기면 그때부터 스켈레톤 표시
 */
export function useDeferredLoading(loading: boolean, delay = 300): boolean {
  const showRef = useRef(false);
  const listenerRef = useRef<(() => void) | null>(null);

  const subscribe = useCallback((onStoreChange: () => void) => {
    listenerRef.current = onStoreChange;
    return () => {
      listenerRef.current = null;
    };
  }, []);

  const getSnapshot = useCallback(() => showRef.current, []);

  useEffect(() => {
    if (!loading) {
      if (showRef.current) {
        showRef.current = false;
        listenerRef.current?.();
      }
      return;
    }

    const timer = setTimeout(() => {
      showRef.current = true;
      listenerRef.current?.();
    }, delay);

    return () => clearTimeout(timer);
  }, [loading, delay]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
