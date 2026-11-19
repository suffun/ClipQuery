const Video = require('../models/Video');
const aiService = require('../services/aiService');
const { extractVideoId, fetchVideoMetadata } = require('../utils/youtube');

/**
 * POST /api/videos/process
 * Accepts YouTube URL or video ID, validates it, indexes with FastAPI, and saves to MongoDB.
 */
exports.processVideo = async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'YouTube URL or video ID is required in request body.'
      });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid YouTube URL. Please provide a valid watch, youtu.be, or shorts link.'
      });
    }

    // Check if video is already processed in MongoDB
    let video = await Video.findOne({ videoId });

    // Fetch video title and thumbnail from YouTube's public oEmbed API
    const meta = await fetchVideoMetadata(videoId);

    if (!video) {
      video = new Video({
        videoId,
        title: meta.title,
        authorName: meta.authorName,
        thumbnailUrl: meta.thumbnailUrl,
        originalUrl: url,
        status: 'processing'
      });
      await video.save();
    } else {
      video.title = meta.title || video.title;
      video.authorName = meta.authorName || video.authorName;
      video.thumbnailUrl = meta.thumbnailUrl || video.thumbnailUrl;
      video.status = 'processing';
      await video.save();
    }

    // Require user-provided Gemini API key
    const customApiKey = (req.headers['x-api-key'] || req.headers['x-gemini-api-key'] || req.body.apiKey || '').trim();

    if (!customApiKey) {
      return res.status(401).json({
        success: false,
        error: 'Please enter your Google Gemini API key in the extension settings to continue.'
      });
    }

    // Call Python FastAPI service to extract transcript and build FAISS index
    const aiResult = await aiService.processVideo(videoId, customApiKey);

    // Update MongoDB record upon success
    video.status = 'completed';
    video.totalChunks = aiResult.total_chunks || video.totalChunks;
    video.errorMessage = null;
    await video.save();

    return res.status(200).json({
      success: true,
      message: aiResult.message || 'Video processed and ready for questions.',
      data: {
        videoId: video.videoId,
        title: video.title,
        authorName: video.authorName,
        thumbnailUrl: video.thumbnailUrl,
        totalChunks: video.totalChunks,
        cached: aiResult.cached,
        status: video.status
      }
    });
  } catch (error) {
    // If we have a video record, update its status to failed
    try {
      const videoId = extractVideoId(req.body.url);
      if (videoId) {
        await Video.findOneAndUpdate(
          { videoId },
          { status: 'failed', errorMessage: error.message },
          { upsert: true }
        );
      }
    } catch (saveErr) {
      console.error('Error recording video failure:', saveErr.message);
    }

    next(error);
  }
};

/**
 * GET /api/videos/:videoId
 * Returns video processing status and metadata.
 */
exports.getVideo = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const cleanId = extractVideoId(videoId) || videoId;

    let video = await Video.findOne({ videoId: cleanId });

    if (!video) {
      // Check if it's indexed in FastAPI directly
      const aiStatus = await aiService.checkStatus(cleanId);
      if (aiStatus.is_indexed) {
        const meta = await fetchVideoMetadata(cleanId);
        video = await Video.create({
          videoId: cleanId,
          title: meta.title,
          authorName: meta.authorName,
          thumbnailUrl: meta.thumbnailUrl,
          status: 'completed'
        });
      } else {
        return res.status(404).json({
          success: false,
          error: `Video '${cleanId}' not found. Please process it first.`
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    next(error);
  }
};

