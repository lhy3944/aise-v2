'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowUpRight, Forward } from 'lucide-react';

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

export function SuggestionChips({
  suggestions,
  onSelect,
}: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className='mt-3 flex flex-col gap-1.5'>
      {suggestions.map((text, i) => (
        <Button
          key={i}
          variant='outline'
          className={cn(
            'border-line-primary text-fg-secondary hover:border-accent-primary hover:text-fg-primary',
            'h-auto w-full justify-start gap-1.5 rounded-md px-6! py-3 text-xs',
          )}
          onClick={() => onSelect(text)}
        >
          <span className='truncate'>{text}</span>
          <Forward className='size-3 shrink-0 opacity-50' />
        </Button>
      ))}
    </div>
  );
}
