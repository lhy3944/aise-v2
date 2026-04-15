"use client";

import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { usePanelStore } from "@/stores/panel-store";
import { useProjectStore } from "@/stores/project-store";
import { FileText, X } from "lucide-react";
import "@/components/ui/ai-elements/css/markdown.css";

const sourcePlugins = { cjk, code };

interface ChunkPreview {
  document_name: string;
  target: { index: number; content: string };
  before: { index: number; content: string }[];
  after: { index: number; content: string }[];
}

export function SourceViewerPanel() {
  const data = usePanelStore((s) => s.sourceViewerData);
  const closeSourceViewer = usePanelStore((s) => s.closeSourceViewer);
  const projectId = useProjectStore((s) => s.currentProject?.project_id);

  const [preview, setPreview] = useState<ChunkPreview | null>(null);
  const [fetchKey, setFetchKey] = useState<string | null>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  // data가 바뀌면 fetchKey를 갱신하여 loading 파생
  const currentKey = data ? `${data.documentId}:${data.chunkIndex}` : null;
  const loading = currentKey !== null && currentKey !== fetchKey;

  // 타겟 청크로 자동 스크롤
  useEffect(() => {
    if (!preview || !targetRef.current) return;
    const raf = requestAnimationFrame(() => {
      targetRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => cancelAnimationFrame(raf);
  }, [fetchKey, preview]);

  useEffect(() => {
    if (!projectId || !data) return;
    let cancelled = false;

    const key = `${data.documentId}:${data.chunkIndex}`;

    api
      .get<ChunkPreview>(
        `/api/v1/projects/${projectId}/knowledge/documents/${data.documentId}/chunks/${data.chunkIndex}?context=1`,
      )
      .then((result) => {
        if (!cancelled) {
          setPreview(result);
          setFetchKey(key);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreview(null);
          setFetchKey(key);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, data]);

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="border-line-primary flex items-center gap-2 border-b px-4 py-3">
        <FileText className="text-fg-muted size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-fg-primary truncate text-sm font-medium">
            {data?.documentName ?? "출처 문서"}
          </p>
          {data && (
            <p className="text-fg-muted text-xs">
              Chunk #{data.chunkIndex} · 출처 [{data.refNumber}]
            </p>
          )}
        </div>
        <button
          onClick={closeSourceViewer}
          className="text-fg-muted hover:text-fg-primary rounded p-1 transition-colors"
          aria-label="닫기"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* 본문 */}
      <ScrollArea className="flex-1 h-full">
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="size-6" />
            </div>
          ) : preview ? (
            <div className="space-y-4">
              {preview.before.map((c) => (
                <div key={c.index} className="opacity-40">
                  <ChunkContent content={c.content} />
                </div>
              ))}

              {/* 타겟 청크 — 강조 */}
              <div
                ref={targetRef}
                className={cn(
                  "border-accent-primary bg-primary/5 border-l-3 py-3 pl-3",
                )}
              >
                <ChunkContent content={preview.target.content} />
              </div>

              {preview.after.map((c) => (
                <div key={c.index} className="opacity-40">
                  <ChunkContent content={c.content} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-fg-muted flex items-center justify-center py-12 text-sm">
              문서를 불러올 수 없습니다.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ChunkContent({ content }: { content: string }) {
  return (
    <div className="markdown-body text-fg-primary text-sm">
      <Streamdown
        plugins={sourcePlugins}
        isAnimating={false}
        className="w-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
      >
        {content}
      </Streamdown>
    </div>
  );
}
