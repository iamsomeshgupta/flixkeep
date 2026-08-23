const axios = require('axios');
const { getCache, setCache } = require('../config/redis');
const logger = require('../utils/logger');

const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';

// Create Axios instance for TMDB
const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

// Cache TTLs in seconds
const CACHE_TTL = {
  TRENDING: 12 * 60 * 60,      // 12 hours
  CATALOG: 24 * 60 * 60,       // 24 hours (popular, top rated, upcoming)
  DETAILS: 24 * 60 * 60 * 7,   // 7 days (movie profile, cast, crew details)
  SEARCH: 60 * 60 * 2,         // 2 hours
  GENRES: 24 * 60 * 60 * 30,   // 30 days
};

class TmdbService {
  async fetchWithCache(cacheKey, path, params = {}, ttl = 3600) {
    // 1. Check cache first
    try {
      const cachedData = await getCache(cacheKey);
      if (cachedData) {
        logger.debug(`Cache HIT for key: ${cacheKey}`);
        return cachedData;
      }
    } catch (err) {
      logger.error(`Cache fetch failed: ${err.message}`);
    }

    // 2. Fetch from TMDB if cache miss or error
    logger.debug(`Cache MISS for key: ${cacheKey}. Fetching from TMDB path: ${path}`);
    try {
      const response = await tmdbClient.get(path, { params });
      const data = response.data;

      // 3. Save to cache
      await setCache(cacheKey, data, ttl);
      return data;
    } catch (error) {
      logger.error(`TMDB API request failed on path ${path}: ${error.message}`);
      if (error.response) {
        logger.error(`TMDB status: ${error.response.status} - data: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Failed to fetch movie catalog data.`);
    }
  }

  // 1. Trending Movies
  async getTrending(page = 1) {
    const cacheKey = `tmdb:trending:page:${page}`;
    return await this.fetchWithCache(cacheKey, '/trending/movie/day', { page }, CACHE_TTL.TRENDING);
  }

  // 2. Popular Movies
  async getPopular(page = 1) {
    const cacheKey = `tmdb:popular:page:${page}`;
    return await this.fetchWithCache(cacheKey, '/movie/popular', { page }, CACHE_TTL.CATALOG);
  }

  // 3. Top Rated Movies
  async getTopRated(page = 1) {
    const cacheKey = `tmdb:top_rated:page:${page}`;
    return await this.fetchWithCache(cacheKey, '/movie/top_rated', { page }, CACHE_TTL.CATALOG);
  }

  // 4. Upcoming Movies
  async getUpcoming(page = 1) {
    const cacheKey = `tmdb:upcoming:page:${page}`;
    return await this.fetchWithCache(cacheKey, '/movie/upcoming', { page }, CACHE_TTL.CATALOG);
  }

  // 5. Search Movies
  async searchMovies(query, page = 1) {
    const cacheKey = `tmdb:search:query:${query.trim().toLowerCase()}:page:${page}`;
    return await this.fetchWithCache(
      cacheKey,
      '/search/movie',
      { query, page },
      CACHE_TTL.SEARCH
    );
  }

  // 6. Get Search Suggestions (autocomplete)
  async getSearchSuggestions(query) {
    const cacheKey = `tmdb:suggestions:query:${query.trim().toLowerCase()}`;
    // Fetch page 1 of search, cache, then parse down to a small list of titles and posters
    const searchData = await this.fetchWithCache(
      cacheKey,
      '/search/movie',
      { query, page: 1 },
      CACHE_TTL.SEARCH
    );
    
    // Return only top 6 results formatted
    return (searchData.results || []).slice(0, 6).map((movie) => ({
      id: movie.id,
      title: movie.title,
      releaseDate: movie.release_date,
      posterPath: movie.poster_path,
      voteAverage: movie.vote_average,
    }));
  }

  // 7. Movie Details
  async getMovieDetails(movieId) {
    const cacheKey = `tmdb:movie:${movieId}`;
    return await this.fetchWithCache(cacheKey, `/movie/${movieId}`, {}, CACHE_TTL.DETAILS);
  }

  // 8. Movie Credits (Cast & Crew)
  async getMovieCredits(movieId) {
    const cacheKey = `tmdb:movie:${movieId}:credits`;
    return await this.fetchWithCache(cacheKey, `/movie/${movieId}/credits`, {}, CACHE_TTL.DETAILS);
  }

  // 9. Movie Videos (Trailer, Teasers)
  async getMovieVideos(movieId) {
    const cacheKey = `tmdb:movie:${movieId}:videos`;
    return await this.fetchWithCache(cacheKey, `/movie/${movieId}/videos`, {}, CACHE_TTL.DETAILS);
  }

  // 10. Recommendations
  async getMovieRecommendations(movieId, page = 1) {
    const cacheKey = `tmdb:movie:${movieId}:recommendations:page:${page}`;
    return await this.fetchWithCache(
      cacheKey,
      `/movie/${movieId}/recommendations`,
      { page },
      CACHE_TTL.DETAILS
    );
  }

  // 11. Similar Movies
  async getMovieSimilar(movieId, page = 1) {
    const cacheKey = `tmdb:movie:${movieId}:similar:page:${page}`;
    return await this.fetchWithCache(
      cacheKey,
      `/movie/${movieId}/similar`,
      { page },
      CACHE_TTL.DETAILS
    );
  }

  // 12. Genres List
  async getGenres() {
    const cacheKey = 'tmdb:genres';
    return await this.fetchWithCache(cacheKey, '/genre/movie/list', {}, CACHE_TTL.GENRES);
  }

  // 13. Upcoming Movies
  async getUpcomingMovies(page = 1) {
    const cacheKey = `tmdb:movies:upcoming:page:${page}`;
    return await this.fetchWithCache(
      cacheKey,
      '/movie/upcoming',
      { page },
      CACHE_TTL.DETAILS
    );
  }
}

module.exports = new TmdbService();
