const Chat = require('../models/Chat');
const aiService = require('../services/aiService');
const { extractVideoId } = require('../utils/youtube');

/**
 * POST /api/chat
 * Accepts videoId, question, and optional conversationId.
 * Asks Gemini via FastAPI, saves message history in MongoDB, returns response.
 */
exports.askQuestion = async (req, res, next) => {
  try {
    const { videoId, question, conversationId } = req.body;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: 'videoId is required.'
      });
    }

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: 'question string is required.'
      });
    }

    const cleanVideoId = extractVideoId(videoId) || videoId.trim();
    const cleanQuestion = question.trim();

    // Establish conversation ID (or generate a clean ID per session)
    const activeConvId = conversationId || `conv_${cleanVideoId}_${Date.now()}`;

    // Require user-provided Gemini API key
    const customApiKey = (req.headers['x-api-key'] || req.headers['x-gemini-api-key'] || req.body.apiKey || '').trim();

    if (!customApiKey) {
      return res.status(401).json({
        success: false,
        error: 'Please enter your Google Gemini API key in the extension settings to continue.'
      });
    }

    // Call Python FastAPI service for similarity search + Gemini answer
    const aiResponse = await aiService.askQuestion(cleanVideoId, cleanQuestion, customApiKey);

    // Save message pair (user & assistant) into MongoDB
    let chat = await Chat.findOne({ conversationId: activeConvId });

    if (!chat) {
      chat = new Chat({
        conversationId: activeConvId,
        videoId: cleanVideoId,
        messages: []
      });
    }

    // Add user question
    chat.messages.push({
      sender: 'user',
      text: cleanQuestion,
      sources: [],
      createdAt: new Date()
    });

    // Add assistant answer with sources
    chat.messages.push({
      sender: 'assistant',
      text: aiResponse.answer,
      sources: aiResponse.sources || [],
      createdAt: new Date()
    });

    await chat.save();

    return res.status(200).json({
      success: true,
      data: {
        conversationId: activeConvId,
        videoId: cleanVideoId,
        question: cleanQuestion,
        answer: aiResponse.answer,
        sources: aiResponse.sources || []
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/chat/:conversationId
 * Returns the message history for a conversation.
 */
exports.getChatHistory = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const chat = await Chat.findOne({ conversationId });
    if (!chat) {
      return res.status(200).json({
        success: true,
        data: {
          conversationId,
          messages: []
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        conversationId: chat.conversationId,
        videoId: chat.videoId,
        messages: chat.messages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/chat/:conversationId
 * Clears or deletes conversation history.
 */
exports.clearChatHistory = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    await Chat.findOneAndDelete({ conversationId });

    return res.status(200).json({
      success: true,
      message: `Chat history for conversation '${conversationId}' was successfully cleared.`
    });
  } catch (error) {
    next(error);
  }
};

