'use client';

import { streamAgentChat } from '@/services/agent-service';
import { recordService } from '@/services/record-service';
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

  const setInputValue = useChatStore((s) => s.setInputValue);
  const addMessage = useChatStore((s) => s.addMessage);
  const appendToLastAssistant = useChatStore((s) => s.appendToLastAssistant);
  const setMessages = useChatStore((s) => s.setMessages);
  const setSessionStreaming = useChatStore((s) => s.setSessionStreaming);

  const messages = useChatStore(
    (s) => (sessionId ? s.sessionMessages[sessionId] : undefined) ?? EMPTY_MESSAGES,
  );
  const isStreaming = useChatStore((s) =>
    sessionId ? s.streamingSessionIds.has(sessionId) : false,
  );

  const abortControllersRef = useRef<Map<string, () => void>>(new Map());
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(
    () => !!sessionId && !useChatStore.getState().sessionMessages[sessionId],
  );
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // sessionId 변경 시 로딩 상태 동기화
  const prevSessionIdRef = useRef(sessionId);
  if (prevSessionIdRef.current !== sessionId) {
    prevSessionIdRef.current = sessionId;
    const needsLoading = !!sessionId && !useChatStore.getState().sessionMessages[sessionId];
    if (needsLoading !== isLoadingMessages) {
      setIsLoadingMessages(needsLoading);
    }
  }

  // Record store
  const setExtracting = useRecordStore((s) => s.setExtracting);
  const setCandidates = useRecordStore((s) => s.setCandidates);
  const setExtractError = useRecordStore((s) => s.setExtractError);
  const setActiveTab = useArtifactStore((s) => s.setActiveTab);

  // 세션 메시지 로드
  useEffect(() => {
    if (!sessionId) return;
    const cached = useChatStore.getState().sessionMessages[sessionId];
    if (cached) return;

    let cancelled = false;
    sessionService
      .get(sessionId)
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
        setMessages(sessionId, msgs);
        setIsLoadingMessages(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoadingMessages(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, setMessages]);

  // 레코드 추출 실행
  const triggerExtractRecords = useCallback(
    async (projectId: string, sid: string) => {
      setExtracting(true);
      setActiveTab('records');
      setRightPanelPreset(LayoutMode.SPLIT);
      const updateLast = useChatStore.getState().updateLastAssistantMessage;
      try {
        const result = await recordService.extract(projectId);
        setCandidates(result.candidates);
        updateLast(sid, (msg) => ({
          ...msg,
          toolCalls: msg.toolCalls?.map((tc) =>
            tc.name === 'extract_records'
              ? {
                  ...tc,
                  state: 'completed' as const,
                  result: `${result.candidates.length}개 후보 추출`,
                }
              : tc,
          ),
        }));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '레코드 추출 실패';
        setExtractError(errorMsg);
        updateLast(sid, (msg) => ({
          ...msg,
          toolCalls: msg.toolCalls?.map((tc) =>
            tc.name === 'extract_records'
              ? { ...tc, state: 'error' as const, error: errorMsg }
              : tc,
          ),
        }));
      }
    },
    [setExtracting, setCandidates, setExtractError, setActiveTab, setRightPanelPreset],
  );

  // Records 갱신 트리거
  const bumpRefresh = useRecordStore((s) => s.bumpRefresh);

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
      updateLast(sid, (msg) => ({
        ...msg,
        toolCalls: msg.toolCalls?.map((tc) =>
          tc.name === name && tc.state === 'running'
            ? {
                ...tc,
                state: (success ? 'completed' : 'error') as const,
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
      if (!text.trim() || !currentProject || (sessionId && isStreaming)) return;

      let activeSessionId = sessionId;

      // 세션이 없으면 서버에서 생성 → URL 변경
      if (!activeSessionId) {
        setIsCreatingSession(true);
        try {
          const newSession = await sessionService.create(
            currentProject.project_id,
            text.slice(0, 40),
          );
          activeSessionId = newSession.id;
          useChatStore.getState().bumpSessionListNonce();
          router.replace(`/agent/${activeSessionId}`);
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
      addMessage(activeSessionId, userMsg);
      setInputValue('');

      // 빈 assistant 메시지 추가 (스트리밍용)
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };
      addMessage(activeSessionId, assistantMsg);
      setSessionStreaming(activeSessionId, true);

      const updateLastAssistant = useChatStore.getState().updateLastAssistantMessage;

      const abort = streamAgentChat(
        {
          session_id: activeSessionId,
          message: text,
        },
        {
          onToken: (token) => {
            appendToLastAssistant(activeSessionId!, token);
          },
          onToolCall: (toolCall) => {
            const tc: ToolCallData = {
              name: toolCall.name,
              arguments: toolCall.arguments,
              state: 'running',
            };
            updateLastAssistant(activeSessionId!, (msg) => ({
              ...msg,
              toolCalls: [...(msg.toolCalls ?? []), tc],
            }));
            executeToolCall(activeSessionId!, toolCall.name, toolCall.arguments);
          },
          onToolResult: (toolResult) => {
            handleToolResult(activeSessionId!, toolResult.name, toolResult.result);
          },
          onDone: () => {
            setSessionStreaming(activeSessionId!, false);
          },
          onError: (error) => {
            appendToLastAssistant(activeSessionId!, `\n\n⚠️ ${error}`);
            setSessionStreaming(activeSessionId!, false);
          },
        },
      );

      abortControllersRef.current.set(activeSessionId, abort);
    },
    [
      currentProject,
      sessionId,
      isStreaming,
      addMessage,
      setInputValue,
      appendToLastAssistant,
      setSessionStreaming,
      executeToolCall,
      handleToolResult,
      router,
    ],
  );

  // 스트리밍 중지
  const stopStreaming = useCallback(() => {
    if (!sessionId) return;
    abortControllersRef.current.get(sessionId)?.();
    abortControllersRef.current.delete(sessionId);
    setSessionStreaming(sessionId, false);
  }, [sessionId, setSessionStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    const controllers = abortControllersRef.current;
    return () => {
      if (sessionId) {
        controllers.get(sessionId)?.();
        controllers.delete(sessionId);
      }
    };
  }, [sessionId]);

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
