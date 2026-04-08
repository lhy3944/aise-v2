'use client';

import dynamic from 'next/dynamic';

const ChatArea = dynamic(() => import('@/components/chat/ChatArea').then((m) => m.ChatArea), {
  ssr: false,
});

export default function ChatPage() {
  return <ChatArea />;
}
