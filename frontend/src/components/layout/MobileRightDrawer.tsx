'use client';

import { PanelRightOpen, X } from 'lucide-react';
import { useState } from 'react';
import { RightPanel } from '@/components/layout/RightPanel';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

export function MobileRightDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <Drawer direction='right' open={open} onOpenChange={setOpen}>
      <Button
        onClick={() => setOpen(true)}
        variant='ghost'
        size='icon'
        className='text-icon-default hover:text-icon-active h-9 w-9 lg:hidden'
      >
        <PanelRightOpen className='h-5 w-5' />
      </Button>

      <DrawerContent
        className='border-line-primary bg-canvas-primary top-15! bottom-0! flex h-auto w-[85vw] flex-col border-l p-0 sm:w-[380px]'
        overlayClassName='top-15!'
      >
        <DrawerHeader className='border-line-primary flex flex-row items-center justify-between border-b p-3'>
          <DrawerTitle className='text-fg-primary text-base font-semibold'></DrawerTitle>
          <DrawerDescription />
          <DrawerClose asChild>
            <Button variant='ghost' size='icon' className='text-fg-secondary h-8 w-8'>
              <X className='h-4 w-4' />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className='flex-1 overflow-hidden'>
          <RightPanel />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
