'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, CheckSquare, Forward, HelpCircle, Square } from 'lucide-react';
import { useCallback, useState } from 'react';

/* ── 타입 정의 ── */

export interface QuestionData {
  id?: string;
  question: string;
  type?: 'single' | 'multi' | 'text';
  options?: string[];
  allow_custom?: boolean;
}

interface QuestionnaireProps {
  questions: QuestionData[];
  onSubmit: (formattedAnswer: string) => void;
}

type AnswerMap = Record<string, SingleAnswer>;

interface SingleAnswer {
  selected: string[]; // 선택된 옵션들
  customText: string; // 직접 입력 텍스트
}

const EMPTY_ANSWER: SingleAnswer = { selected: [], customText: '' };

/* ── 개별 질문 렌더러 ── */

function QuestionItem({
  index,
  data,
  answer,
  onChange,
}: {
  index: number;
  data: QuestionData;
  answer: SingleAnswer;
  onChange: (answer: SingleAnswer) => void;
}) {
  const qType = data.type ?? 'single';
  const options = data.options ?? [];
  const allowCustom = data.allow_custom ?? false;
  const isCustomActive = answer.selected.includes('__custom__');

  const handleOptionClick = (option: string) => {
    if (qType === 'single') {
      onChange({ ...answer, selected: [option] });
    } else {
      // multi
      const next = answer.selected.includes(option)
        ? answer.selected.filter((s) => s !== option)
        : [...answer.selected.filter((s) => s !== '__custom__'), option];
      onChange({ ...answer, selected: next });
    }
  };

  const handleCustomToggle = () => {
    if (isCustomActive) {
      onChange({ ...answer, selected: answer.selected.filter((s) => s !== '__custom__'), customText: '' });
    } else {
      if (qType === 'single') {
        onChange({ ...answer, selected: ['__custom__'] });
      } else {
        onChange({ ...answer, selected: [...answer.selected, '__custom__'] });
      }
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', index > 0 && 'border-line-primary border-t pt-4')}>
      {/* 질문 */}
      <div className='flex items-start gap-2'>
        <HelpCircle className='text-accent-primary mt-0.5 size-4 shrink-0' />
        <p className='text-fg-primary text-sm font-medium'>{data.question}</p>
      </div>

      {/* 옵션 (single / multi) */}
      {qType !== 'text' && options.length > 0 && (
        <div className='flex flex-col gap-1.5 pl-6'>
          {options.map((option) => {
            const isSelected = answer.selected.includes(option);
            return (
              <button
                key={option}
                type='button'
                onClick={() => handleOptionClick(option)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  isSelected
                    ? 'border-accent-primary/30 bg-accent-primary/5 text-fg-primary'
                    : 'border-line-primary text-fg-secondary hover:bg-canvas-secondary',
                )}
              >
                {qType === 'multi' ? (
                  isSelected ? (
                    <CheckSquare className='text-accent-primary size-4 shrink-0' />
                  ) : (
                    <Square className='text-fg-muted size-4 shrink-0' />
                  )
                ) : (
                  <div
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded-full border',
                      isSelected
                        ? 'border-accent-primary bg-accent-primary'
                        : 'border-line-primary',
                    )}
                  >
                    {isSelected && <div className='size-1.5 rounded-full bg-white' />}
                  </div>
                )}
                {option}
              </button>
            );
          })}
        </div>
      )}

      {/* 직접 입력 토글 (single/multi + allow_custom) */}
      {qType !== 'text' && allowCustom && (
        <div className='flex flex-col gap-1.5 pl-6'>
          <button
            type='button'
            onClick={handleCustomToggle}
            className={cn(
              'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
              isCustomActive
                ? 'border-accent-primary/30 text-accent-primary'
                : 'border-line-primary text-fg-muted hover:bg-canvas-secondary',
            )}
          >
            직접 입력
          </button>
          {isCustomActive && (
            <textarea
              value={answer.customText}
              onChange={(e) => onChange({ ...answer, customText: e.target.value })}
              placeholder='답변을 입력하세요...'
              className='bg-canvas-primary border-line-primary text-fg-primary placeholder:text-fg-muted w-full rounded-lg border px-3 py-2 text-sm focus:outline-none'
              rows={2}
              autoFocus
            />
          )}
        </div>
      )}

      {/* 텍스트 전용 입력 */}
      {qType === 'text' && (
        <div className='pl-6'>
          <textarea
            value={answer.customText}
            onChange={(e) => onChange({ ...answer, customText: e.target.value })}
            placeholder='답변을 입력하세요...'
            className='bg-canvas-primary border-line-primary text-fg-primary placeholder:text-fg-muted w-full rounded-lg border px-3 py-2 text-sm focus:outline-none'
            rows={2}
          />
        </div>
      )}
    </div>
  );
}

/* ── 답변 유효성 검사 ── */

function isQuestionAnswered(data: QuestionData, answer: SingleAnswer): boolean {
  const qType = data.type ?? 'single';
  if (qType === 'text') return answer.customText.trim().length > 0;
  // single / multi: 옵션이 선택되었거나 커스텀 입력이 있어야 함
  const hasOption = answer.selected.some((s) => s !== '__custom__');
  const hasCustom = answer.selected.includes('__custom__') && answer.customText.trim().length > 0;
  return hasOption || hasCustom;
}

function formatAnswers(questions: QuestionData[], answers: AnswerMap): string {
  return questions
    .map((q, i) => {
      const key = q.id ?? `q${i}`;
      const answer = answers[key] ?? EMPTY_ANSWER;
      const qType = q.type ?? 'single';

      let answerText: string;
      if (qType === 'text') {
        answerText = answer.customText.trim();
      } else {
        const parts: string[] = [];
        const optionSelections = answer.selected.filter((s) => s !== '__custom__');
        if (optionSelections.length > 0) parts.push(optionSelections.join(', '));
        if (answer.selected.includes('__custom__') && answer.customText.trim()) {
          parts.push(answer.customText.trim());
        }
        answerText = parts.join(', ');
      }

      return `${i + 1}. ${q.question}: ${answerText}`;
    })
    .join('\n');
}

/* ── Questionnaire 메인 ── */

export function Questionnaire({ questions, onSubmit }: QuestionnaireProps) {
  const [answers, setAnswers] = useState<AnswerMap>(() => {
    const initial: AnswerMap = {};
    questions.forEach((q, i) => {
      initial[q.id ?? `q${i}`] = { ...EMPTY_ANSWER };
    });
    return initial;
  });
  const [submitted, setSubmitted] = useState(false);

  const updateAnswer = useCallback(
    (key: string, answer: SingleAnswer) => {
      setAnswers((prev) => ({ ...prev, [key]: answer }));
    },
    [],
  );

  const allAnswered = questions.every((q, i) => {
    const key = q.id ?? `q${i}`;
    return isQuestionAnswered(q, answers[key] ?? EMPTY_ANSWER);
  });

  const handleSubmit = () => {
    if (!allAnswered) return;
    setSubmitted(true);
    onSubmit(formatAnswers(questions, answers));
  };

  /* 제출 완료 상태 */
  if (submitted) {
    return (
      <div className='bg-canvas-surface border-line-primary w-full rounded-xl border p-4'>
        <div className='text-fg-muted flex items-center gap-1.5 text-xs'>
          <Check className='size-3.5' />
          {questions.length}개 질문에 답변 완료
        </div>
        <div className='mt-2 flex flex-col gap-1'>
          {questions.map((q, i) => {
            const key = q.id ?? `q${i}`;
            const answer = answers[key] ?? EMPTY_ANSWER;
            const qType = q.type ?? 'single';
            let summary: string;
            if (qType === 'text') {
              summary = answer.customText.trim();
            } else {
              const parts = answer.selected
                .filter((s) => s !== '__custom__')
                .concat(
                  answer.selected.includes('__custom__') && answer.customText.trim()
                    ? [answer.customText.trim()]
                    : [],
                );
              summary = parts.join(', ');
            }
            return (
              <p key={key} className='text-fg-secondary text-xs'>
                <span className='text-fg-primary font-medium'>{q.question}</span> {summary}
              </p>
            );
          })}
        </div>
      </div>
    );
  }

  /* 질문 폼 */
  return (
    <div className='bg-canvas-surface border-line-primary w-full rounded-xl border p-4'>
      <div className='flex flex-col gap-4'>
        {questions.map((q, i) => {
          const key = q.id ?? `q${i}`;
          return (
            <QuestionItem
              key={key}
              index={i}
              data={q}
              answer={answers[key] ?? EMPTY_ANSWER}
              onChange={(a) => updateAnswer(key, a)}
            />
          );
        })}
      </div>

      {/* 제출 버튼 */}
      <div className='mt-4 flex justify-end'>
        <Button size='sm' onClick={handleSubmit} disabled={!allAnswered} className='gap-1.5'>
          <Forward className='size-3.5' />
          답변하기
        </Button>
      </div>
    </div>
  );
}
