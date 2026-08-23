const reviewRepository = require('../repositories/reviewRepository');
const activityRepository = require('../repositories/activityRepository');
const notificationService = require('./notificationService');
const tmdbService = require('./tmdbService');
const { ConflictError, NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');

class ReviewService {
  // Create Movie Review
  async createReview(userId, data) {
    const { tmdbId, rating, reviewText, isSpoiler, movieTitle } = data;

    // Check if user already reviewed this movie
    const existing = await reviewRepository.findByUserAndMovie(userId, tmdbId);
    if (existing) {
      throw new ConflictError('You have already written a review for this movie');
    }

    const review = await reviewRepository.create({
      userId,
      tmdbId,
      rating,
      reviewText,
      isSpoiler,
    });

    // Log Rate Movie Activity
    await activityRepository.logActivity(userId, 'rate_movie', {
      tmdbId,
      movieTitle: movieTitle || 'Movie',
      rating,
      reviewId: review._id,
    });

    return review;
  }

  // Get Reviews for Movie
  async getMovieReviews(tmdbId, options) {
    return await reviewRepository.findByMovie(tmdbId, options);
  }

  // Get User Reviews
  async getUserReviews(userId) {
    return await reviewRepository.findByUser(userId);
  }

  // Update Review
  async updateReview(reviewId, userId, updateData) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Verify authorship
    if (review.userId._id.toString() !== userId.toString()) {
      throw new ForbiddenError('You can only edit your own reviews');
    }

    // Only allow editing text, rating, and spoiler flag
    const allowed = ['rating', 'reviewText', 'isSpoiler'];
    const updates = {};
    Object.keys(updateData).forEach((key) => {
      if (allowed.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    return await reviewRepository.update(reviewId, updates);
  }

  // Delete Review
  async deleteReview(reviewId, userId) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Verify authorship
    if (review.userId._id.toString() !== userId.toString()) {
      throw new ForbiddenError('You can only delete your own reviews');
    }

    await reviewRepository.delete(reviewId);
    return true;
  }

  // Toggle Like Review
  async toggleLikeReview(reviewId, userId) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    const likedIndex = review.likes.findIndex((l) => l.toString() === userId.toString());
    if (likedIndex > -1) {
      // Unlike
      review.likes.splice(likedIndex, 1);
    } else {
      // Like
      review.likes.push(userId);

      // Trigger Notification
      try {
        const movieDetails = await tmdbService.getMovieDetails(review.tmdbId);
        const movieTitle = movieDetails?.title || 'your review';
        await notificationService.triggerNotification(review.userId._id, userId, 'like', {
          reviewId: review._id,
          movieTitle,
        });
      } catch (err) {
        console.error('Failed to trigger like notification:', err);
      }
    }

    return await review.save();
  }

  // Add Comment to Review
  async addComment(reviewId, userId, text) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    review.comments.push({
      userId,
      text,
    });

    await review.save();

    // Trigger Notification
    try {
      const movieDetails = await tmdbService.getMovieDetails(review.tmdbId);
      const movieTitle = movieDetails?.title || 'your review';
      await notificationService.triggerNotification(review.userId._id, userId, 'comment', {
        reviewId: review._id,
        movieTitle,
      });
    } catch (err) {
      console.error('Failed to trigger comment notification:', err);
    }

    return await reviewRepository.findById(reviewId); // return populated
  }

  // Delete Comment from Review
  async deleteComment(reviewId, commentId, userId) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    const commentIndex = review.comments.findIndex((c) => c._id.toString() === commentId.toString());
    if (commentIndex === -1) {
      throw new NotFoundError('Comment not found');
    }

    const comment = review.comments[commentIndex];
    const isCommentAuthor = comment.userId.toString() === userId.toString();
    const isReviewAuthor = review.userId._id.toString() === userId.toString();

    if (!isCommentAuthor && !isReviewAuthor) {
      throw new ForbiddenError('You do not have permission to delete this comment');
    }

    review.comments.splice(commentIndex, 1);
    await review.save();
    return review;
  }

  // Report Review
  async reportReview(reviewId, userId, reason) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    const alreadyReported = review.reports.some((r) => r.userId.toString() === userId.toString());
    if (alreadyReported) {
      throw new BadRequestError('You have already reported this review');
    }

    review.reports.push({
      userId,
      reason,
    });

    return await review.save();
  }
}

module.exports = new ReviewService();
