import { Suspense } from 'react';
import { ChatWithSummary2 } from '@/components/components-chat-with-summary';

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatWithSummary2 />
    </Suspense>
  );
}
