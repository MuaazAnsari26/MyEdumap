const express = require('express');
const router = express.Router();

const connectionController = require('../controllers/connectionController');
const { protect, requireVerifiedEmail } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { sendRequestValidator, requestIdValidator } = require('../validators/connectionValidators');

// All connection routes require a logged-in, verified user. Either role
// can send/receive requests, so there's no restrictTo() here — the
// service layer enforces that student<->teacher is the only valid pair.
router.use(protect, requireVerifiedEmail);

router.post('/request', sendRequestValidator, validateRequest, connectionController.sendRequest);
router.get('/incoming', connectionController.getIncoming);
router.get('/outgoing', connectionController.getOutgoing);
router.get('/', connectionController.getConnections);

router.patch('/:requestId/accept', requestIdValidator, validateRequest, connectionController.accept);
router.patch('/:requestId/reject', requestIdValidator, validateRequest, connectionController.reject);
router.patch('/:requestId/cancel', requestIdValidator, validateRequest, connectionController.cancel);

module.exports = router;
