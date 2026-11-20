import React, { useState } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';

export default function MessageInput({ onSendMessage, isLoading }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!text.trim() || isLoading) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-2.5 bg-white border-t border-[#E5E5EA] flex items-center gap-2 flex-shrink-0"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about this video..."
        disabled={isLoading}
        className="flex-1 bg-[#F2F2F7] border border-[#E5E5EA] focus:border-[#007AFF] focus:bg-white rounded-full px-3.5 py-2 text-[12px] text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all disabled:opacity-60 font-sans"
      />
      {/* Apple iMessage style circular up-arrow send button */}
      <button
        type="submit"
        disabled={!text.trim() || isLoading}
        className="w-8 h-8 rounded-full bg-[#007AFF] hover:bg-[#0062CC] active:bg-[#0051A8] disabled:opacity-30 disabled:hover:bg-[#007AFF] text-white flex items-center justify-center transition-all flex-shrink-0 shadow-[0_1px_2px_rgba(0,122,255,0.2)] cursor-pointer"
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin text-white" />
        ) : (
          <ArrowUp size={15} strokeWidth={2.5} />
        )}
      </button>
    </form>
  );
}
