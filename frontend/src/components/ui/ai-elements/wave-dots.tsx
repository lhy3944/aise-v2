'use client';

import { cn } from '@/lib/utils';

interface WaveDotsProps {
  className?: string;
  dotClassName?: string;
}

export function WaveDots({ className, dotClassName }: WaveDotsProps) {
  return (
    <div className={cn('inline-flex items-center gap-1 text-fg-muted', className)} aria-hidden>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={cn(
            'size-1.5 rounded-full bg-current animate-bounce [animation-duration:900ms]',
            dotClassName,
          )}
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </div>
  );
}
