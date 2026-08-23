const tmdbService = require('../services/tmdbService');
const recommendationService = require('../services/recommendationService');
const { BadRequestError } = require('../utils/errors');

class MovieController {
  // 1. Get Trending
  async getTrending(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const data = await tmdbService.getTrending(page);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  // Get Upcoming Releases
  async getUpcoming(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const data = await tmdbService.getUpcomingMovies(page);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  // 2. Get Popular
  async getPopular(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const data = await tmdbService.getPopular(page);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  // 3. Get Top Rated
  async getTopRated(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const data = await tmdbService.getTopRated(page);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  // 4. Get Upcoming
  async getUpcoming(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const data = await tmdbService.getUpcoming(page);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  // 5. Search Movies
  async searchMovies(req, res, next) {
    try {
      const { query } = req.query;
      const page = parseInt(req.query.page) || 1;

      if (!query || !query.trim()) {
        throw new BadRequestError('Search query parameter "query" is required');
      }

      const data = await tmdbService.searchMovies(query, page);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  // 6. Search Suggestions (Autocomplete)
  async getSearchSuggestions(req, res, next) {
    try {
      const { query } = req.query;
      
      if (!query || !query.trim()) {
        // Return empty array if query is short or missing, rather than throwing error
        return res.status(200).json({ status: 'success', data: [] });
      }

      const data = await tmdbService.getSearchSuggestions(query);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  // 7. Get Movie Details (Merged profiles if needed, or simple)
  async getMovieDetails(req, res, next) {
    try {
      const { id } = req.params;
      const data = await tmdbService.getMovieDetails(id);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  // 8. Get Movie Credits
  async getMovieCredits(req, res, next) {
    try {
      const { id } = req.params;
      const data = await tmdbService.getMovieCredits(id);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  // 9. Get Movie Videos (Trailers)
  async getMovieVideos(req, res, next) {
    try {
      const { id } = req.params;
      const data = await tmdbService.getMovieVideos(id);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  // 10. Get Movie Recommendations
  async getMovieRecommendations(req, res, next) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const data = await tmdbService.getMovieRecommendations(id, page);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  // 11. Get Similar Movies
  async getMovieSimilar(req, res, next) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const data = await tmdbService.getMovieSimilar(id, page);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  // 12. Get Genres
  async getGenres(req, res, next) {
    try {
      const data = await tmdbService.getGenres();
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  // 13. Get Personalized Recommendations (Protected)
  async getPersonalizedRecommendations(req, res, next) {
    try {
      const data = await recommendationService.getPersonalizedRecommendations(req.user._id);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MovieController();
