'use client';

import { motion } from 'motion/react';
import { ChatInput } from '@/components/chat/ChatInput';
import { PromptSuggestions } from '@/components/chat/PromptSuggestions';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chat-store';
import { usePanelStore } from '@/stores/panel-store';

export function ChatArea() {
  const fullWidthMode = usePanelStore((s) => s.fullWidthMode);
  const setInputValue = useChatStore((s) => s.setInputValue);

  return (
    <div className='flex flex-1 flex-col justify-start px-4 pt-[12vh]'>
      <div
        className={cn(
          'mx-auto w-full transition-[max-width] duration-300 ease-in-out',
          fullWidthMode ? 'max-w-[896px]' : 'max-w-[768px]',
        )}
      >
        <div className='flex justify-center py-4'>
          <h1 className='text-fg-primary flex items-center justify-center text-4xl font-bold'>
            {['A', 'I', 'S', 'E', '\u00A0', '3', '.', '0'].map((char, i) => (
              <motion.span
                key={char}
                className='inline-block'
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 0.4,
                  repeat: Infinity,
                  repeatDelay: 5,
                  delay: i * 0.1,
                }}
              >
                {char}
              </motion.span>
            ))}
          </h1>
        </div>
        <ChatInput />
        <div className='flex flex-col items-center justify-center text-xs/5 tracking-normal'>
          <div className='text-muted-foreground'>AISE can make mistakes. Check important info.</div>
        </div>
        <PromptSuggestions rows={1} onSelect={setInputValue} />
      </div>
    </div>
  );
}
