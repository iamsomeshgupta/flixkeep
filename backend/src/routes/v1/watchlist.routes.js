const express = require('express');
const watchlistController = require('../../controllers/watchlistController');
const { protect, optionalProtect } = require('../../middleware/authMiddleware');

const router = express.Router();

// Public Watchlist Lookups (no login required for public resources)
router.get('/:id', optionalProtect, watchlistController.getWatchlistById);
router.get('/user/:userId', optionalProtect, watchlistController.getPublicWatchlists);

// Protected Watchlist Routes (Required Login)
router.use(protect);

router.post('/', watchlistController.createWatchlist);
router.get('/', watchlistController.getMyWatchlists);
router.put('/:id', watchlistController.updateWatchlist);
router.delete('/:id', watchlistController.deleteWatchlist);

// Movie modifications in watchlist
router.post('/:id/movies', watchlistController.addMovie);
router.delete('/:id/movies/:movieId', watchlistController.removeMovie);
router.put('/:id/reorder', watchlistController.reorderMovies);

// Collaborator modifications
router.post('/:id/collaborators', watchlistController.addCollaborator);
router.delete('/:id/collaborators/:userId', watchlistController.removeCollaborator);

// Duplicate Watchlist
router.post('/:id/duplicate', watchlistController.duplicateWatchlist);

module.exports = router;
