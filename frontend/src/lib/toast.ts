import { useToastStore } from '@/stores/toast-store';

const DEFAULT_DURATION = 4000;

/**
 * 표준 Toast 헬퍼
 *
 * 사용법:
 *   showToast.success('저장되었습니다')
 *   showToast.error('저장에 실패했습니다', '네트워크 오류')
 *   showToast.info('처리 중입니다')
 *   showToast.warning('주의가 필요합니다')
 */
export const showToast = {
  success: (message: string, description?: string) =>
    useToastStore.getState().add({ type: 'success', message, description, duration: DEFAULT_DURATION }),

  error: (message: string, description?: string) =>
    useToastStore.getState().add({ type: 'error', message, description, duration: 6000 }),

  info: (message: string, description?: string) =>
    useToastStore.getState().add({ type: 'info', message, description, duration: DEFAULT_DURATION }),

  warning: (message: string, description?: string) =>
    useToastStore.getState().add({ type: 'warning', message, description, duration: 5000 }),
};
