const request = require('supertest');
const app = require('../src/app');

// Mock TMDB Service
jest.mock('../src/services/tmdbService', () => {
  return {
    getTrending: jest.fn().mockResolvedValue({
      results: [
        { id: 1, title: 'Mock Movie 1', poster_path: '/path1.jpg', vote_average: 8.5 },
        { id: 2, title: 'Mock Movie 2', poster_path: '/path2.jpg', vote_average: 7.2 },
      ],
      page: 1,
      total_pages: 10,
    }),
    getPopular: jest.fn().mockResolvedValue({
      results: [
        { id: 3, title: 'Popular Movie 1', poster_path: '/path3.jpg', vote_average: 9.0 },
      ],
    }),
    searchMovies: jest.fn().mockResolvedValue({
      results: [
        { id: 4, title: 'Search Movie 1', poster_path: '/path4.jpg', vote_average: 8.0 },
      ],
    }),
    getSearchSuggestions: jest.fn().mockResolvedValue([
      { id: 4, title: 'Search Movie 1', releaseDate: '2023-01-01', posterPath: '/path4.jpg', voteAverage: 8.0 }
    ]),
    getMovieDetails: jest.fn().mockResolvedValue({
      id: 99,
      title: 'Detailed Movie Title',
      overview: 'This is a mock movie overview.',
      runtime: 120,
      release_date: '2024-05-01',
      genres: [{ id: 18, name: 'Drama' }],
    }),
  };
});

describe('Movie Catalog API Endpoints', () => {
  
  describe('GET /api/v1/movies/trending', () => {
    it('should return mock trending movies successfully', async () => {
      const res = await request(app).get('/api/v1/movies/trending');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.results).toHaveLength(2);
      expect(res.body.data.results[0].title).toBe('Mock Movie 1');
    });
  });

  describe('GET /api/v1/movies/popular', () => {
    it('should return mock popular movies successfully', async () => {
      const res = await request(app).get('/api/v1/movies/popular');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.results[0].title).toBe('Popular Movie 1');
    });
  });

  describe('GET /api/v1/movies/search', () => {
    it('should fail if query is missing', async () => {
      const res = await request(app).get('/api/v1/movies/search');
      expect(res.status).toBe(400);
    });

    it('should return search results for valid query', async () => {
      const res = await request(app)
        .get('/api/v1/movies/search')
        .query({ query: 'Inception' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.results[0].title).toBe('Search Movie 1');
    });
  });

  describe('GET /api/v1/movies/suggestions', () => {
    it('should return search autocomplete suggestions', async () => {
      const res = await request(app)
        .get('/api/v1/movies/suggestions')
        .query({ query: 'Inc' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data[0].title).toBe('Search Movie 1');
    });
  });

  describe('GET /api/v1/movies/:id', () => {
    it('should return movie details successfully', async () => {
      const res = await request(app).get('/api/v1/movies/99');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.title).toBe('Detailed Movie Title');
      expect(res.body.data.runtime).toBe(120);
    });
  });
});
