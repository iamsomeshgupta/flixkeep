const socialService = require('../services/socialService');

class SocialController {
  // Follow User
  async followUser(req, res, next) {
    try {
      const { userId } = req.params;
      await socialService.followUser(req.user._id, userId);
      
      res.status(200).json({
        status: 'success',
        message: 'Successfully followed user.',
      });
    } catch (error) {
      next(error);
    }
  }

  // Unfollow User
  async unfollowUser(req, res, next) {
    try {
      const { userId } = req.params;
      await socialService.unfollowUser(req.user._id, userId);
      
      res.status(200).json({
        status: 'success',
        message: 'Successfully unfollowed user.',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get User Profile details & stats
  async getUserProfile(req, res, next) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user ? req.user._id : null; // optionalProtect attaches req.user

      const data = await socialService.getUserProfile(userId, currentUserId);
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get Social Feed Timeline (Activities of followed users)
  async getTimelineFeed(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const data = await socialService.getTimelineFeed(req.user._id, { page, limit });
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get User's own Activity Feed logs
  async getUserActivities(req, res, next) {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit) || 10;
      
      const data = await socialService.getUserActivities(userId, { limit });
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get Followers
  async getFollowers(req, res, next) {
    try {
      const { userId } = req.params;
      const followers = await socialService.getFollowers(userId);
      
      res.status(200).json({
        status: 'success',
        data: { followers },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get Following
  async getFollowing(req, res, next) {
    try {
      const { userId } = req.params;
      const following = await socialService.getFollowing(userId);
      
      res.status(200).json({
        status: 'success',
        data: { following },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SocialController();
