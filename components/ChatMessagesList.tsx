import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { ChatMessageBubble } from './ChatMessageBubble';

interface ChatMessagesListProps {
  messages: ChatMessage[];
  isAiStreaming: boolean;
}

export const ChatMessagesList: React.FC<ChatMessagesListProps> = ({ messages, isAiStreaming }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      // If AI is actively streaming its response, do not automatically scroll.
      // This allows the user to scroll up or stay in position while AI types.
      if (isAiStreaming) {
        return;
      }
      // Scroll to the bottom if:
      // 1. A new message was added by the user (isAiStreaming would be false).
      // 2. The AI has finished streaming its response (isAiStreaming transitioned from true to false).
      // 3. The component initially loads with messages.
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAiStreaming]); // Depend on messages and the AI streaming state

  if (messages.length === 0) {
    return <p className="text-center text-slate-400 py-3 text-sm">見積もりに関する質問を入力してください。</p>;
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <ChatMessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};