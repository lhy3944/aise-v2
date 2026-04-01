'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Copy, Lightbulb, ShieldCheck } from 'lucide-react';
import type {
  ReviewResponse,
  LatestReviewResponse,
  ReviewIssue,
} from '@/types/project';

// --- Props ---

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewData: ReviewResponse | LatestReviewResponse | null;
  isLoading: boolean;
}

// --- Style Map ---

const ISSUE_STYLE = {
  conflict: { label: '충돌', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
  duplicate: { label: '중복', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Copy },
} as const;

// --- Sub-components ---

function IssueCard({ issue }: { issue: ReviewIssue }) {
  const style = ISSUE_STYLE[issue.type];
  const Icon = style.icon;

  return (
    <div className="rounded-lg border border-line-subtle bg-canvas-primary p-4">
      {/* Header: type badge + description */}
      <div className="mb-2 flex items-start gap-2">
        <Badge className={`gap-1 border ${style.color} shrink-0`}>
          <Icon className="size-3" />
          {style.label}
        </Badge>
        <p className="text-sm text-fg-primary whitespace-pre-wrap">
          {issue.description}
        </p>
      </div>

      {/* Related requirements */}
      {issue.related_requirements.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="text-xs text-fg-muted">관련:</span>
          {issue.related_requirements.map((reqId) => (
            <Badge
              key={reqId}
              variant="secondary"
              className="text-xs font-mono"
            >
              {reqId}
            </Badge>
          ))}
        </div>
      )}

      {/* Hint */}
      {issue.hint && (
        <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-2.5">
          <Lightbulb className="size-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{issue.hint}</p>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-6 w-32 rounded-full" />
      </div>
      {/* Card skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-line-subtle p-4">
          <div className="flex gap-2 mb-3">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-4 w-2/3 mb-2" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ShieldCheck className="size-10 text-green-500 mb-3" />
      <p className="text-sm font-medium text-fg-primary">
        이슈가 검출되지 않았습니다
      </p>
      <p className="mt-1 text-xs text-fg-muted">
        다음 단계로 진행할 수 있습니다
      </p>
    </div>
  );
}

// --- Main Component ---

export function ReviewModal({
  open,
  onOpenChange,
  reviewData,
  isLoading,
}: ReviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-row items-center justify-between gap-4">
          <DialogTitle>요구사항 리뷰 결과</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <LoadingSkeleton />
        ) : !reviewData ? (
          <div className="py-12 text-center text-sm text-fg-muted">
            리뷰 데이터가 없습니다
          </div>
        ) : (
          <>
            {/* Summary Badges */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                {reviewData.summary.ready_for_next ? (
                  <Badge className="bg-green-100 text-green-700 border border-green-200">
                    다음 단계 진행 가능
                  </Badge>
                ) : (
                  /* v1에서는 항상 true, v2에서 활성화 예정 */
                  <Badge className="bg-orange-100 text-orange-700 border border-orange-200">
                    충돌 해결 권장
                  </Badge>
                )}
                {reviewData.summary.conflicts > 0 && (
                  <Badge variant="outline" className="gap-1">
                    충돌
                    <span className="font-semibold">
                      {reviewData.summary.conflicts}
                    </span>
                    건
                  </Badge>
                )}
                {reviewData.summary.duplicates > 0 && (
                  <Badge variant="outline" className="gap-1">
                    중복
                    <span className="font-semibold">
                      {reviewData.summary.duplicates}
                    </span>
                    건
                  </Badge>
                )}
              </div>
            </div>

            {/* Issue List */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              {reviewData.issues.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="flex flex-col gap-3 pb-2">
                  {reviewData.issues.map((issue) => (
                    <IssueCard key={issue.issue_id} issue={issue} />
                  ))}
                </div>
              )}
            </div>

            {/* Feedback */}
            {reviewData.summary.feedback && (
              <div className="rounded-md border border-line-subtle bg-muted/30 p-3 shrink-0">
                <span className="text-xs font-medium text-fg-muted">
                  종합 피드백
                </span>
                <p className="mt-1 text-sm text-fg-primary whitespace-pre-wrap">
                  {reviewData.summary.feedback}
                </p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
