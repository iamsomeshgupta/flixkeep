const Activity = require('../models/Activity');
const Follow = require('../models/Follow');

class ActivityRepository {
  async logActivity(userId, activityType, metadata) {
    const activity = new Activity({
      userId,
      activityType,
      metadata,
    });
    return await activity.save();
  }

  // Get specific user's activity log
  async findByUser(userId, { limit = 10 } = {}) {
    return await Activity.find({ userId })
      .populate('userId', 'username avatarUrl')
      .limit(limit)
      .sort({ createdAt: -1 });
  }

  // Get feed timeline for logged in user (activities of users they follow)
  async findTimelineFeed(userId, { page = 1, limit = 15 } = {}) {
    // 1. Get followed users list
    const followingRecords = await Follow.find({ followerId: userId }).select('followingId');
    const followingIds = followingRecords.map((r) => r.followingId);

    // Always include user's own activities in their timeline
    followingIds.push(userId);

    const skip = (page - 1) * limit;

    // 2. Query activities
    const feed = await Activity.find({ userId: { $in: followingIds } })
      .populate('userId', 'username avatarUrl')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Activity.countDocuments({ userId: { $in: followingIds } });

    return { feed, total, page, pages: Math.ceil(total / limit) };
  }
}

module.exports = new ActivityRepository();
