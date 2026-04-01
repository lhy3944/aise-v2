'use client';

import { CornerRightUp, LightbulbIcon, RefreshCwIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface PromptCard {
  title: string;
  description: string;
}

const PROMPT_CARDS: PromptCard[] = [
  {
    title: '코드 리뷰 체크리스트',
    description:
      '효과적인 코드 리뷰를 위한 체크리스트를 만들어주세요. 성능, 보안, 가독성, 테스트 커버리지 관점에서 확인해야 할 핵심 항목은 무엇인가요?',
  },
  {
    title: '기술 부채 관리 전략',
    description:
      '팀의 기술 부채를 체계적으로 관리하는 방법을 알려주세요. 부채를 식별하고 우선순위를 정하며 점진적으로 해소하는 전략은 무엇인가요?',
  },
  {
    title: 'CI/CD 파이프라인 최적화',
    description:
      'CI/CD 파이프라인의 빌드 시간을 단축하고 안정성을 높이는 방법을 알려주세요. 캐싱, 병렬화, 단계별 최적화 전략이 궁금합니다.',
  },
  {
    title: '마이크로서비스 분리 기준',
    description:
      '모놀리식 서비스를 마이크로서비스로 분리할 때 적절한 경계를 나누는 기준은 무엇인가요? 도메인 주도 설계 관점에서 설명해주세요.',
  },
  {
    title: '장애 대응 프로세스',
    description:
      '프로덕션 장애 발생 시 효과적인 대응 프로세스를 설계해주세요. 탐지, 에스컬레이션, 복구, 사후 분석까지의 단계별 가이드가 필요합니다.',
  },
  {
    title: 'API 설계 베스트 프랙티스',
    description:
      '확장 가능하고 사용하기 쉬운 REST API를 설계하는 베스트 프랙티스를 알려주세요. 버전 관리, 에러 처리, 페이지네이션 전략이 궁금합니다.',
  },
  {
    title: '개발 생산성 측정 지표',
    description:
      'SW 개발팀의 생산성을 객관적으로 측정할 수 있는 지표는 무엇인가요? DORA 메트릭과 함께 실질적으로 유용한 측정 방법을 알려주세요.',
  },
  {
    title: '테스트 전략 수립',
    description:
      '유닛, 통합, E2E 테스트의 적절한 비율과 전략을 알려주세요. 테스트 피라미드를 실제 프로젝트에 어떻게 적용하면 좋을까요?',
  },
  {
    title: '모노레포 vs 멀티레포',
    description:
      '모노레포와 멀티레포의 장단점을 비교해주세요. 팀 규모와 프로젝트 특성에 따라 어떤 전략이 더 적합한가요?',
  },
  {
    title: '성능 병목 진단 방법',
    description:
      '웹 애플리케이션의 성능 병목을 체계적으로 진단하는 방법을 알려주세요. 프론트엔드와 백엔드 각각에서 확인해야 할 핵심 포인트는 무엇인가요?',
  },
];

const CARDS_PER_ROW = 2;
const AUTO_SLIDE_INTERVAL = 5000;

interface PromptSuggestionsProps {
  rows?: number;
  onSelect?: (prompt: string) => void;
}

export function PromptSuggestions({ rows = 2, onSelect }: PromptSuggestionsProps) {
  const count = rows * CARDS_PER_ROW;
  const totalPages = Math.ceil(PROMPT_CARDS.length / count);

  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);

  const visibleCards = PROMPT_CARDS.slice(page * count, page * count + count);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setPage((prev) => (prev + 1) % totalPages);
    }, AUTO_SLIDE_INTERVAL);
  }, [totalPages]);

  const goNext = useCallback(() => {
    setDirection(1);
    setPage((prev) => (prev + 1) % totalPages);
    startTimer();
  }, [totalPages, startTimer]);

  const handleShuffle = useCallback(() => {
    goNext();
  }, [goNext]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  return (
    <div className='mt-10 space-y-2'>
      <div className='flex items-center justify-between'>
        <div className='text-muted-foreground flex items-center gap-1.5 text-sm'>
          <LightbulbIcon className='size-5 text-red-500' fill={'currentColor'} />
          <span>이런 예시를 시도해 보세요</span>
        </div>
        <Button
          variant='ghost'
          size='sm'
          className='text-muted-foreground h-7 gap-1 text-xs'
          onClick={handleShuffle}
        >
          <RefreshCwIcon className='size-4' />
          전환
        </Button>
      </div>

      <div className='overflow-hidden'>
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.div
            key={page}
            className='grid grid-cols-2 gap-2'
            initial={{ x: direction * 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -10, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {visibleCards.map((card) => (
              <Button
                key={card.title}
                variant='ghost'
                className='group border-border hover:bg-accent relative h-auto w-full flex-col items-start rounded-lg border p-3 text-left whitespace-normal transition-colors'
                onClick={() => onSelect?.(card.description)}
              >
                <CornerRightUp className='text-muted-foreground absolute top-2.5 right-2.5 size-3.5 opacity-0 transition-opacity group-hover:opacity-100' />
                <div>
                  <p className='text-sm font-semibold'>{card.title}</p>
                  <p className='text-muted-foreground mt-1 line-clamp-2 text-xs/6'>
                    {card.description}
                  </p>
                </div>
              </Button>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
