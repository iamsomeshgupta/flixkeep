const watchlistService = require('../services/watchlistService');
const { BadRequestError } = require('../utils/errors');

class WatchlistController {
  // Create Watchlist
  async createWatchlist(req, res, next) {
    try {
      const { name, description, isPublic } = req.body;
      if (!name) {
        throw new BadRequestError('Watchlist name is required');
      }

      const watchlist = await watchlistService.createWatchlist(req.user._id, {
        name,
        description,
        isPublic,
      });

      res.status(201).json({
        status: 'success',
        data: { watchlist },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get Current User's Watchlists
  async getMyWatchlists(req, res, next) {
    try {
      const watchlists = await watchlistService.getUserWatchlists(req.user._id);
      res.status(200).json({
        status: 'success',
        data: { watchlists },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get Public Watchlists of another User
  async getPublicWatchlists(req, res, next) {
    try {
      const { userId } = req.params;
      const watchlists = await watchlistService.getPublicWatchlists(userId);
      res.status(200).json({
        status: 'success',
        data: { watchlists },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get Watchlist by ID
  async getWatchlistById(req, res, next) {
    try {
      const { id } = req.params;
      const watchlist = await watchlistService.getWatchlistById(id, req.user._id);
      res.status(200).json({
        status: 'success',
        data: { watchlist },
      });
    } catch (error) {
      next(error);
    }
  }

  // Update Watchlist details
  async updateWatchlist(req, res, next) {
    try {
      const { id } = req.params;
      const watchlist = await watchlistService.updateWatchlist(id, req.user._id, req.body);
      res.status(200).json({
        status: 'success',
        data: { watchlist },
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete Watchlist
  async deleteWatchlist(req, res, next) {
    try {
      const { id } = req.params;
      await watchlistService.deleteWatchlist(id, req.user._id);
      res.status(200).json({
        status: 'success',
        message: 'Watchlist deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  // Add Movie
  async addMovie(req, res, next) {
    try {
      const { id } = req.params;
      const { tmdbId, title, posterPath } = req.body;

      if (!tmdbId || !title) {
        throw new BadRequestError('Movie tmdbId and title are required');
      }

      const watchlist = await watchlistService.addMovie(id, req.user._id, {
        tmdbId: Number(tmdbId),
        title,
        posterPath,
      });

      res.status(200).json({
        status: 'success',
        data: { watchlist },
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove Movie
  async removeMovie(req, res, next) {
    try {
      const { id, movieId } = req.params;
      const watchlist = await watchlistService.removeMovie(id, req.user._id, movieId);
      res.status(200).json({
        status: 'success',
        data: { watchlist },
      });
    } catch (error) {
      next(error);
    }
  }

  // Reorder Movies
  async reorderMovies(req, res, next) {
    try {
      const { id } = req.params;
      const { tmdbIds } = req.body;

      if (!Array.isArray(tmdbIds)) {
        throw new BadRequestError('tmdbIds list must be an array of movie IDs');
      }

      const watchlist = await watchlistService.reorderMovies(id, req.user._id, tmdbIds);
      res.status(200).json({
        status: 'success',
        data: { watchlist },
      });
    } catch (error) {
      next(error);
    }
  }

  // Add Collaborator
  async addCollaborator(req, res, next) {
    try {
      const { id } = req.params;
      const { username } = req.body;

      if (!username) {
        throw new BadRequestError('Collaborator username is required');
      }

      const watchlist = await watchlistService.addCollaborator(id, req.user._id, username);
      res.status(200).json({
        status: 'success',
        data: { watchlist },
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove Collaborator
  async removeCollaborator(req, res, next) {
    try {
      const { id, userId } = req.params;
      const watchlist = await watchlistService.removeCollaborator(id, req.user._id, userId);
      res.status(200).json({
        status: 'success',
        data: { watchlist },
      });
    } catch (error) {
      next(error);
    }
  }

  // Duplicate Watchlist
  async duplicateWatchlist(req, res, next) {
    try {
      const { id } = req.params;
      const watchlist = await watchlistService.duplicateWatchlist(id, req.user._id);
      
      res.status(201).json({
        status: 'success',
        message: 'Watchlist duplicated successfully.',
        data: { watchlist },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WatchlistController();
