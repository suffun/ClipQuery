import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import MacAppIcon from '../components/MacAppIcon';
import VideoInput from '../components/VideoInput';
import ChatWindow from '../components/ChatWindow';
import SettingsModal from '../components/SettingsModal';
import {
  processVideoApi,
  askQuestionApi,
  clearChatHistoryApi,
  getStoredApiKey
} from '../services/api';

export default function Popup() {
  const [url, setUrl] = useState('');
  const [videoData, setVideoData] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(Boolean(getStoredApiKey()));

  // Auto-detect YouTube URL from the currently active browser tab on popup open
  const detectActiveTab = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].url) {
          const tabUrl = tabs[0].url;
          if (
            tabUrl.includes('youtube.com/watch') ||
            tabUrl.includes('youtu.be/') ||
            tabUrl.includes('youtube.com/shorts/')
          ) {
            setUrl(tabUrl);
          }
        }
      });
    }
  };

  // Restore previous session state from storage
  useEffect(() => {
    detectActiveTab();

    try {
      const savedState = localStorage.getItem('clipquery_session');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.videoData) {
          setVideoData(parsed.videoData);
          setConversationId(parsed.conversationId || null);
          setMessages(parsed.messages || []);
        }
      }
    } catch (e) {
      console.warn('Could not restore session:', e);
    }
  }, []);

  // Check API key on mount and prompt if missing
  useEffect(() => {
    const key = getStoredApiKey();
    if (!key) {
      setIsSettingsOpen(true);
    }
  }, []);

  // Save session state to localStorage on updates
  useEffect(() => {
    if (videoData) {
      localStorage.setItem(
        'clipquery_session',
        JSON.stringify({ videoData, conversationId, messages })
      );
    }
  }, [videoData, conversationId, messages]);

  // Handle video processing
  const handleProcessVideo = async (inputUrl) => {
    if (!hasCustomKey) {
      setIsSettingsOpen(true);
      return;
    }
    setIsProcessing(true);
    setError(null);

    try {
      const data = await processVideoApi(inputUrl);
      setVideoData(data);
      const newConvId = `conv_${data.videoId}_${Date.now()}`;
      setConversationId(newConvId);
      setMessages([]);
    } catch (err) {
      setError(err.message || 'Failed to process this video.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle asking a question
  const handleSendMessage = async (questionText) => {
    if (!hasCustomKey) {
      setIsSettingsOpen(true);
      return;
    }
    if (!videoData || !questionText.trim()) return;

    // Optimistically add user message to UI
    const userMessage = {
      sender: 'user',
      text: questionText,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      const result = await askQuestionApi(
        videoData.videoId,
        questionText,
        conversationId
      );

      setConversationId(result.conversationId);

      const assistantMessage = {
        sender: 'assistant',
        text: result.answer,
        sources: result.sources || [],
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = {
        sender: 'assistant',
        text: `Error: ${err.message || 'Could not generate answer.'}`,
        sources: [],
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear chat conversation
  const handleClearChat = async () => {
    if (conversationId) {
      try {
        await clearChatHistoryApi(conversationId);
      } catch (err) {
        console.warn('Error clearing backend history:', err);
      }
    }
    setMessages([]);
  };

  // Reset to input another video
  const handleResetVideo = () => {
    setVideoData(null);
    setMessages([]);
    setConversationId(null);
    setError(null);
    localStorage.removeItem('clipquery_session');
    detectActiveTab();
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#F5F5F7] text-[#1D1D1F] select-none font-sans">
      {/* Premium Apple Title Bar */}
      <header className="px-3.5 py-2.5 bg-white/95 backdrop-blur-md border-b border-[#E5E5EA] flex items-center justify-between flex-shrink-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2.5">
          <MacAppIcon size={28} />
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[13px] font-semibold tracking-tight text-[#1D1D1F]">ClipQuery</span>
              <span className="text-[9px] font-medium tracking-wide text-[#86868B] bg-[#EFEFF1] px-1.5 py-0.5 rounded-full">
                Mac Edition
              </span>
            </div>
            <span className="text-[10px] text-[#86868B] font-normal leading-tight mt-0.5">
              Don't just watch videos. Understand them.
            </span>
          </div>
        </div>

        {/* Settings button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            hasCustomKey
              ? 'bg-[#EAF2FF] text-[#007AFF] hover:bg-[#D5E6FF]'
              : 'bg-[#FFF2F2] text-[#FF3B30] hover:bg-[#FFE5E5] animate-pulse border border-[#FFD2D2]'
          }`}
          title="API Key Settings"
        >
          <Settings size={12} />
          <span>{hasCustomKey ? 'Key Active' : 'Set API Key'}</span>
        </button>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F5F5F7]">
        {videoData ? (
          <ChatWindow
            videoData={videoData}
            messages={messages}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            onResetVideo={handleResetVideo}
            isGenerating={isGenerating}
          />
        ) : (
          <VideoInput
            url={url}
            setUrl={setUrl}
            onProcess={handleProcessVideo}
            onAutoDetect={detectActiveTab}
            isLoading={isProcessing}
            error={error}
            onDismissError={() => setError(null)}
            hasApiKey={hasCustomKey}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
      </main>

      {/* API Key Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onApiKeyChanged={() => setHasCustomKey(Boolean(getStoredApiKey()))}
      />
    </div>
  );
}
