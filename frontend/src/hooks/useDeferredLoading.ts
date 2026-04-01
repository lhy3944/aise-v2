import { useEffect, useState } from 'react';

/**
 * 로딩이 짧으면 스켈레톤을 보여주지 않아서 깜빡임을 방지
 * - loading이 true가 된 후 delay(기본 300ms) 이내에 false가 되면 스켈레톤 미표시
 * - delay를 넘기면 그때부터 스켈레톤 표시
 */
export function useDeferredLoading(loading: boolean, delay = 300): boolean {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShowSkeleton(false);
      return;
    }

    const timer = setTimeout(() => setShowSkeleton(true), delay);
    return () => clearTimeout(timer);
  }, [loading, delay]);

  return showSkeleton;
}
