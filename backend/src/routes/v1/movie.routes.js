const express = require('express');
const movieController = require('../../controllers/movieController');

const router = express.Router();

const { protect } = require('../../middleware/authMiddleware');

// Catalog Browsing Routes (Public)
router.get('/trending', movieController.getTrending);
router.get('/popular', movieController.getPopular);
router.get('/top-rated', movieController.getTopRated);
router.get('/upcoming', movieController.getUpcoming);
router.get('/search', movieController.searchMovies);
router.get('/suggestions', movieController.getSearchSuggestions);
router.get('/genres', movieController.getGenres);

// Personalized Recommendations (Protected)
router.get('/recommendations/personalized', protect, movieController.getPersonalizedRecommendations);

// Individual Movie Detail Routes (Public)
router.get('/:id', movieController.getMovieDetails);
router.get('/:id/credits', movieController.getMovieCredits);
router.get('/:id/videos', movieController.getMovieVideos);
router.get('/:id/recommendations', movieController.getMovieRecommendations);
router.get('/:id/similar', movieController.getMovieSimilar);

module.exports = router;
