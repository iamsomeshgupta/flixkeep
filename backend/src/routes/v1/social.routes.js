const express = require('express');
const socialController = require('../../controllers/socialController');
const { protect, optionalProtect } = require('../../middleware/authMiddleware');

const router = express.Router();

// Public Social Routes (profiles and activity logs)
router.get('/profile/:userId', optionalProtect, socialController.getUserProfile);
router.get('/activities/:userId', socialController.getUserActivities);
router.get('/followers/:userId', socialController.getFollowers);
router.get('/following/:userId', socialController.getFollowing);

// Protected Social Interactions (Requires login)
router.use(protect);

router.post('/follow/:userId', socialController.followUser);
router.post('/unfollow/:userId', socialController.unfollowUser);
router.get('/timeline', socialController.getTimelineFeed);

module.exports = router;
