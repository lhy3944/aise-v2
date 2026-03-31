import type { ErrorResponse } from '@/types/project';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export class ApiError extends Error {
  code: string;
  status: number;
  detail?: string | null;

  constructor(status: number, error: ErrorResponse['error']) {
    super(error.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = error.code;
    this.detail = error.detail;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** true면 글로벌 에러 핸들링을 건너뛴다 (호출자가 직접 처리) */
  skipErrorHandling?: boolean;
}

async function handleGlobalError(error: ApiError): Promise<void> {
  if (typeof window === 'undefined') return;

  if (error.status === 401) {
    // 인증 만료 — 로그인 페이지로 리다이렉트
    window.location.href = '/login';
    return;
  }

  // 글로벌 에러 토스트 (동적 import로 서버 사이드 안전)
  const { showToast } = await import('@/lib/toast');

  if (error.status >= 500) {
    showToast.error('서버 오류가 발생했습니다', error.detail ?? undefined);
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers: customHeaders, skipErrorHandling, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  const config: RequestInit = {
    ...rest,
    headers,
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, config);

  if (!response.ok) {
    let errorBody: ErrorResponse;
    try {
      errorBody = await response.json();
    } catch {
      throw new ApiError(response.status, {
        code: 'UNKNOWN_ERROR',
        message: response.statusText || 'An unknown error occurred',
      });
    }

    const apiError = new ApiError(response.status, errorBody.error);

    if (!skipErrorHandling) {
      await handleGlobalError(apiError);
    }

    throw apiError;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: 'GET', ...options }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: 'POST', body, ...options }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: 'PUT', body, ...options }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: 'PATCH', body, ...options }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: 'DELETE', ...options }),
};
