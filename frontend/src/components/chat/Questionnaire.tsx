'use client';

import { AnimatePresence, motion } from 'motion/react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, Check, CheckSquare, ChevronLeft, Forward, HelpCircle, Square } from 'lucide-react';
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
  selected: string[];
  customText: string;
}

const EMPTY_ANSWER: SingleAnswer = { selected: [], customText: '' };

/* ── 개별 질문 렌더러 ── */

function QuestionItem({
  data,
  answer,
  onChange,
}: {
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
    <div className='flex flex-col gap-3'>
      {/* 질문 */}
      <div className='flex items-start gap-2'>
        <HelpCircle className='text-accent-primary mt-0.5 size-4 shrink-0' />
        <p className='text-fg-primary text-sm font-medium'>{data.question}</p>
      </div>

      {/* 옵션 (single / multi) */}
      {qType !== 'text' && options.length > 0 && (
        <div className='flex flex-col gap-1.5'>
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
                      isSelected ? 'border-accent-primary bg-accent-primary' : 'border-line-primary',
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
        <div className='flex flex-col gap-1.5'>
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
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                onChange({ ...answer, customText: e.target.value })
              }
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
        <textarea
          value={answer.customText}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            onChange({ ...answer, customText: e.target.value })
          }
          placeholder='답변을 입력하세요...'
          className='bg-canvas-primary border-line-primary text-fg-primary placeholder:text-fg-muted w-full rounded-lg border px-3 py-2 text-sm focus:outline-none'
          rows={2}
        />
      )}
    </div>
  );
}

/* ── 유틸리티 ── */

function isQuestionAnswered(data: QuestionData, answer: SingleAnswer): boolean {
  const qType = data.type ?? 'single';
  if (qType === 'text') return answer.customText.trim().length > 0;
  const hasOption = answer.selected.some((s) => s !== '__custom__');
  const hasCustom = answer.selected.includes('__custom__') && answer.customText.trim().length > 0;
  return hasOption || hasCustom;
}

function getAnswerSummary(data: QuestionData, answer: SingleAnswer): string {
  const qType = data.type ?? 'single';
  if (qType === 'text') return answer.customText.trim();
  const parts = answer.selected
    .filter((s) => s !== '__custom__')
    .concat(
      answer.selected.includes('__custom__') && answer.customText.trim()
        ? [answer.customText.trim()]
        : [],
    );
  return parts.join(', ');
}

function formatAnswers(questions: QuestionData[], answers: AnswerMap): string {
  return questions
    .map((q, i) => {
      const key = q.id ?? `q${i}`;
      const answer = answers[key] ?? EMPTY_ANSWER;
      return `${i + 1}. ${q.question}: ${getAnswerSummary(q, answer)}`;
    })
    .join('\n');
}

/* ── Questionnaire 메인 (스텝별 위저드) ── */

export function Questionnaire({ questions, onSubmit }: QuestionnaireProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>(() => {
    const initial: AnswerMap = {};
    questions.forEach((q, i) => {
      initial[q.id ?? `q${i}`] = { ...EMPTY_ANSWER };
    });
    return initial;
  });
  const [submitted, setSubmitted] = useState(false);
  const [direction, setDirection] = useState(1); // 1=forward, -1=back

  const total = questions.length;
  const isSingle = total === 1;
  const isLast = step === total - 1;
  const currentQ = questions[step];
  const currentKey = currentQ.id ?? `q${step}`;
  const currentAnswer = answers[currentKey] ?? EMPTY_ANSWER;
  const currentAnswered = isQuestionAnswered(currentQ, currentAnswer);

  const updateAnswer = useCallback(
    (key: string, answer: SingleAnswer) => {
      setAnswers((prev: AnswerMap) => ({ ...prev, [key]: answer }));
    },
    [],
  );

  const goNext = () => {
    if (!currentAnswered) return;
    if (isLast) {
      setSubmitted(true);
      onSubmit(formatAnswers(questions, answers));
    } else {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  /* 제출 완료 상태 */
  if (submitted) {
    return (
      <div className='bg-canvas-surface border-line-primary w-full rounded-xl border p-4'>
        <div className='text-fg-muted flex items-center gap-1.5 text-xs'>
          <Check className='size-3.5' />
          {total}개 질문에 답변 완료
        </div>
        <div className='mt-2 flex flex-col gap-1'>
          {questions.map((q, i) => {
            const key = q.id ?? `q${i}`;
            const answer = answers[key] ?? EMPTY_ANSWER;
            return (
              <p key={key} className='text-fg-secondary text-xs'>
                <span className='text-fg-primary font-medium'>{q.question}</span>{' '}
                {getAnswerSummary(q, answer)}
              </p>
            );
          })}
        </div>
      </div>
    );
  }

  /* 스텝별 위저드 */
  return (
    <div className='bg-canvas-surface border-line-primary w-full overflow-hidden rounded-xl border'>
      {/* 상단: 스텝 인디케이터 */}
      {!isSingle && (
        <div className='border-line-primary flex items-center gap-2 border-b px-4 py-2.5'>
          {/* 스텝 도트 */}
          <div className='flex items-center gap-1.5'>
            {questions.map((_, i) => {
              const key = questions[i].id ?? `q${i}`;
              const answered = isQuestionAnswered(questions[i], answers[key] ?? EMPTY_ANSWER);
              return (
                <div
                  key={i}
                  className={cn(
                    'size-2 rounded-full transition-colors',
                    i === step
                      ? 'bg-accent-primary'
                      : answered
                        ? 'bg-accent-primary/40'
                        : 'bg-fg-muted/30',
                  )}
                />
              );
            })}
          </div>
          <span className='text-fg-muted text-xs'>
            {step + 1} / {total}
          </span>
        </div>
      )}

      {/* 질문 영역 — 애니메이션 전환 */}
      <div className='relative p-4'>
        <AnimatePresence mode='wait' initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <QuestionItem
              data={currentQ}
              answer={currentAnswer}
              onChange={(a) => updateAnswer(currentKey, a)}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 하단: 네비게이션 */}
      <div className='border-line-primary flex items-center justify-between border-t px-4 py-2.5'>
        <div>
          {!isSingle && step > 0 && (
            <Button variant='ghost' size='sm' onClick={goBack} className='gap-1 text-xs'>
              <ChevronLeft className='size-3.5' />
              이전
            </Button>
          )}
        </div>
        <Button size='sm' onClick={goNext} disabled={!currentAnswered} className='gap-1.5'>
          {isLast ? (
            <>
              <Forward className='size-3.5' />
              답변하기
            </>
          ) : (
            <>
              다음
              <ArrowRight className='size-3.5' />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
