const reviewService = require('../services/reviewService');
const { BadRequestError } = require('../utils/errors');

class ReviewController {
  // Create Review
  async createReview(req, res, next) {
    try {
      const { tmdbId, rating, reviewText, isSpoiler, movieTitle } = req.body;
      if (!tmdbId || !rating) {
        throw new BadRequestError('tmdbId and rating are required');
      }

      const review = await reviewService.createReview(req.user._id, {
        tmdbId: Number(tmdbId),
        rating: Number(rating),
        reviewText,
        isSpoiler,
        movieTitle,
      });

      res.status(201).json({
        status: 'success',
        data: { review },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get Reviews for Movie
  async getMovieReviews(req, res, next) {
    try {
      const { tmdbId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const sortBy = req.query.sortBy || 'createdAt'; // 'createdAt' or 'likes'

      const data = await reviewService.getMovieReviews(Number(tmdbId), { page, limit, sortBy });
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update Review
  async updateReview(req, res, next) {
    try {
      const { id } = req.params;
      const review = await reviewService.updateReview(id, req.user._id, req.body);
      res.status(200).json({
        status: 'success',
        data: { review },
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete Review
  async deleteReview(req, res, next) {
    try {
      const { id } = req.params;
      await reviewService.deleteReview(id, req.user._id);
      res.status(200).json({
        status: 'success',
        message: 'Review deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  // Toggle Like Review
  async toggleLikeReview(req, res, next) {
    try {
      const { id } = req.params;
      const review = await reviewService.toggleLikeReview(id, req.user._id);
      res.status(200).json({
        status: 'success',
        data: { review },
      });
    } catch (error) {
      next(error);
    }
  }

  // Add Comment
  async addComment(req, res, next) {
    try {
      const { id } = req.params;
      const { text } = req.body;

      if (!text || !text.trim()) {
        throw new BadRequestError('Comment text is required');
      }

      const review = await reviewService.addComment(id, req.user._id, text);
      res.status(201).json({
        status: 'success',
        data: { review },
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete Comment
  async deleteComment(req, res, next) {
    try {
      const { id, commentId } = req.params;
      const review = await reviewService.deleteComment(id, commentId, req.user._id);
      res.status(200).json({
        status: 'success',
        data: { review },
      });
    } catch (error) {
      next(error);
    }
  }

  // Report Review
  async reportReview(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || !reason.trim()) {
        throw new BadRequestError('Reporting reason is required');
      }

      await reviewService.reportReview(id, req.user._id, reason);
      res.status(200).json({
        status: 'success',
        message: 'Review reported successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReviewController();
