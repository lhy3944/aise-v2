'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className='mt-3 flex flex-wrap gap-2'>
      {suggestions.map((text, i) => (
        <Button
          key={i}
          variant='outline'
          size='sm'
          className={cn(
            'border-line-primary text-fg-secondary hover:border-accent-primary hover:text-fg-primary',
            'h-auto max-w-[300px] gap-1.5 rounded-full px-3 py-1.5 text-left text-xs font-normal',
          )}
          onClick={() => onSelect(text)}
        >
          <span className='line-clamp-2'>{text}</span>
          <ArrowUpRight className='size-3 shrink-0 opacity-50' />
        </Button>
      ))}
    </div>
  );
}
