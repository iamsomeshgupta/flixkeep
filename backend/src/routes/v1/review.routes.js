const express = require('express');
const reviewController = require('../../controllers/reviewController');
const { protect } = require('../../middleware/authMiddleware');

const router = express.Router();

// Get reviews for movie (Public)
router.get('/movie/:tmdbId', reviewController.getMovieReviews);

// Protected review interactions (Requires login)
router.use(protect);

router.post('/', reviewController.createReview);
router.put('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

// Social interactions
router.post('/:id/like', reviewController.toggleLikeReview);
router.post('/:id/comments', reviewController.addComment);
router.delete('/:id/comments/:commentId', reviewController.deleteComment);
router.post('/:id/report', reviewController.reportReview);

module.exports = router;
