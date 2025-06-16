import React from 'react';
import { ChatMessage } from '../types';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

// Basic markdown-to-HTML (bold, italic, newlines)
const formatMessageText = (text: string) => {
    // Replace **text** with <strong>text</strong>
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Replace *text* or _text_ with <em>text</em>
    html = html.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');
    // Replace newlines with <br>
    html = html.replace(/\n/g, '<br />');
    return { __html: html };
};


export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const formattedTime = new Date(message.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl shadow ${
          isUser 
            ? 'bg-sky-500 text-white rounded-br-none'  // Changed from bg-sky-600
            : 'bg-slate-500 text-slate-100 rounded-bl-none' // Changed from bg-slate-600
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words" dangerouslySetInnerHTML={formatMessageText(message.text)} />
        <p className={`text-xs mt-1 ${isUser ? 'text-sky-100 text-right' : 'text-slate-300 text-left'}`}> {/* Adjusted text color for new background */}
          {formattedTime}
        </p>
      </div>
    </div>
  );
};