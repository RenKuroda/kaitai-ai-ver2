import React, { useState } from 'react';

interface ChatInputAreaProps {
  onSendMessage: (messageText: string) => void;
  disabled?: boolean;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({ onSendMessage, disabled }) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  // Removed handleKeyDown function and onKeyDown prop from textarea

  return (
    <form onSubmit={handleSubmit} className="flex items-start space-x-2 mt-2">
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        // onKeyDown={handleKeyDown} // Removed this line
        placeholder="AIに質問する..."
        className="flex-grow p-2.5 border border-slate-500 rounded-lg bg-slate-800 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none shadow-sm"
        rows={2}
        disabled={disabled}
        aria-label="チャットメッセージ入力"
      />
      <button
        type="submit"
        disabled={disabled || !inputText.trim()}
        className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 ease-in-out self-end"
        aria-label="メッセージを送信"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
        </svg>
      </button>
    </form>
  );
};