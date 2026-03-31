'use client';

import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ModalOptions } from '@/stores/overlay-store';

const SIZE_CLASSES: Record<NonNullable<ModalOptions['size']>, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[520px]',
  lg: 'max-w-[640px]',
  xl: 'max-w-[800px]',
};

interface ModalProps extends Omit<ModalOptions, 'content'> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  onClose,
}: ModalProps) {
  const handleOpenChange = (next: boolean) => {
    if (!next) onClose?.();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn('flex flex-col gap-0 p-0', SIZE_CLASSES[size])}
        showCloseButton={showCloseButton}
      >
        {(title || description) && (
          <DialogHeader className='border-line-primary border-b px-6 py-4'>
            {title && (
              <DialogTitle className='text-fg-primary text-base font-semibold'>{title}</DialogTitle>
            )}
            {description && (
              <DialogDescription className='text-fg-secondary text-sm'>
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}

        <div className='flex-1 overflow-y-auto px-6 py-5'>{children}</div>

        {footer && (
          <DialogFooter className='border-line-primary border-t px-6 py-4'>{footer}</DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
