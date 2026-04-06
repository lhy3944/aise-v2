'use client';

import { ArtifactPanel } from '@/components/artifacts/ArtifactPanel';

export function RightPanel() {
  return (
    <div className='bg-canvas-primary flex h-full flex-col'>
      <ArtifactPanel />
    </div>
  );
}
