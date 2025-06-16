
import React from 'react';
import { ChatMessage } from '../types';
import { ChatMessagesList } from './ChatMessagesList';
import { ChatInputArea } from './ChatInputArea';
import { ErrorMessage } from './ErrorMessage';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (messageText: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading, error, onSendMessage }) => {
  return (
    <div className="p-3 sm:p-4"> {/* Removed mt-4, adjusted padding for fixed panel context */}
      <h3 className="text-lg font-semibold text-sky-300 mb-3 px-1">AIチャット</h3>
      <div className="max-h-[calc(60vh-180px)] sm:max-h-[calc(60vh-200px)] overflow-y-auto mb-3 p-2 bg-slate-900/60 rounded-md" aria-live="polite" aria-atomic="false"> {/* Adjusted max-h for better UX */}
        <ChatMessagesList messages={messages} isAiStreaming={isLoading} />
        {isLoading && messages.length > 0 && messages[messages.length-1].role === 'user' && (
           <div className="flex items-center justify-start p-2">
            <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mr-2"></div>
            <p className="text-sm text-slate-400">AIが応答を生成中...</p>
          </div>
        )}
      </div>
      {error && <ErrorMessage message={error} />}
      <ChatInputArea onSendMessage={onSendMessage} disabled={isLoading} />
       <p className="mt-2 text-xs text-slate-400 px-1">
        AIの応答は状況によって不正確な場合があります。重要な判断は専門家にご相談ください。
      </p>
    </div>
  );
};
