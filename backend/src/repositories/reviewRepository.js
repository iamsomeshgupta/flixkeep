const Review = require('../models/Review');

class ReviewRepository {
  async create(reviewData) {
    const review = new Review(reviewData);
    return await review.save();
  }

  async findById(id) {
    return await Review.findById(id)
      .populate('userId', 'username avatarUrl')
      .populate('comments.userId', 'username avatarUrl');
  }

  async findByUserAndMovie(userId, tmdbId) {
    return await Review.findOne({ userId, tmdbId });
  }

  async findByMovie(tmdbId, { page = 1, limit = 10, sortBy = 'createdAt' } = {}) {
    const query = { tmdbId, isDeletedByAdmin: false };
    const skip = (page - 1) * limit;

    // Determine sort
    let sortField = { createdAt: -1 };
    if (sortBy === 'likes') {
      // Sort by length of likes array
      sortField = { likesCount: -1 };
    }

    const reviews = await Review.aggregate([
      { $match: query },
      {
        $addFields: {
          likesCount: { $size: '$likes' },
        },
      },
      { $sort: sortField },
      { $skip: skip },
      { $limit: limit },
      // Lookup user details
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
      // Project fields to clean structure
      {
        $project: {
          _id: 1,
          rating: 1,
          reviewText: 1,
          isSpoiler: 1,
          likes: 1,
          comments: 1,
          createdAt: 1,
          updatedAt: 1,
          likesCount: 1,
          user: {
            _id: '$userDetails._id',
            username: '$userDetails.username',
            avatarUrl: '$userDetails.avatarUrl',
          },
        },
      },
    ]);

    const total = await Review.countDocuments(query);
    return { reviews, total, page, pages: Math.ceil(total / limit) };
  }

  async findByUser(userId) {
    return await Review.find({ userId, isDeletedByAdmin: false })
      .populate('userId', 'username avatarUrl')
      .sort({ createdAt: -1 });
  }

  async update(id, updateData) {
    return await Review.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('userId', 'username avatarUrl')
      .populate('comments.userId', 'username avatarUrl');
  }

  async delete(id) {
    return await Review.findByIdAndDelete(id);
  }

  // Admin reported reviews
  async findReported() {
    return await Review.find({
      'reports.0': { $exists: true }, // at least one report exists
      isDeletedByAdmin: false,
    })
      .populate('userId', 'username avatarUrl')
      .populate('reports.userId', 'username avatarUrl')
      .sort({ updatedAt: -1 });
  }
}

module.exports = new ReviewRepository();
