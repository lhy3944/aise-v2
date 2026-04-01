'use client';

import { Clock, FileText, MessageSquare, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const recentSearches = [
  { icon: Clock, label: '문서 제목 1' },
  { icon: Clock, label: '문서 제목 2' },
  { icon: Clock, label: '문서 제목 3' },
];

const suggestions = [
  { icon: MessageSquare, label: '새 채팅 시작', category: 'Actions' },
  { icon: FileText, label: '코드 리뷰 요청', category: 'Actions' },
  { icon: FileText, label: '문서 검색', category: 'Actions' },
];

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) setQuery('');
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className='flex h-[480px] max-h-[85vh] w-[90vw] max-w-[540px] flex-col gap-0 overflow-hidden p-0 sm:w-full'
        showCloseButton={false}
      >
        <DialogHeader className='sr-only p-4'>
          <DialogTitle>검색</DialogTitle>
          <DialogDescription className='text-xs'>문서, 메뉴명을 검색하세요.</DialogDescription>
        </DialogHeader>
        <div className='border-line-primary flex items-center gap-3 border-b px-4 py-3'>
          <Search className='text-fg-muted h-5 w-5 shrink-0' />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='검색어를 입력하세요...'
            className='border-0 bg-transparent text-sm shadow-none focus-visible:ring-0'
          />
          <kbd className='border-line-primary bg-canvas-surface text-fg-muted pointer-events-none shrink-0 rounded border px-1.5 py-0.5 text-[10px]'>
            ESC
          </kbd>
        </div>
        <div className='flex-1 overflow-y-auto px-2 py-2'>
          {!query && (
            <>
              <div className='px-2 py-1.5'>
                <span className='text-fg-muted text-xs font-medium'>최근 검색</span>
              </div>
              {recentSearches.map((item) => (
                <button
                  key={item.label}
                  className='text-fg-secondary hover:bg-canvas-surface flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors'
                >
                  <item.icon className='text-fg-muted h-4 w-4 shrink-0' />
                  <span>{item.label}</span>
                </button>
              ))}
              <div className='mt-2 px-2 py-1.5'>
                <span className='text-fg-muted text-xs font-medium'>추천</span>
              </div>
              {suggestions.map((item) => (
                <button
                  key={item.label}
                  className='text-fg-secondary hover:bg-canvas-surface flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors'
                >
                  <item.icon className='text-fg-muted h-4 w-4 shrink-0' />
                  <span>{item.label}</span>
                </button>
              ))}
            </>
          )}
          {query && (
            <div className='flex h-full items-center justify-center'>
              <span className='text-fg-primary text-sm'>
                &quot;{query}&quot;에 대한 결과가 없습니다
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
