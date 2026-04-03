'use client';

import { cn } from '@/lib/utils';
import type { ProjectModule } from '@/types/project';
import { AnimatePresence, motion } from 'motion/react';

const NODE_RADIUS = 16;

const NODES: {
  id: ProjectModule;
  label: string;
  description: string;
  cx: number;
  cy: number;
}[] = [
  { id: 'requirements', label: 'Req', description: '요구사항 관리 + SRS 생성', cx: 70, cy: 40 },
  { id: 'design', label: 'Design', description: 'UCD/UCS/SAD 설계 문서 생성', cx: 200, cy: 40 },
  { id: 'testcase', label: 'TC', description: '테스트 케이스 자동 생성', cx: 330, cy: 40 },
];

const EDGES: { from: ProjectModule; to: ProjectModule }[] = [
  { from: 'requirements', to: 'design' },
  { from: 'design', to: 'testcase' },
  { from: 'requirements', to: 'testcase' },
];

interface ModuleGraphProps {
  modules: ProjectModule[];
  className?: string;
}

export function ModuleGraph({ modules, className }: ModuleGraphProps) {
  function getNode(id: ProjectModule) {
    return NODES.find((n) => n.id === id)!;
  }

  const showEdges = modules.length >= 2;
  const activeEdges = showEdges
    ? EDGES.filter((e) => modules.includes(e.from) && modules.includes(e.to))
    : [];

  return (
    <div className={cn('border-line-subtle rounded-md border p-4', className)}>
      <svg viewBox='0 0 400 80' className='w-full overflow-visible'>
        <defs>
          <filter id='module-glow' x='-50%' y='-50%' width='200%' height='200%'>
            <feGaussianBlur stdDeviation='0' result='blur' />
            <feComposite in='SourceGraphic' in2='blur' operator='over' />
          </filter>
        </defs>

        {/* Nodes (먼저 그려서 아래에 위치) */}
        {NODES.map((node) => {
          const isActive = modules.includes(node.id);
          return (
            <g key={node.id} opacity={isActive ? 1 : 0.3}>
              {/* Pulse ring */}
              {isActive && (
                <motion.circle
                  cx={node.cx}
                  cy={node.cy}
                  fill='none'
                  stroke='var(--accent-primary)'
                  strokeWidth={1}
                  initial={{ r: NODE_RADIUS, opacity: 0.5 }}
                  animate={{ r: NODE_RADIUS + 10, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                />
              )}

              {/* Glow ring */}
              {/* {isActive && (
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r={NODE_RADIUS + 3}
                  fill='none'
                  stroke='var(--accent-primary)'
                  strokeWidth={1}
                  opacity={0.25}
                  filter='url(#module-glow)'
                />
              )} */}

              {/* Glow behind circle (blur만 담당) */}
              {/* {isActive && (
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r={NODE_RADIUS}
                  fill='none'
                  stroke='var(--accent-primary)'
                  strokeWidth={1}
                  opacity={0}
                  filter='url(#module-glow)'
                />
              )} */}

              {/* Main circle (선명하게, filter 없음) */}
              <circle
                cx={node.cx}
                cy={node.cy}
                r={NODE_RADIUS}
                fill='none'
                stroke={isActive ? 'var(--accent-primary)' : 'var(--line-primary)'}
                strokeWidth={1}
              />

              {/* Label inside node */}
              <text
                x={node.cx}
                y={node.cy}
                textAnchor='middle'
                dominantBaseline='central'
                className={cn(
                  'pointer-events-none text-[7px] font-semibold',
                  isActive ? 'fill-fg-primary' : 'fill-fg-muted',
                )}
              >
                {node.label}
              </text>

              {/* Description below node */}
              <text
                x={node.cx}
                y={node.cy + NODE_RADIUS + 14}
                textAnchor='middle'
                dominantBaseline='central'
                className={cn(
                  'pointer-events-none text-[8px]',
                  isActive ? 'fill-fg-secondary' : 'fill-fg-muted',
                )}
              >
                {node.description}
              </text>
            </g>
          );
        })}

        {/* Edges (나중에 그려서 노드 위에 표시) */}
        {activeEdges.map((edge) => {
          const from = getNode(edge.from);
          const to = getNode(edge.to);
          const isDirect = Math.abs(NODES.indexOf(from) - NODES.indexOf(to)) === 1;
          const x1 = from.cx + NODE_RADIUS + 4;
          const x2 = to.cx - NODE_RADIUS - 4;

          if (!isDirect) {
            // 인접하지 않은 노드는 아래쪽으로 곡선 우회
            const midX = (x1 + x2) / 2;
            const curveY = from.cy - 70;
            return (
              <path
                key={`${edge.from}-${edge.to}`}
                d={`M${x1},${from.cy} Q${midX},${curveY} ${x2},${to.cy}`}
                fill='none'
                stroke='var(--accent-primary)'
                strokeWidth={1}
                strokeDasharray='4,4'
                strokeLinecap='round'
                opacity={0.4}
              />
            );
          }

          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={x1}
              y1={from.cy}
              x2={x2}
              y2={to.cy}
              stroke='var(--accent-primary)'
              strokeWidth={1.2}
              strokeLinecap='round'
              opacity={0.8}
            />
          );
        })}
      </svg>
    </div>
  );
}
