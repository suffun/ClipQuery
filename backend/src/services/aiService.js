const axios = require('axios');

const rawAiUrl = process.env.AI_SERVICE_URL;
if (process.env.NODE_ENV === 'production' && !rawAiUrl) {
  console.warn('[ClipQuery Backend] Warning: AI_SERVICE_URL is not set. Falling back to http://localhost:8000');
}
const AI_SERVICE_URL = (rawAiUrl || 'http://localhost:8000').replace(/\/+$/, '');

/**
 * Converts raw technical or third-party error dumps into friendly, actionable messages.
 */
function cleanErrorMessage(rawMessage, statusCode) {
  if (!rawMessage || typeof rawMessage !== 'string') {
    return 'An unexpected error occurred while processing the video.';
  }

  const lower = rawMessage.toLowerCase();

  // 1. Google Gemini Rate Limit or Quota Exhaustion (429)
  if (
    statusCode === 429 ||
    rawMessage.includes('RESOURCE_EXHAUSTED') ||
    rawMessage.includes('429') ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('exceeded your current quota')
  ) {
    return 'Google Gemini API rate limit reached (Free Tier allows 100 requests/min). Please wait about 30 seconds and click Try Again.';
  }

  // 2. Transcripts Disabled
  if (
    lower.includes('transcripts are disabled') ||
    lower.includes('transcriptsdisabled') ||
    lower.includes('no captions available')
  ) {
    return 'Captions are disabled by the creator for this YouTube video. Please try a video with English captions enabled.';
  }

  // 3. No Transcript Found
  if (lower.includes('notranscriptfound') || lower.includes('no transcript found')) {
    return 'No transcript or subtitles could be found for this video.';
  }

  // 4. Video Unavailable / Private
  if (lower.includes('unavailable') || lower.includes('private')) {
    return 'This YouTube video is private or unavailable.';
  }

  // 5. Invalid Video ID
  if (lower.includes('invalid youtube video id') || lower.includes('invalid video id')) {
    return 'Invalid YouTube link. Please check the video URL and try again.';
  }

  // If already clean, return as is
  return rawMessage;
}

class AIService {
  constructor() {
    this.client = axios.create({
      baseURL: AI_SERVICE_URL,
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Calls Python FastAPI service to extract transcript, split, embed, and index into FAISS.
   */
  async processVideo(videoId, apiKey = null) {
    try {
      const payload = { video_id: videoId };
      if (apiKey && typeof apiKey === 'string' && apiKey.trim()) {
        payload.api_key = apiKey.trim();
      }
      const response = await this.client.post('/process-video', payload);
      return response.data;
    } catch (error) {
      if (error.response) {
        const rawDetail = error.response.data?.detail || error.response.statusText;
        const statusCode = error.response.status;
        const friendlyMessage = cleanErrorMessage(rawDetail, statusCode);
        const err = new Error(friendlyMessage);
        err.statusCode = statusCode;
        throw err;
      } else if (error.code === 'ECONNREFUSED') {
        const err = new Error('AI Service is unavailable. Please verify the Python AI service is running and reachable.');
        err.statusCode = 503;
        throw err;
      }
      const err = new Error(cleanErrorMessage(error.message, 500));
      err.statusCode = 500;
      throw err;
    }
  }

  /**
   * Calls Python FastAPI service to answer questions with FAISS retrieval and Gemini LLM.
   */
  async askQuestion(videoId, question, apiKey = null) {
    try {
      const payload = {
        video_id: videoId,
        question: question
      };
      if (apiKey && typeof apiKey === 'string' && apiKey.trim()) {
        payload.api_key = apiKey.trim();
      }
      const response = await this.client.post('/ask', payload);
      return response.data;
    } catch (error) {
      if (error.response) {
        const rawDetail = error.response.data?.detail || error.response.statusText;
        const statusCode = error.response.status;
        const friendlyMessage = cleanErrorMessage(rawDetail, statusCode);
        const err = new Error(friendlyMessage);
        err.statusCode = statusCode;
        throw err;
      } else if (error.code === 'ECONNREFUSED') {
        const err = new Error('AI Service is unavailable. Please verify the Python AI service is running and reachable.');
        err.statusCode = 503;
        throw err;
      }
      const err = new Error(cleanErrorMessage(error.message, 500));
      err.statusCode = 500;
      throw err;
    }
  }

  /**
   * Checks if video is already indexed in the AI service.
   */
  async checkStatus(videoId) {
    try {
      const response = await this.client.get(`/video-status/${videoId}`);
      return response.data;
    } catch (error) {
      return { video_id: videoId, is_indexed: false };
    }
  }
}

module.exports = new AIService();
