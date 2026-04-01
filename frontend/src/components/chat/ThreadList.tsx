'use client';

import { useEffect, useState } from 'react';
import { ThreadItem } from '@/components/chat/ThreadItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatStore } from '@/stores/chat-store';

const SKELETON_WIDTHS = [72, 58, 85, 63, 91, 54, 78, 67];

function ThreadListSkeleton() {
  return (
    <div className='flex flex-col gap-1.5 px-1'>
      {SKELETON_WIDTHS.map((width, i) => (
        <div key={i} className='flex items-center gap-2 px-2.5 py-2'>
          <Skeleton className='h-3.5 w-3.5 shrink-0 rounded' />
          <Skeleton className='h-3.5 rounded' style={{ width: `${width}%` }} />
        </div>
      ))}
    </div>
  );
}

export function ThreadList() {
  const threads = useChatStore((s) => s.threads);
  const activeThreadId = useChatStore((s) => s.activeThreadId);
  const setActiveThread = useChatStore((s) => s.setActiveThread);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScrollArea type='always' className='flex-1 overflow-hidden'>
      {isLoading ? (
        <ThreadListSkeleton />
      ) : (
        <div className='flex flex-col gap-2 pr-2.5'>
          {threads.map((thread) => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              isActive={thread.id === activeThreadId}
              onClick={() => setActiveThread(thread.id)}
            />
          ))}
        </div>
      )}
    </ScrollArea>
  );
}
