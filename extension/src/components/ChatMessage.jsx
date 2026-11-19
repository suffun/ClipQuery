import React from 'react';
import { User, Play } from 'lucide-react';
import MacAppIcon from './MacAppIcon';
import { seekToVideoTimestamp } from '../services/api';

export default function ChatMessage({ message }) {
  const isUser = message.sender === 'user';

  const handleTimestampClick = (startSeconds) => {
    seekToVideoTimestamp(startSeconds);
  };

  return (
    <div className={`flex w-full mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[86%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
        {/* Avatar */}
        {isUser ? (
          <div className="w-6 h-6 rounded-full bg-[#007AFF] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_1px_2px_rgba(0,122,255,0.2)]">
            <User size={13} />
          </div>
        ) : (
          <div className="flex-shrink-0 mt-0.5">
            <MacAppIcon size={24} />
          </div>
        )}

        {/* Message Bubble */}
        <div className="flex flex-col">
          <div
            className={`px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed ${
              isUser
                ? 'bg-[#007AFF] text-white rounded-tr-xs shadow-[0_1px_3px_rgba(0,122,255,0.2)]'
                : 'bg-white text-[#1D1D1F] rounded-tl-xs border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
            }`}
          >
            <div className="whitespace-pre-wrap">{message.text}</div>
          </div>

          {/* Sources and Timestamps */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5 items-center pl-0.5">
              <span className="text-[10px] text-[#86868B] font-medium">Video Timestamps:</span>
              {message.sources.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTimestampClick(src.start)}
                  title={`Jump to ${src.timestamp} in video: ${src.text}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#EAF2FF] hover:bg-[#D5E6FF] active:bg-[#C2DCFF] text-[#007AFF] border border-[#CCE3FF] rounded-md text-[10.5px] font-medium transition-colors cursor-pointer"
                >
                  <Play size={8} className="fill-[#007AFF]" />
                  {src.timestamp}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
