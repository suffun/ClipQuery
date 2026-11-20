import React from 'react';
import { Sparkles, Loader2, AlertCircle, RefreshCw, ArrowRight, X, Clock } from 'lucide-react';
import MacAppIcon from './MacAppIcon';

function parseError(errorString) {
  if (!errorString) return null;
  const str = String(errorString);
  const lower = str.toLowerCase();

  if (lower.includes('rate limit') || lower.includes('quota') || lower.includes('429') || lower.includes('resource_exhausted')) {
    return {
      title: 'Rate Limit Reached',
      badge: 'Gemini Quota',
      description: 'You reached Google Gemini\'s free embedding rate limit (100 requests/minute). Please wait about 30 seconds and click Try Again.',
      isRateLimit: true,
      canRetry: true
    };
  }

  if (lower.includes('disabled') || lower.includes('transcript') || lower.includes('caption')) {
    return {
      title: 'Captions Not Available',
      badge: 'YouTube',
      description: 'This YouTube video does not have public captions or transcripts enabled by its creator. Please try another video with subtitles.',
      isRateLimit: false,
      canRetry: false
    };
  }

  if (lower.includes('offline') || lower.includes('econnrefused') || lower.includes('ai service is unavailable')) {
    return {
      title: 'AI Service Offline',
      badge: 'Service',
      description: 'Could not reach the backend AI service. Check that your server URL is correct and the backend/AI services are online.',
      isRateLimit: false,
      canRetry: true
    };
  }

  if (lower.includes('unavailable') || lower.includes('private')) {
    return {
      title: 'Video Restricted',
      badge: 'YouTube',
      description: 'This video is private, restricted, or deleted. Please check the video URL.',
      isRateLimit: false,
      canRetry: false
    };
  }

  return {
    title: 'Unable to Process Video',
    badge: 'Notice',
    description: str,
    isRateLimit: false,
    canRetry: true
  };
}

export default function VideoInput({
  url,
  setUrl,
  onProcess,
  onAutoDetect,
  isLoading,
  error,
  onDismissError,
  hasApiKey,
  onOpenSettings
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasApiKey) {
      if (onOpenSettings) onOpenSettings();
      return;
    }
    if (!url.trim() || isLoading) return;
    onProcess(url.trim());
  };

  const errorInfo = parseError(error);

  return (
    <div className="flex-1 flex flex-col justify-between p-4 bg-[#F5F5F7]">
      <div className="flex-1 flex flex-col justify-center">
        {/* Apple Style Icon & Header */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3">
            <MacAppIcon size={64} className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.06)]" />
          </div>
          <h2 className="text-[15px] font-semibold tracking-tight text-[#1D1D1F]">
            Chat with any YouTube Video
          </h2>
          <p className="text-[12px] text-[#86868B] mt-1 max-w-[270px] mx-auto leading-relaxed">
            Extract transcripts and ask questions with AI in real-time.
          </p>
        </div>

        {/* Missing API Key Warning Callout */}
        {!hasApiKey && (
          <div className="mb-3 p-3 bg-[#FFF9E6] border border-[#FFE8A3] rounded-2xl flex items-center justify-between gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2">
              <span className="text-[14px]">🔑</span>
              <div>
                <span className="block text-[11.5px] font-semibold text-[#1D1D1F]">
                  API Key Required
                </span>
                <span className="block text-[10px] text-[#735C00]">
                  Enter your Google Gemini key to start
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-2.5 py-1 bg-[#1D1D1F] hover:bg-black text-white text-[10.5px] font-medium rounded-lg transition-colors cursor-pointer flex-shrink-0"
            >
              Enter Key
            </button>
          </div>
        )}

        {/* Input Card */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E5EA] shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3.5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-[#6E6E73] mb-1.5 pl-0.5">
                YouTube URL or Video ID
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                disabled={isLoading}
                className="w-full bg-[#F2F2F7] border border-[#E5E5EA] focus:border-[#007AFF] focus:bg-white rounded-xl px-3.5 py-2.5 text-[12px] text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all disabled:opacity-60 font-sans"
              />
            </div>

            {/* Auto-detect button */}
            <div className="flex items-center justify-between text-[11px] px-0.5">
              <span className="text-[#86868B]">Watching a video now?</span>
              <button
                type="button"
                onClick={onAutoDetect}
                disabled={isLoading}
                className="inline-flex items-center gap-1 text-[#007AFF] hover:text-[#0062CC] font-medium transition-colors cursor-pointer"
              >
                <RefreshCw size={11} />
                Auto-detect Tab
              </button>
            </div>

            {/* Apple System Blue Action Button */}
            <button
              type="submit"
              disabled={!url.trim() || isLoading}
              className="w-full py-2.5 px-4 bg-[#007AFF] hover:bg-[#0062CC] active:bg-[#0051A8] disabled:opacity-40 disabled:hover:bg-[#007AFF] text-white rounded-xl text-[12.5px] font-medium flex items-center justify-center gap-2 transition-all shadow-[0_1px_2px_rgba(0,122,255,0.25)] cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin text-white" />
                  <span>Processing Transcript...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Process Video</span>
                  <ArrowRight size={13} className="opacity-80" />
                </>
              )}
            </button>
          </form>

          {/* Clean Apple-Style Error Card */}
          {errorInfo && (
            <div className="p-3 bg-[#FFF5F5] border border-[#FFDADA] rounded-xl flex flex-col gap-2 animate-fadeIn shadow-[0_1px_3px_rgba(255,59,48,0.06)]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-[#FF3B30]/10 flex items-center justify-center flex-shrink-0 text-[#FF3B30]">
                    {errorInfo.isRateLimit ? <Clock size={11} /> : <AlertCircle size={11} />}
                  </div>
                  <span className="text-[12px] font-semibold text-[#1D1D1F]">
                    {errorInfo.title}
                  </span>
                  <span className="text-[9px] font-medium uppercase px-1.5 py-0.2 bg-[#FF3B30]/10 text-[#FF3B30] rounded-full">
                    {errorInfo.badge}
                  </span>
                </div>

                {onDismissError && (
                  <button
                    onClick={onDismissError}
                    className="text-[#8E8E93] hover:text-[#1D1D1F] p-0.5 rounded transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <p className="text-[11px] text-[#6E6E73] leading-relaxed pl-5">
                {errorInfo.description}
              </p>

              {/* Action Retry button */}
              {errorInfo.canRetry && (
                <div className="pl-5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => onProcess(url.trim())}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#007AFF] hover:bg-[#0062CC] active:bg-[#0051A8] text-white rounded-lg text-[11px] font-medium transition-all shadow-[0_1px_2px_rgba(0,122,255,0.2)] cursor-pointer"
                  >
                    <RefreshCw size={11} className={isLoading ? "animate-spin" : ""} />
                    <span>Try Again</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer subtle hint */}
      <div className="text-center pt-2 pb-1">
        <span className="text-[10px] text-[#86868B] tracking-tight">
          Supports YouTube Videos, Shorts & youtu.be links
        </span>
      </div>
    </div>
  );
}
