import React, { useState, useEffect } from 'react';
import { X, Key, Eye, EyeOff, Check, ExternalLink, ShieldCheck, Server, ChevronDown } from 'lucide-react';
import {
  getStoredApiKey,
  setStoredApiKey,
  getStoredBackendUrl,
  setStoredBackendUrl,
  getDefaultBackendUrl
} from '../services/api';

export default function SettingsModal({ isOpen, onClose, onApiKeyChanged }) {
  const [apiKey, setApiKey] = useState('');
  const [backendUrl, setBackendUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const existingUrl = getStoredBackendUrl();
      setApiKey(getStoredApiKey());
      setBackendUrl(existingUrl);
      setShowAdvanced(Boolean(existingUrl));
      setError('');
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const trimmedKey = apiKey.trim();
    const trimmedUrl = backendUrl.trim();

    if (!trimmedKey) {
      setError('Please enter a valid Google Gemini API Key.');
      return;
    }

    if (trimmedUrl && !/^https?:\/\/.+/i.test(trimmedUrl)) {
      setError('Server URL must start with http:// or https://');
      setShowAdvanced(true);
      return;
    }

    setStoredApiKey(trimmedKey);
    setStoredBackendUrl(trimmedUrl);
    setSavedSuccess(true);
    setError('');
    if (onApiKeyChanged) onApiKeyChanged(trimmedKey);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setApiKey('');
    setStoredApiKey('');
    if (onApiKeyChanged) onApiKeyChanged('');
    setSavedSuccess(false);
  };

  const hasKey = Boolean(getStoredApiKey());
  const defaultBackendUrl = getDefaultBackendUrl();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-[340px] bg-white rounded-2xl border border-[#E5E5EA] shadow-[0_16px_40px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col animate-scaleUp">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#E5E5EA] flex items-center justify-between bg-[#FBFBFC]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
              <Key size={13} />
            </div>
            <h3 className="text-[13px] font-semibold text-[#1D1D1F]">
              Gemini API Key Required
            </h3>
          </div>
          {hasKey && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#8E8E93] hover:text-[#1D1D1F] hover:bg-[#F2F2F7] transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 bg-white text-[12px]">
          <p className="text-[11.5px] text-[#6E6E73] leading-relaxed">
            ClipQuery requires your personal <strong>Google Gemini API key</strong>. No shared keys are used, giving you your own private, dedicated free quota.
          </p>

          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-[#1D1D1F] mb-1.5">
                Paste Google Gemini API Key:
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="AIzaSy... (paste key here)"
                  autoFocus
                  className="w-full bg-[#F2F2F7] border border-[#E5E5EA] focus:border-[#007AFF] focus:bg-white rounded-xl pl-3 pr-8 py-2 text-[11.5px] text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#1D1D1F] p-0.5 cursor-pointer"
                >
                  {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {/* Collapsible Custom Backend Server URL */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-[10.5px] font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors cursor-pointer"
              >
                <Server size={11} />
                <span>Custom Backend URL (Optional)</span>
                <ChevronDown
                  size={11}
                  className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                />
              </button>

              {showAdvanced && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={backendUrl}
                    onChange={(e) => {
                      setBackendUrl(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder={defaultBackendUrl}
                    className="w-full bg-[#F2F2F7] border border-[#E5E5EA] focus:border-[#007AFF] focus:bg-white rounded-xl px-3 py-1.5 text-[11px] text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all font-mono"
                  />
                  <span className="block text-[9.5px] text-[#86868B] mt-1 pl-0.5">
                    Leave blank to use default: {defaultBackendUrl}
                  </span>
                </div>
              )}
            </div>

            {error && (
              <span className="block text-[10.5px] text-[#FF3B30] pl-0.5 font-medium">
                {error}
              </span>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2 px-3 bg-[#007AFF] hover:bg-[#0062CC] active:bg-[#0051A8] text-white rounded-xl text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all shadow-[0_1px_2px_rgba(0,122,255,0.2)] cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check size={13} />
                    <span>Saved & Ready!</span>
                  </>
                ) : (
                  <span>Save & Continue</span>
                )}
              </button>

              {hasKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="py-2 px-2.5 bg-[#F2F2F7] hover:bg-[#FFE5E5] text-[#6E6E73] hover:text-[#FF3B30] border border-[#E5E5EA] rounded-xl text-[11px] font-medium transition-colors cursor-pointer"
                  title="Remove Key"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {/* Privacy Note & Free Link */}
          <div className="pt-2 border-t border-[#F2F2F7] space-y-1 text-[10.5px] text-[#86868B] leading-relaxed">
            <div className="flex items-center gap-1 text-[#34C759] font-medium">
              <ShieldCheck size={12} />
              <span>Stored locally on this device only</span>
            </div>
            <p>
              Don't have a key? Google gives free API keys with no credit card required:
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#007AFF] hover:underline font-medium pt-0.5"
            >
              Get free Gemini API Key from Google AI Studio
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
