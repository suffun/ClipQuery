const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/', chatController.askQuestion);
router.get('/:conversationId', chatController.getChatHistory);
router.delete('/:conversationId', chatController.clearChatHistory);

module.exports = router;

