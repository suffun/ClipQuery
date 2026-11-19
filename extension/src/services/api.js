const DEFAULT_BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const API_KEY_STORAGE_KEY = 'clipquery_custom_gemini_key';
const BACKEND_URL_STORAGE_KEY = 'clipquery_backend_url';

function normalizeApiUrl(rawUrl) {
  const cleaned = (rawUrl || '').trim().replace(/\/+$/, '');
  if (!cleaned) return '';
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
}

export function getDefaultBackendUrl() {
  return normalizeApiUrl(DEFAULT_BACKEND_URL) || 'http://localhost:8080/api';
}

export function getStoredBackendUrl() {
  try {
    return localStorage.getItem(BACKEND_URL_STORAGE_KEY) || '';
  } catch (e) {
    return '';
  }
}

export function setStoredBackendUrl(url) {
  try {
    const cleaned = (url || '').trim().replace(/\/+$/, '');
    if (!cleaned) {
      localStorage.removeItem(BACKEND_URL_STORAGE_KEY);
    } else {
      localStorage.setItem(BACKEND_URL_STORAGE_KEY, cleaned);
    }
  } catch (e) {
    console.warn('Failed to save backend URL to localStorage:', e);
  }
}

export function getEffectiveBackendUrl() {
  const stored = normalizeApiUrl(getStoredBackendUrl());
  return stored || getDefaultBackendUrl();
}

/**
 * Retrieves user's custom Gemini API key from localStorage.
 */
export function getStoredApiKey() {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  } catch (e) {
    return '';
  }
}

/**
 * Saves or removes user's custom Gemini API key in localStorage.
 */
export function setStoredApiKey(key) {
  try {
    if (!key || !key.trim()) {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    } else {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    }
  } catch (e) {
    console.warn('Failed to save API key to localStorage:', e);
  }
}

function getRequestHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const customKey = getStoredApiKey();
  if (customKey) {
    headers['x-gemini-api-key'] = customKey;
  }
  return headers;
}

async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {
      error: `Server returned an unexpected response (HTTP ${response.status}).`
    };
  }
}

/**
 * Sends a YouTube URL to the backend to extract transcript and build FAISS index.
 */
export async function processVideoApi(url) {
  const response = await fetch(`${getEffectiveBackendUrl()}/videos/process`, {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify({ url })
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data.error || 'Failed to process video.');
  }
  return data.data;
}

/**
 * Sends a question for a processed video to the backend.
 */
export async function askQuestionApi(videoId, question, conversationId = null) {
  const response = await fetch(`${getEffectiveBackendUrl()}/chat`, {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify({ videoId, question, conversationId })
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data.error || 'Failed to get answer from AI.');
  }
  return data.data;
}

/**
 * Clears chat history for a conversation.
 */
export async function clearChatHistoryApi(conversationId) {
  const response = await fetch(`${getEffectiveBackendUrl()}/chat/${conversationId}`, {
    method: 'DELETE',
    headers: getRequestHeaders()
  });
  return parseJsonSafe(response);
}

/**
 * Sends a message to the active YouTube tab to jump the video to a specific timestamp.
 */
export function seekToVideoTimestamp(seconds) {
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: 'SEEK_VIDEO',
            seconds: Number(seconds)
          },
          () => {
            // Suppress expected error if active tab is not a YouTube video page
            void chrome.runtime.lastError;
          }
        );
      }
    });
  }
}
