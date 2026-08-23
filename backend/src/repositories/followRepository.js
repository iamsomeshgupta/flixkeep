const Follow = require('../models/Follow');

class FollowRepository {
  async follow(followerId, followingId) {
    const record = new Follow({ followerId, followingId });
    return await record.save();
  }

  async unfollow(followerId, followingId) {
    return await Follow.findOneAndDelete({ followerId, followingId });
  }

  async isFollowing(followerId, followingId) {
    const record = await Follow.findOne({ followerId, followingId });
    return !!record;
  }

  // Users who follow this user
  async findFollowers(userId) {
    return await Follow.find({ followingId: userId })
      .populate('followerId', 'username avatarUrl bio')
      .sort({ createdAt: -1 });
  }

  // Users this user follows
  async findFollowing(userId) {
    return await Follow.find({ followerId: userId })
      .populate('followingId', 'username avatarUrl bio')
      .sort({ createdAt: -1 });
  }

  async getFollowersCount(userId) {
    return await Follow.countDocuments({ followingId: userId });
  }

  async getFollowingCount(userId) {
    return await Follow.countDocuments({ followerId: userId });
  }
}

module.exports = new FollowRepository();
