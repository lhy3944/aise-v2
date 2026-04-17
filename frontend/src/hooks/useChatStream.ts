'use client';

import { streamAgentChat } from '@/services/agent-service';
import { streamExtractRecords } from '@/services/record-service';
import { sessionService } from '@/services/session-service';
import { useArtifactStore } from '@/stores/artifact-store';
import type { ChatMessage, ToolCallData } from '@/stores/chat-store';
import { useChatStore } from '@/stores/chat-store';
import { LayoutMode, usePanelStore } from '@/stores/panel-store';
import { useProjectStore } from '@/stores/project-store';
import { useRecordStore } from '@/stores/record-store';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const EMPTY_MESSAGES: ChatMessage[] = [];

/** 백엔드 도구 결과를 사용자 친화적 문자열로 포맷 */
function _formatToolResult(name: string, result: Record<string, unknown>): string {
  switch (name) {
    case 'create_record':
      return `${result.display_id} 생성 완료`;
    case 'update_record':
      return `${result.display_id} 수정 완료`;
    case 'delete_record':
      return `${result.display_id} 삭제 완료`;
    case 'update_record_status':
      return `${result.display_id}: ${result.old_status} → ${result.new_status}`;
    case 'search_records':
      return `${result.count}개 레코드 검색됨`;
    default:
      return '완료';
  }
}

/**
 * 채팅 메시지 전송, 스트리밍, tool call 실행, 세션 로드를 관리
 */
export function useChatStream(sessionId?: string) {
  const router = useRouter();
  const setRightPanelPreset = usePanelStore((s) => s.setRightPanelPreset);
  const currentProject = useProjectStore((s) => s.currentProject);
  const [pendingSessionId, setPendingSessionId] = useState<string | undefined>(
    sessionId,
  );
  const activeSessionId = sessionId ?? pendingSessionId;

  const setInputValue = useChatStore((s) => s.setInputValue);
  const addMessage = useChatStore((s) => s.addMessage);
  const appendToLastAssistant = useChatStore((s) => s.appendToLastAssistant);
  const setMessages = useChatStore((s) => s.setMessages);
  const setSessionStreaming = useChatStore((s) => s.setSessionStreaming);
  const finishStreaming = useChatStore((s) => s.finishStreaming);

  const messages = useChatStore(
    (s) =>
      (activeSessionId ? s.sessionMessages[activeSessionId] : undefined) ??
      EMPTY_MESSAGES,
  );
  const isStreaming = useChatStore((s) =>
    activeSessionId ? s.streamingSessionIds.has(activeSessionId) : false,
  );

  const abortControllersRef = useRef<Map<string, () => void>>(new Map());
  const tokenBufferRef = useRef<Map<string, string>>(new Map());
  const tokenFlushFrameRef = useRef<Map<string, number>>(new Map());
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(
    () =>
      !!activeSessionId &&
      !useChatStore.getState().sessionMessages[activeSessionId],
  );
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // sessionId 변경 시 로딩 상태 동기화
  useEffect(() => {
    if (sessionId) {
      setPendingSessionId(sessionId);
    }
  }, [sessionId]);

  const prevSessionIdRef = useRef(activeSessionId);
  if (prevSessionIdRef.current !== activeSessionId) {
    prevSessionIdRef.current = activeSessionId;
    const needsLoading =
      !!activeSessionId &&
      !useChatStore.getState().sessionMessages[activeSessionId];
    if (needsLoading !== isLoadingMessages) {
      setIsLoadingMessages(needsLoading);
    }
  }

  useEffect(() => {
    if (isLoadingMessages && messages.length > 0) {
      setIsLoadingMessages(false);
    }
  }, [isLoadingMessages, messages.length]);

  // Record store
  const setExtracting = useRecordStore((s) => s.setExtracting);
  const setCandidates = useRecordStore((s) => s.setCandidates);
  const setExtractError = useRecordStore((s) => s.setExtractError);
  const setActiveTab = useArtifactStore((s) => s.setActiveTab);

  // 세션 메시지 로드
  useEffect(() => {
    if (!activeSessionId) return;
    const cached = useChatStore.getState().sessionMessages[activeSessionId];
    if (cached) return;

    let cancelled = false;
    sessionService
      .get(activeSessionId)
      .then((detail) => {
        if (cancelled) return;
        const msgs: ChatMessage[] = detail.messages.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          toolCalls: m.tool_calls?.map((tc) => ({
            name: tc.name,
            arguments: tc.arguments,
            state: 'completed' as const,
          })),
          toolData: m.tool_data ? { type: 'requirements' as const, data: m.tool_data } : undefined,
          createdAt: m.created_at,
        }));
        setMessages(activeSessionId, msgs);
        setIsLoadingMessages(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoadingMessages(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeSessionId, setMessages]);

  // 레코드 추출 실행 (SSE 스트리밍)
  const triggerExtractRecords = useCallback(
    (projectId: string, sid: string) => {
      setExtracting(true);
      setActiveTab('records');
      setRightPanelPreset(LayoutMode.SPLIT);
      const updateLast = useChatStore.getState().updateLastAssistantMessage;

      streamExtractRecords(projectId, undefined, {
        onDone: (candidates) => {
          setCandidates(candidates);
          updateLast(sid, (msg) => ({
            ...msg,
            toolCalls: msg.toolCalls?.map((tc) =>
              tc.name === 'extract_records'
                ? {
                    ...tc,
                    state: 'completed' as const,
                    result: `${candidates.length}개 후보 추출`,
                  }
                : tc,
            ),
          }));
        },
        onError: (errorMsg) => {
          setExtractError(errorMsg);
          updateLast(sid, (msg) => ({
            ...msg,
            toolCalls: msg.toolCalls?.map((tc) =>
              tc.name === 'extract_records'
                ? { ...tc, state: 'error' as const, error: errorMsg }
                : tc,
            ),
          }));
        },
      });
    },
    [setExtracting, setCandidates, setExtractError, setActiveTab, setRightPanelPreset],
  );

  // Records 갱신 트리거
  const bumpRefresh = useRecordStore((s) => s.bumpRefresh);

  const clearBufferedTokens = useCallback((sid: string) => {
    tokenBufferRef.current.delete(sid);
    const rafId = tokenFlushFrameRef.current.get(sid);
    if (rafId !== undefined) {
      cancelAnimationFrame(rafId);
      tokenFlushFrameRef.current.delete(sid);
    }
  }, []);

  const flushBufferedTokens = useCallback(
    (sid: string) => {
      const buffered = tokenBufferRef.current.get(sid);
      if (buffered) {
        appendToLastAssistant(sid, buffered);
      }
      clearBufferedTokens(sid);
    },
    [appendToLastAssistant, clearBufferedTokens],
  );

  const enqueueToken = useCallback(
    (sid: string, token: string) => {
      const prev = tokenBufferRef.current.get(sid) ?? '';
      tokenBufferRef.current.set(sid, prev + token);

      if (tokenFlushFrameRef.current.has(sid)) return;

      const rafId = requestAnimationFrame(() => {
        tokenFlushFrameRef.current.delete(sid);
        const buffered = tokenBufferRef.current.get(sid);
        if (!buffered) return;
        tokenBufferRef.current.delete(sid);
        appendToLastAssistant(sid, buffered);
      });
      tokenFlushFrameRef.current.set(sid, rafId);
    },
    [appendToLastAssistant],
  );

  // Tool call 실행 디스패처
  const executeToolCall = useCallback(
    (sid: string, name: string, _args: Record<string, unknown>) => {
      if (!currentProject) return;
      switch (name) {
        case 'extract_records':
          triggerExtractRecords(currentProject.project_id, sid);
          break;
        case 'generate_srs':
          // TODO: SRS 생성 연동
          break;
      }
    },
    [currentProject, triggerExtractRecords],
  );

  // 백엔드 도구 실행 결과 처리 (레코드 CUD)
  const handleToolResult = useCallback(
    (sid: string, name: string, result: Record<string, unknown>) => {
      const updateLast = useChatStore.getState().updateLastAssistantMessage;

      // 레코드 CUD 도구 결과 → Records 탭 갱신
      if (['create_record', 'update_record', 'delete_record', 'update_record_status'].includes(name)) {
        bumpRefresh();
      }

      // tool call 상태를 completed로 업데이트
      const success = result.success as boolean;
      const newState: 'completed' | 'error' = success ? 'completed' : 'error';
      updateLast(sid, (msg) => ({
        ...msg,
        toolCalls: msg.toolCalls?.map((tc) =>
          tc.name === name && tc.state === 'running'
            ? {
                ...tc,
                state: newState,
                result: success ? _formatToolResult(name, result) : undefined,
                error: success ? undefined : (result.error as string),
              }
            : tc,
        ),
      }));
    },
    [bumpRefresh],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !currentProject || isStreaming) return;

      let targetSessionId = activeSessionId;

      // 세션이 없으면 서버에서 생성 → URL 변경
      if (!targetSessionId) {
        setIsCreatingSession(true);
        try {
          const newSession = await sessionService.create(
            currentProject.project_id,
            text.slice(0, 40),
          );
          targetSessionId = newSession.id;
          setPendingSessionId(targetSessionId);
          useChatStore.getState().bumpSessionListNonce();
          router.replace(`/agent/${targetSessionId}`);
          setIsCreatingSession(false);
        } catch {
          setIsCreatingSession(false);
          return;
        }
      }

      // UI에 user 메시지 즉시 추가
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      };
      addMessage(targetSessionId, userMsg);
      setInputValue('');

      // 빈 assistant 메시지 추가 (스트리밍용)
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: '',
        status: 'streaming',
        createdAt: new Date().toISOString(),
      };
      addMessage(targetSessionId, assistantMsg);
      setSessionStreaming(targetSessionId, true);
      clearBufferedTokens(targetSessionId);

      const updateLastAssistant = useChatStore.getState().updateLastAssistantMessage;

      const abort = streamAgentChat(
        {
          session_id: targetSessionId,
          message: text,
        },
        {
          onToken: (token) => {
            enqueueToken(targetSessionId, token);
          },
          onToolCall: (toolCall) => {
            const tc: ToolCallData = {
              name: toolCall.name,
              arguments: toolCall.arguments,
              state: 'running',
            };
            updateLastAssistant(targetSessionId, (msg) => ({
              ...msg,
              toolCalls: [...(msg.toolCalls ?? []), tc],
            }));
            executeToolCall(targetSessionId, toolCall.name, toolCall.arguments);
          },
          onToolResult: (toolResult) => {
            handleToolResult(targetSessionId, toolResult.name, toolResult.result);
          },
          onDone: () => {
            flushBufferedTokens(targetSessionId);
            finishStreaming(targetSessionId);
          },
          onError: (error) => {
            flushBufferedTokens(targetSessionId);
            appendToLastAssistant(targetSessionId, `\n\n⚠️ ${error}`);
            finishStreaming(targetSessionId, 'error');
          },
        },
      );

      abortControllersRef.current.set(targetSessionId, abort);
    },
    [
      currentProject,
      activeSessionId,
      isStreaming,
      addMessage,
      setInputValue,
      appendToLastAssistant,
      setSessionStreaming,
      finishStreaming,
      flushBufferedTokens,
      executeToolCall,
      handleToolResult,
      router,
    ],
  );

  // 스트리밍 중지
  const stopStreaming = useCallback(() => {
    if (!activeSessionId) return;
    flushBufferedTokens(activeSessionId);
    abortControllersRef.current.get(activeSessionId)?.();
    abortControllersRef.current.delete(activeSessionId);
    finishStreaming(activeSessionId);
  }, [activeSessionId, finishStreaming, flushBufferedTokens]);

  // Cleanup on unmount
  useEffect(() => {
    const controllers = abortControllersRef.current;
    return () => {
      // `/agent` -> `/agent/[sessionId]` route handoff 중에는
      // 기존 스트림을 유지해야 하므로 실제 route param 기준으로만 정리한다.
      if (sessionId) {
        flushBufferedTokens(sessionId);
        controllers.get(sessionId)?.();
        controllers.delete(sessionId);
      }
    };
  }, [sessionId, flushBufferedTokens]);

  return {
    messages,
    isStreaming,
    isLoadingMessages,
    isCreatingSession,
    sendMessage,
    stopStreaming,
    setInputValue,
  };
}
