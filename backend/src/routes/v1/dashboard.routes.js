const express = require('express');
const dashboardController = require('../../controllers/dashboardController');
const { protect, restrictTo } = require('../../middleware/authMiddleware');

const router = express.Router();

// All dashboard endpoints require login
router.use(protect);

// User metrics
router.get('/user', dashboardController.getUserAnalytics);

// Admin-only metrics & moderator controls
router.use(restrictTo('admin'));

router.get('/admin', dashboardController.getAdminAnalytics);
router.post('/admin/ban/:userId', dashboardController.banUser);
router.delete('/admin/review/:reviewId', dashboardController.deleteReportedReview);

module.exports = router;
