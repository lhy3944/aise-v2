'use client';

import { ChatArea } from '@/components/chat/ChatArea';
import { use } from 'react';

export default function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  return <ChatArea sessionId={sessionId} />;
}
