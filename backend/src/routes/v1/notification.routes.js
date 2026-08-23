const express = require('express');
const notificationController = require('../../controllers/notificationController');
const { protect } = require('../../middleware/authMiddleware');

const router = express.Router();

// All notification routes are protected
router.use(protect);

router.get('/', notificationController.getMyNotifications);
router.get('/unread', notificationController.getUnreadCount);
router.put('/mark-all', notificationController.markAllAsRead);
router.put('/:id', notificationController.markAsRead);

module.exports = router;
