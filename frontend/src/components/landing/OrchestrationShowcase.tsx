'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

// === 데이터 모델 정의 ===
type OrchestrationMode = 'planning' | 'development' | 'validation';

interface ModeDetails {
  id: OrchestrationMode;
  title: string;
  description: string;
  badges: string[];
}

const MODES: ModeDetails[] = [
  {
    id: 'planning',
    title: 'Requirement & Design',
    description: 'SRS 문서를 기반으로 요구사항을 분석하고 최적의 SW 설계를 도출합니다.',
    badges: ['요구사항 명세 (SRS)', '아키텍처 설계', '자동화된 기획'],
  },
  {
    id: 'development',
    title: 'Implementation Flow',
    description: '설계된 구조에 맞춰 코드를 생성하고, 오픈소스 정책 검토를 병렬 수행합니다.',
    badges: ['코드 생성', '오픈소스 (OSS) 검증', '협업 워크플로우'],
  },
  {
    id: 'validation',
    title: 'QA & Security',
    description:
      '작성된 코드의 정적 분석 및 보안 취약점을 점검하고, 테스트 케이스를 자동 생성합니다.',
    badges: ['정적 분석', '보안 취약점 스캔', '테스트 케이스 생성'],
  },
];

// === SVG 네트워크 그래프용 점 좌표 정의 (뷰박스 400x400 기준 중앙=200,200) ===
const CENTER_NODE = { x: 200, y: 200, label: 'AISE' };

const NODES = {
  srs: { x: 200, y: 50, label: 'SRS' },
  design: { x: 70, y: 130, label: 'Design' },
  developer: { x: 330, y: 130, label: 'Developer' },
  oss: { x: 60, y: 270, label: 'Open Source' },
  security: { x: 340, y: 270, label: 'Security' },
  qa: { x: 200, y: 350, label: 'Testcase' },
};

export interface OrchestrationShowcaseProps {
  /** 자동으로 모드가 순환할지 여부 */
  autoPlay?: boolean;
  /** 자동 순환 간격 (밀리초 단위, 기본값 5000ms) */
  interval?: number;
}

export function OrchestrationShowcase({
  autoPlay = false,
  interval = 5000,
}: OrchestrationShowcaseProps) {
  const [activeMode, setActiveMode] = useState<OrchestrationMode>('planning');

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setActiveMode((current) => {
        const currentIndex = MODES.findIndex((m) => m.id === current);
        const nextIndex = (currentIndex + 1) % MODES.length;
        return MODES[nextIndex].id;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, activeMode]);

  const activeModeData = MODES.find((m) => m.id === activeMode) || MODES[0];

  return (
    <section className='bg-canvas-primary text-fg-primary w-full px-4 py-16 transition-colors duration-300'>
      <div className='mx-auto flex max-w-6xl flex-col items-center justify-between gap-12 lg:flex-row lg:gap-24'>
        {/* === 좌측: SVG 애니메이션 영역 === */}
        <div className='relative flex w-full max-w-md items-center justify-center lg:w-1/2'>
          {/* 중앙 강조 글로우 이펙트 (동적 색상 및 펄스 적용) */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className={`pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-colors duration-500 ${activeMode === 'planning' ? 'bg-blue-500/20 dark:bg-blue-500/30' : ''} ${activeMode === 'development' ? 'bg-teal-500/20 dark:bg-teal-500/30' : ''} ${activeMode === 'validation' ? 'bg-purple-500/20 dark:bg-purple-500/30' : ''} `}
          />

          <svg viewBox='0 0 400 400' className='h-auto w-full max-w-[400px] overflow-visible'>
            <defs>
              <filter id='glow' x='-50%' y='-50%' width='200%' height='200%'>
                <feGaussianBlur stdDeviation='4' result='blur' />
                <feComposite in='SourceGraphic' in2='blur' operator='over' />
              </filter>
            </defs>

            {/* 1. 연결 선 (Edges) */}
            <AnimatePresence mode='popLayout'>
              {activeMode === 'planning' && (
                <motion.g
                  key='planning-lines'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                >
                  <motion.line
                    x1={CENTER_NODE.x}
                    y1={CENTER_NODE.y}
                    x2={NODES.srs.x}
                    y2={NODES.srs.y}
                    stroke='currentColor'
                    strokeWidth='2'
                    className='text-blue-500 dark:text-blue-400'
                    filter='url(#glow)'
                    strokeDasharray='5,5'
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                  />
                  <motion.line
                    x1={CENTER_NODE.x}
                    y1={CENTER_NODE.y}
                    x2={NODES.design.x}
                    y2={NODES.design.y}
                    stroke='currentColor'
                    strokeWidth='2'
                    className='text-blue-500 dark:text-blue-400'
                    filter='url(#glow)'
                    strokeDasharray='5,5'
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 0.8,
                      ease: 'easeInOut',
                      delay: 0.1,
                    }}
                  />
                  <motion.line
                    x1={NODES.srs.x}
                    y1={NODES.srs.y}
                    x2={NODES.design.x}
                    y2={NODES.design.y}
                    stroke='currentColor'
                    strokeWidth='1'
                    className='text-blue-500/50 dark:text-blue-400/50'
                    strokeDasharray='3,3'
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 0.8,
                      ease: 'easeInOut',
                      delay: 0.2,
                    }}
                  />
                </motion.g>
              )}
              {activeMode === 'development' && (
                <motion.g
                  key='development-lines'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                >
                  <motion.line
                    x1={CENTER_NODE.x}
                    y1={CENTER_NODE.y}
                    x2={NODES.developer.x}
                    y2={NODES.developer.y}
                    stroke='currentColor'
                    strokeWidth='2'
                    className='text-teal-500 dark:text-teal-400'
                    filter='url(#glow)'
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                  />
                  <motion.line
                    x1={CENTER_NODE.x}
                    y1={CENTER_NODE.y}
                    x2={NODES.oss.x}
                    y2={NODES.oss.y}
                    stroke='currentColor'
                    strokeWidth='2'
                    className='text-teal-500 dark:text-teal-400'
                    filter='url(#glow)'
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 0.8,
                      ease: 'easeInOut',
                      delay: 0.2,
                    }}
                  />
                  <motion.line
                    x1={NODES.design.x}
                    y1={NODES.design.y}
                    x2={NODES.developer.x}
                    y2={NODES.developer.y}
                    stroke='currentColor'
                    strokeWidth='1'
                    className='text-teal-500/60 dark:text-teal-400/60'
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 0.8,
                      ease: 'easeInOut',
                      delay: 0.4,
                    }}
                  />
                </motion.g>
              )}
              {activeMode === 'validation' && (
                <motion.g
                  key='validation-lines'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                >
                  <motion.line
                    x1={CENTER_NODE.x}
                    y1={CENTER_NODE.y}
                    x2={NODES.security.x}
                    y2={NODES.security.y}
                    stroke='currentColor'
                    strokeWidth='2'
                    className='text-purple-500 dark:text-purple-400'
                    filter='url(#glow)'
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8 }}
                  />
                  <motion.line
                    x1={CENTER_NODE.x}
                    y1={CENTER_NODE.y}
                    x2={NODES.qa.x}
                    y2={NODES.qa.y}
                    stroke='currentColor'
                    strokeWidth='2'
                    className='text-purple-500 dark:text-purple-400'
                    filter='url(#glow)'
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8 }}
                  />
                  <motion.line
                    x1={NODES.developer.x}
                    y1={NODES.developer.y}
                    x2={NODES.security.x}
                    y2={NODES.security.y}
                    stroke='currentColor'
                    strokeWidth='1'
                    className='text-purple-500/60 dark:text-purple-400/60'
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                  <motion.line
                    x1={NODES.developer.x}
                    y1={NODES.developer.y}
                    x2={NODES.qa.x}
                    y2={NODES.qa.y}
                    stroke='currentColor'
                    strokeWidth='1'
                    className='text-purple-500/60 dark:text-purple-400/60'
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </motion.g>
              )}
            </AnimatePresence>

            {/* 2. 중앙 노드 (원형 배경) 및 라벨 */}
            <motion.circle
              cx={CENTER_NODE.x}
              cy={CENTER_NODE.y}
              r='48'
              fill='currentColor'
              className={`transition-colors duration-500 ${activeMode === 'planning' ? 'text-blue-500/10' : ''} ${activeMode === 'development' ? 'text-teal-500/10' : ''} ${activeMode === 'validation' ? 'text-purple-500/10' : ''} `}
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              filter='url(#glow)'
            />
            <motion.circle
              cx={CENTER_NODE.x}
              cy={CENTER_NODE.y}
              r='40'
              fill='var(--bg-primary)'
              stroke='currentColor'
              strokeWidth='2'
              className={`transition-colors duration-500 ${activeMode === 'planning' ? 'text-blue-500 dark:text-blue-400' : ''} ${activeMode === 'development' ? 'text-teal-500 dark:text-teal-400' : ''} ${activeMode === 'validation' ? 'text-purple-500 dark:text-purple-400' : ''} `}
              filter='url(#glow)'
            />
            <text
              x={CENTER_NODE.x}
              y={CENTER_NODE.y}
              textAnchor='middle'
              dominantBaseline='middle'
              className='fill-fg-primary text-sm font-bold'
            >
              {CENTER_NODE.label}
            </text>

            {/* 3. 각 모드에 해당하는 주변 노드 표기 */}
            {[NODES.srs, NODES.design, NODES.developer, NODES.oss, NODES.security, NODES.qa].map(
              (node) => {
                // 노드의 활성화 여부 계산 (현재 모드에 맞춰 색상 다르게)
                const isActiveInPlanning =
                  activeMode === 'planning' && (node === NODES.srs || node === NODES.design);
                const isActiveInDev =
                  activeMode === 'development' &&
                  (node === NODES.developer || node === NODES.oss || node === NODES.design);
                const isActiveInVal =
                  activeMode === 'validation' &&
                  (node === NODES.security || node === NODES.qa || node === NODES.developer);

                const isActive = isActiveInPlanning || isActiveInDev || isActiveInVal;

                const activeColorClass = isActiveInPlanning
                  ? 'text-blue-500 dark:text-blue-400'
                  : isActiveInDev
                    ? 'text-teal-500 dark:text-teal-400'
                    : isActiveInVal
                      ? 'text-purple-500 dark:text-purple-400'
                      : 'text-line-primary dark:text-line-subtle';

                return (
                  <motion.g
                    key={node.label}
                    initial={{ opacity: isActive ? 1 : 0.4 }}
                    animate={{ opacity: isActive ? 1 : 0.4 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* 활성화된 노드의 펄스 효과 */}
                    {isActive && (
                      <motion.circle
                        cx={node.x}
                        cy={node.y}
                        r='30'
                        fill='currentColor'
                        className={activeColorClass}
                        initial={{ opacity: 0.4, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.6 }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeOut',
                        }}
                      />
                    )}
                    <motion.circle
                      cx={node.x}
                      cy={node.y}
                      r='30'
                      fill='transparent'
                      stroke='currentColor'
                      strokeWidth='2'
                      className={activeColorClass}
                      filter={isActive ? 'url(#glow)' : undefined}
                    />
                    <text
                      x={node.x}
                      y={node.y - 40}
                      textAnchor='middle'
                      className={`text-xs font-semibold ${isActive ? 'fill-fg-primary' : 'fill-fg-secondary'}`}
                    >
                      {node.label}
                    </text>
                  </motion.g>
                );
              },
            )}
          </svg>

          {/* 모바일 화면을 위해 하단에 현재 모드 이름 표기 (데스크탑에선 생략) */}
          <div className='text-fg-muted absolute bottom-[-10px] text-sm font-bold tracking-[0.2em] uppercase lg:hidden'>
            {activeModeData.title}
          </div>
        </div>

        {/* === 우측: 조작부 및 텍스트 전환 영역 === */}
        <div className='z-10 flex w-full flex-1 flex-col items-center space-y-8 lg:max-w-xl lg:items-start'>
          {/* 모드 선택기 버튼형 탭 (글씨가 길어져서 레이아웃 조정) */}
          <div className='bg-canvas-secondary flex w-fit flex-wrap justify-center gap-1 rounded-3xl p-1 lg:justify-start'>
            {MODES.map((mode) => {
              const isActive = activeMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  className={`relative z-10 rounded-full px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors duration-200 sm:px-6 sm:text-sm ${
                    isActive ? 'text-canvas-primary' : 'text-fg-secondary hover:text-fg-primary'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId='showcase-active-tab'
                      className='bg-fg-primary absolute inset-0 -z-10 rounded-full'
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                  {mode.title}
                </button>
              );
            })}
          </div>

          {/* 슬라이드 업 텍스트 컨테이너 (고정 높이로 밀림 현상 방지) */}
          <div className='pointer-events-none relative min-h-[160px] w-full overflow-hidden text-center lg:text-left'>
            <AnimatePresence mode='wait'>
              <motion.div
                key={activeMode}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className='pointer-events-auto absolute inset-0 flex flex-col gap-4 px-2'
              >
                <h3 className='text-fg-primary text-2xl font-bold tracking-tight'>
                  {activeModeData.title}
                </h3>
                <p className='text-md text-fg-secondary break-keep'>{activeModeData.description}</p>
                <div className='mt-2 flex flex-wrap justify-center gap-2 sm:gap-3 lg:justify-start'>
                  {activeModeData.badges.map((badge, idx) => (
                    <span
                      key={idx}
                      className='border-line-primary bg-canvas-primary text-fg-secondary rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap'
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
