const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Watchlist = require('../src/models/Watchlist');
const Token = require('../src/models/Token');

const testDbUri = 'mongodb://localhost:27017/flixkeep-test';

let accessToken;
let userId;

const mockUser = {
  username: 'watchlistuser',
  email: 'watchlistuser@example.com',
  password: 'Password123!',
};

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(testDbUri);

  // Setup test user
  await User.deleteMany({});
  await Watchlist.deleteMany({});
  await Token.deleteMany({});

  const userRes = await request(app).post('/api/v1/auth/register').send(mockUser);
  const loginRes = await request(app).post('/api/v1/auth/login').send({
    email: mockUser.email,
    password: mockUser.password,
  });

  accessToken = loginRes.body.data.accessToken;
  userId = loginRes.body.data.user.id;
});

afterAll(async () => {
  await User.deleteMany({});
  await Watchlist.deleteMany({});
  await Token.deleteMany({});
  await mongoose.connection.close();
});

describe('Watchlist API Endpoints', () => {
  let watchlistId;

  describe('POST /api/v1/watchlists', () => {
    it('should successfully create a new watchlist', async () => {
      const res = await request(app)
        .post('/api/v1/watchlists')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Marvel Movies',
          description: 'My favorite Marvel films in order',
          isPublic: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.watchlist.name).toBe('Marvel Movies');
      expect(res.body.data.watchlist.owner).toBe(userId);

      watchlistId = res.body.data.watchlist._id;
    });

    it('should fail if watchlist name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/watchlists')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          description: 'No name list',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/watchlists', () => {
    it('should return all watchlists of the logged in user', async () => {
      const res = await request(app)
        .get('/api/v1/watchlists')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.watchlists).toHaveLength(1);
    });
  });

  describe('POST /api/v1/watchlists/:id/movies', () => {
    it('should add a movie to the watchlist', async () => {
      const res = await request(app)
        .post(`/api/v1/watchlists/${watchlistId}/movies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          tmdbId: 299536,
          title: 'Avengers: Infinity War',
          posterPath: '/infinitywar.jpg',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.watchlist.movies).toHaveLength(1);
      expect(res.body.data.watchlist.movies[0].title).toBe('Avengers: Infinity War');
      expect(res.body.data.watchlist.movies[0].order).toBe(0);
    });

    it('should fail to add a duplicate movie', async () => {
      const res = await request(app)
        .post(`/api/v1/watchlists/${watchlistId}/movies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          tmdbId: 299536,
          title: 'Avengers: Infinity War',
        });

      expect(res.status).toBe(400); // Bad request (duplicate)
    });
  });

  describe('PUT /api/v1/watchlists/:id/reorder', () => {
    beforeEach(async () => {
      // Add a second movie first
      await request(app)
        .post(`/api/v1/watchlists/${watchlistId}/movies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          tmdbId: 299534,
          title: 'Avengers: Endgame',
          posterPath: '/endgame.jpg',
        });
    });

    it('should reorder movies in the watchlist', async () => {
      const res = await request(app)
        .put(`/api/v1/watchlists/${watchlistId}/reorder`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          tmdbIds: [299534, 299536], // swap order (Endgame first, Infinity War second)
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      
      const movies = res.body.data.watchlist.movies;
      // Index 0 should be Endgame now
      expect(movies[0].tmdbId).toBe(299534);
      expect(movies[1].tmdbId).toBe(299536);
    });
  });

  describe('DELETE /api/v1/watchlists/:id/movies/:movieId', () => {
    it('should remove a movie from the watchlist', async () => {
      const res = await request(app)
        .delete(`/api/v1/watchlists/${watchlistId}/movies/299536`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.watchlist.movies).toHaveLength(1);
      expect(res.body.data.watchlist.movies[0].tmdbId).toBe(299534); // only Endgame remains
    });
  });

  describe('DELETE /api/v1/watchlists/:id', () => {
    it('should delete the watchlist', async () => {
      const res = await request(app)
        .delete(`/api/v1/watchlists/${watchlistId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      // Verify it is gone
      const checkRes = await request(app)
        .get(`/api/v1/watchlists/${watchlistId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(checkRes.status).toBe(404);
    });
  });
});
