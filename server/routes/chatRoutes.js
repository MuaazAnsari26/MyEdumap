const express = require('express');
const router = express.Router();

const chatController = require('../controllers/chatController');
const { protect, requireVerifiedEmail } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { openThreadValidator, threadIdValidator, sendMessageValidator } = require('../validators/chatValidators');

router.use(protect, requireVerifiedEmail);

router.get('/threads', chatController.listThreads);
router.post('/threads', openThreadValidator, validateRequest, chatController.openThread);
router.get('/threads/:threadId/messages', threadIdValidator, validateRequest, chatController.getMessages);
router.post(
  '/threads/:threadId/messages',
  threadIdValidator,
  sendMessageValidator,
  validateRequest,
  chatController.sendMessage
);

module.exports = router;
