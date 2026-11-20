import React, { useEffect, useRef } from 'react';
import { Video, Trash2, ArrowLeft, Loader2, ChevronRight } from 'lucide-react';
import MacAppIcon from './MacAppIcon';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';

const SUGGESTED_QUESTIONS = [
  'Summarize this video',
  'What are the key takeaways?',
  'What topics are discussed?',
  'Explain the main concept'
];

export default function ChatWindow({
  videoData,
  messages,
  onSendMessage,
  onClearChat,
  onResetVideo,
  isGenerating
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F5F5F7] overflow-hidden">
      {/* Video Sub-Header Card */}
      <div className="px-3.5 py-2.5 bg-white border-b border-[#E5E5EA] flex items-center justify-between gap-2.5 flex-shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2.5 overflow-hidden flex-1">
          <button
            onClick={onResetVideo}
            title="Process another video"
            className="p-1.5 hover:bg-[#F2F2F7] rounded-lg text-[#6E6E73] hover:text-[#1D1D1F] transition-colors flex-shrink-0 cursor-pointer"
          >
            <ArrowLeft size={14} />
          </button>

          {videoData.thumbnailUrl ? (
            <img
              src={videoData.thumbnailUrl}
              alt=""
              className="w-9 h-7 object-cover rounded-lg flex-shrink-0 border border-[#E5E5EA]"
            />
          ) : (
            <div className="w-9 h-7 bg-[#F2F2F7] rounded-lg flex items-center justify-center flex-shrink-0">
              <Video size={14} className="text-[#007AFF]" />
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-semibold text-[#1D1D1F] truncate leading-tight" title={videoData.title}>
              {videoData.title || `Video ${videoData.videoId}`}
            </span>
            <span className="text-[10px] text-[#34C759] font-medium flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] inline-block animate-pulse"></span>
              Indexed & Ready
            </span>
          </div>
        </div>

        {/* Clear chat button */}
        {messages.length > 0 && (
          <button
            onClick={onClearChat}
            title="Clear conversation"
            className="p-1.5 text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FFF2F2] rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center px-4">
            <div className="flex justify-center mb-3">
              <MacAppIcon size={52} className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.06)]" />
            </div>
            <h3 className="text-[14px] font-semibold text-[#1D1D1F] tracking-tight">
              Ask ClipQuery
            </h3>
            <p className="text-[11.5px] text-[#86868B] mt-1 mb-4 leading-normal max-w-[260px]">
              Type any question below or pick a suggested topic to get started:
            </p>

            {/* Apple Style Suggested Question Pills */}
            <div className="flex flex-col gap-2 w-full max-w-[280px]">
              {SUGGESTED_QUESTIONS.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(question)}
                  className="px-3 py-2 bg-white hover:bg-[#F0F6FF] hover:border-[#007AFF]/40 active:bg-[#E5F0FF] border border-[#E5E5EA] rounded-xl text-left text-[11.5px] text-[#1D1D1F] transition-all font-medium flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer group"
                >
                  <span>{question}</span>
                  <ChevronRight size={13} className="text-[#8E8E93] group-hover:text-[#007AFF] transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}

            {/* Apple Style Thinking Indicator */}
            {isGenerating && (
              <div className="flex items-start gap-2 mb-3">
                <div className="flex-shrink-0 mt-0.5">
                  <MacAppIcon size={24} />
                </div>
                <div className="px-3.5 py-2.5 bg-white text-[#6E6E73] rounded-2xl rounded-tl-xs border border-[#E5E5EA] text-[12px] flex items-center gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                  <Loader2 size={13} className="animate-spin text-[#007AFF]" />
                  <span>ClipQuery is analyzing transcript...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input Field */}
      <MessageInput onSendMessage={onSendMessage} isLoading={isGenerating} />
    </div>
  );
}
