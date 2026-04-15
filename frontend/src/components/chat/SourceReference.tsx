"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePanelStore } from "@/stores/panel-store";
import { FileText } from "lucide-react";

export interface SourceData {
  ref: number;
  document_id: string;
  document_name: string;
  chunk_index: number;
  file_type?: string;
}

interface SourceReferenceProps {
  sources: SourceData[];
}

export function SourceReference({ sources }: SourceReferenceProps) {
  const openSourceViewer = usePanelStore((s) => s.openSourceViewer);
  const sourceViewerData = usePanelStore((s) => s.sourceViewerData);

  if (sources.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <span className="text-fg-muted text-xs">출처</span>
      <div className="flex flex-wrap items-start gap-1.5">
        {sources.map((s) => {
          const isActive =
            sourceViewerData?.documentId === s.document_id &&
            sourceViewerData?.chunkIndex === s.chunk_index;

          return (
            <Button
              key={s.ref}
              variant="ghost"
              onClick={() =>
                openSourceViewer({
                  documentId: s.document_id,
                  documentName: s.document_name,
                  chunkIndex: s.chunk_index,
                  refNumber: s.ref,
                  fileType: s.file_type,
                })
              }
              className={cn(
                "border-line-primary text-fg-secondary hover:text-fg-primary",
                "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors",
                isActive && "border-accent-primary text-fg-primary",
              )}
            >
              <FileText className="size-3.5" />
              <span>
                [{s.ref}] {s.document_name}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
