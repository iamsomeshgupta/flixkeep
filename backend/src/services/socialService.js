const followRepository = require('../repositories/followRepository');
const userRepository = require('../repositories/userRepository');
const activityRepository = require('../repositories/activityRepository');
const notificationService = require('./notificationService');
const { NotFoundError, BadRequestError } = require('../utils/errors');

class SocialService {
  // Follow User
  async followUser(followerId, followingId) {
    if (followerId.toString() === followingId.toString()) {
      throw new BadRequestError('You cannot follow yourself');
    }

    const targetUser = await userRepository.findById(followingId);
    if (!targetUser) {
      throw new NotFoundError('Target user not found');
    }

    const alreadyFollowing = await followRepository.isFollowing(followerId, followingId);
    if (alreadyFollowing) {
      throw new BadRequestError('You are already following this user');
    }

    await followRepository.follow(followerId, followingId);

    // Log Activity
    await activityRepository.logActivity(followerId, 'follow_user', {
      targetUserId: followingId,
      targetUsername: targetUser.username,
    });

    // Trigger Notification
    try {
      await notificationService.triggerNotification(followingId, followerId, 'follow', {});
    } catch (err) {
      console.error('Failed to trigger follow notification:', err);
    }

    return true;
  }

  // Unfollow User
  async unfollowUser(followerId, followingId) {
    const deleted = await followRepository.unfollow(followerId, followingId);
    if (!deleted) {
      throw new BadRequestError('You are not following this user');
    }
    return true;
  }

  // Get User Profile details (with stats)
  async getUserProfile(targetUserId, currentUserId) {
    const userProfile = await userRepository.findById(targetUserId);
    if (!userProfile) {
      throw new NotFoundError('User profile not found');
    }

    const followersCount = await followRepository.getFollowersCount(targetUserId);
    const followingCount = await followRepository.getFollowingCount(targetUserId);
    
    let isFollowing = false;
    if (currentUserId) {
      isFollowing = await followRepository.isFollowing(currentUserId, targetUserId);
    }

    return {
      user: {
        id: userProfile._id,
        username: userProfile.username,
        avatarUrl: userProfile.avatarUrl,
        bio: userProfile.bio,
        favoriteGenres: userProfile.favoriteGenres,
        favoriteActors: userProfile.favoriteActors,
        favoriteDirectors: userProfile.favoriteDirectors,
        createdAt: userProfile.createdAt,
      },
      stats: {
        followersCount,
        followingCount,
      },
      isFollowing,
    };
  }

  // Get Social Feed Timeline (what followed users did)
  async getTimelineFeed(userId, options) {
    return await activityRepository.findTimelineFeed(userId, options);
  }

  // Get User's own Activity Log
  async getUserActivities(userId, options) {
    return await activityRepository.findByUser(userId, options);
  }

  // Get Followers
  async getFollowers(userId) {
    return await followRepository.findFollowers(userId);
  }

  // Get Following list
  async getFollowing(userId) {
    return await followRepository.findFollowing(userId);
  }
}

module.exports = new SocialService();
