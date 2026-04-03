'use client';

import { cn } from '@/lib/utils';
import type { ProjectModule } from '@/types/project';

const MODULE_NODES: {
  value: ProjectModule;
  label: string;
  description: string;
}[] = [
  {
    value: 'requirements',
    label: 'Requirements',
    description: '요구사항 관리 + SRS 생성',
  },
  {
    value: 'design',
    label: 'Design',
    description: 'UCD/UCS/SAD 설계 문서',
  },
  {
    value: 'testcase',
    label: 'Test Case',
    description: '테스트 케이스 자동 생성',
  },
];

// Edges: from → to
const EDGES: [ProjectModule, ProjectModule][] = [
  ['requirements', 'design'],
  ['requirements', 'testcase'],
];

interface ModuleGraphProps {
  modules: ProjectModule[];
}

export function ModuleGraph({ modules }: ModuleGraphProps) {
  return (
    <div className='border-line-subtle rounded-md border p-3'>
      {/* Desktop/Tablet: horizontal SVG graph */}
      <div className='hidden sm:block'>
        <HorizontalGraph modules={modules} />
      </div>
      {/* Mobile: vertical SVG graph */}
      <div className='block sm:hidden'>
        <VerticalGraph modules={modules} />
      </div>
    </div>
  );
}

// --- Shared animated edge styles ---
const EDGE_DASH = '6,4';
const EDGE_ANIM_DURATION = '1.2s';

function AnimatedEdge({
  x1,
  y1,
  x2,
  y2,
  active,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active: boolean;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke='currentColor'
      strokeWidth={active ? 1.5 : 1}
      strokeDasharray={EDGE_DASH}
      className={cn(
        'transition-colors duration-300',
        active ? 'text-accent-primary' : 'text-fg-muted/30',
      )}
    >
      {active && (
        <animate
          attributeName='stroke-dashoffset'
          from='20'
          to='0'
          dur={EDGE_ANIM_DURATION}
          repeatCount='indefinite'
        />
      )}
    </line>
  );
}

// --- Horizontal layout (desktop) ---
function HorizontalGraph({ modules }: { modules: ProjectModule[] }) {
  // Layout: Requirements on left, Design top-right, TestCase bottom-right
  const W = 440;
  const H = 100;

  const positions: Record<ProjectModule, { x: number; y: number }> = {
    requirements: { x: 60, y: 50 },
    design: { x: 260, y: 24 },
    testcase: { x: 260, y: 76 },
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className='h-auto w-full' aria-label='Module graph'>
      {/* Edges */}
      {EDGES.map(([from, to]) => {
        const active = modules.includes(from) && modules.includes(to);
        const nodeW = 150;
        return (
          <AnimatedEdge
            key={`${from}-${to}`}
            x1={positions[from].x + nodeW / 2}
            y1={positions[from].y}
            x2={positions[to].x - nodeW / 2}
            y2={positions[to].y}
            active={active}
          />
        );
      })}

      {/* Nodes */}
      {MODULE_NODES.map((node) => {
        const active = modules.includes(node.value);
        const pos = positions[node.value];
        return (
          <g key={node.value} className='transition-opacity duration-300'>
            <NodeBox
              x={pos.x}
              y={pos.y}
              label={node.label}
              description={node.description}
              active={active}
              width={150}
              height={32}
            />
          </g>
        );
      })}
    </svg>
  );
}

// --- Vertical layout (mobile) ---
function VerticalGraph({ modules }: { modules: ProjectModule[] }) {
  const W = 280;
  const H = 220;

  const positions: Record<ProjectModule, { x: number; y: number }> = {
    requirements: { x: 140, y: 32 },
    design: { x: 80, y: 140 },
    testcase: { x: 200, y: 140 },
  };

  const nodeW = 120;
  const nodeH = 52;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className='h-auto w-full' aria-label='Module graph'>
      {/* Edges */}
      {EDGES.map(([from, to]) => {
        const active = modules.includes(from) && modules.includes(to);
        return (
          <AnimatedEdge
            key={`${from}-${to}`}
            x1={positions[from].x}
            y1={positions[from].y + nodeH / 2}
            x2={positions[to].x}
            y2={positions[to].y - nodeH / 2}
            active={active}
          />
        );
      })}

      {/* Nodes */}
      {MODULE_NODES.map((node) => {
        const active = modules.includes(node.value);
        const pos = positions[node.value];
        return (
          <g key={node.value}>
            <MobileNodeBox
              x={pos.x}
              y={pos.y}
              label={node.label}
              description={node.description}
              active={active}
              width={nodeW}
              height={nodeH}
            />
          </g>
        );
      })}
    </svg>
  );
}

// --- Node components ---
function NodeBox({
  x,
  y,
  label,
  description,
  active,
  width,
  height,
}: {
  x: number;
  y: number;
  label: string;
  description: string;
  active: boolean;
  width: number;
  height: number;
}) {
  return (
    <g opacity={active ? 1 : 0.3} className='transition-opacity duration-300'>
      <rect
        x={x - width / 2}
        y={y - height / 2}
        width={width}
        height={height}
        rx={6}
        className={cn(
          'transition-colors duration-300',
          active ? 'fill-accent-primary/10 stroke-accent-primary' : 'fill-canvas-surface stroke-line-primary',
        )}
        strokeWidth={1}
      />
      <text
        x={x}
        y={y - 3}
        textAnchor='middle'
        className={cn(
          'text-[11px] font-semibold transition-colors duration-300',
          active ? 'fill-accent-primary' : 'fill-fg-muted',
        )}
      >
        {label}
      </text>
      <text
        x={x}
        y={y + 10}
        textAnchor='middle'
        className={cn(
          'text-[7px] transition-colors duration-300',
          active ? 'fill-fg-secondary' : 'fill-fg-muted',
        )}
      >
        {description}
      </text>
    </g>
  );
}

function MobileNodeBox({
  x,
  y,
  label,
  description,
  active,
  width,
  height,
}: {
  x: number;
  y: number;
  label: string;
  description: string;
  active: boolean;
  width: number;
  height: number;
}) {
  return (
    <g opacity={active ? 1 : 0.3} className='transition-opacity duration-300'>
      <rect
        x={x - width / 2}
        y={y - height / 2}
        width={width}
        height={height}
        rx={8}
        className={cn(
          'transition-colors duration-300',
          active ? 'fill-accent-primary/10 stroke-accent-primary' : 'fill-canvas-surface stroke-line-primary',
        )}
        strokeWidth={1}
      />
      <text
        x={x}
        y={y - 4}
        textAnchor='middle'
        className={cn(
          'text-[13px] font-semibold transition-colors duration-300',
          active ? 'fill-accent-primary' : 'fill-fg-muted',
        )}
      >
        {label}
      </text>
      <text
        x={x}
        y={y + 12}
        textAnchor='middle'
        className={cn(
          'text-[9px] transition-colors duration-300',
          active ? 'fill-fg-secondary' : 'fill-fg-muted',
        )}
      >
        {description}
      </text>
    </g>
  );
}
