import { toast } from 'sonner';

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
  success: (message: string, description?: string) => toast.success(message, { description }),

  error: (message: string, description?: string, id?: string) =>
    toast.error(message, { description, duration: 600000, id }),

  info: (message: string, description?: string) => toast.info(message, { description }),

  warning: (message: string, description?: string) =>
    toast.warning(message, { description, duration: 5000 }),
};
