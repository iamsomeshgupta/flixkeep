const mongoose = require('mongoose');
const Review = require('../models/Review');
const User = require('../models/User');
const Watchlist = require('../models/Watchlist');
const reviewRepository = require('../repositories/reviewRepository');
const tmdbService = require('./tmdbService');

class DashboardService {
  // 1. Get User statistics
  async getUserAnalytics(userId) {
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Get total movies rated
    const totalRated = await Review.countDocuments({ userId: userObjId, isDeletedByAdmin: false });

    // Calculate average rating
    const avgRatingAgg = await Review.aggregate([
      { $match: { userId: userObjId, isDeletedByAdmin: false } },
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]);
    const averageRating = avgRatingAgg.length > 0 ? Number(avgRatingAgg[0].avg.toFixed(1)) : 0;

    // Calculate estimated watch hours (2 hours per rated movie)
    const watchHours = totalRated * 2;

    // Calculate genre distribution:
    // Gather all TMDB movie IDs from user reviews
    const reviews = await Review.find({ userId: userObjId, isDeletedByAdmin: false }).select('tmdbId');
    const genreCounts = {};

    for (const r of reviews) {
      try {
        const details = await tmdbService.getMovieDetails(r.tmdbId);
        if (details && details.genres) {
          details.genres.forEach((genre) => {
            genreCounts[genre.name] = (genreCounts[genre.name] || 0) + 1;
          });
        }
      } catch (e) {
        // Continue if TMDB lookup fails for a single item
      }
    }

    return {
      totalRated,
      averageRating,
      watchHours,
      genreDistribution: genreCounts,
    };
  }

  // 2. Get Admin statistics
  async getAdminAnalytics() {
    const totalUsers = await User.countDocuments({});
    const totalReviews = await Review.countDocuments({ isDeletedByAdmin: false });
    const totalWatchlists = await Watchlist.countDocuments({});

    // Fetch reported reviews using the repository method
    const reportedReviews = await reviewRepository.findReported();

    // Aggregate user growth over the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const growthRaw = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format timeline output
    const growthTimeline = growthRaw.map((item) => ({
      date: item._id,
      registrations: item.count,
    }));

    return {
      stats: {
        totalUsers,
        totalReviews,
        totalWatchlists,
      },
      growthTimeline,
      reportedReviews,
    };
  }

  // 3. Admin Control Action: Ban User
  async banUser(userId, currentAdminId) {
    if (userId.toString() === currentAdminId.toString()) {
      throw new Error('You cannot ban yourself');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.isBanned = true;
    await user.save();
    return true;
  }

  // 4. Admin Control Action: Delete Reported Review
  async deleteReportedReview(reviewId) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    // Soft delete by setting flag
    review.isDeletedByAdmin = true;
    await review.save();
    return true;
  }
}

module.exports = new DashboardService();
