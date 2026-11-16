const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  sources: [
    {
      timestamp: { type: String },
      start: { type: Number },
      text: { type: String }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    videoId: {
      type: String,
      required: true,
      index: true
    },
    messages: [messageSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Chat', chatSchema);

