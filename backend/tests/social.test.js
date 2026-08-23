const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Review = require('../src/models/Review');
const Follow = require('../src/models/Follow');
const Activity = require('../src/models/Activity');
const Token = require('../src/models/Token');

const testDbUri = 'mongodb://localhost:27017/flixkeep-test';

let user1Token, user1Id;
let user2Token, user2Id;

const mockUser1 = {
  username: 'socialuser1',
  email: 'socialuser1@example.com',
  password: 'Password123!',
};

const mockUser2 = {
  username: 'socialuser2',
  email: 'socialuser2@example.com',
  password: 'Password123!',
};

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(testDbUri);

  await User.deleteMany({});
  await Review.deleteMany({});
  await Follow.deleteMany({});
  await Activity.deleteMany({});
  await Token.deleteMany({});

  // Setup user 1
  await request(app).post('/api/v1/auth/register').send(mockUser1);
  const login1 = await request(app).post('/api/v1/auth/login').send({
    email: mockUser1.email,
    password: mockUser1.password,
  });
  user1Token = login1.body.data.accessToken;
  user1Id = login1.body.data.user.id;

  // Setup user 2
  await request(app).post('/api/v1/auth/register').send(mockUser2);
  const login2 = await request(app).post('/api/v1/auth/login').send({
    email: mockUser2.email,
    password: mockUser2.password,
  });
  user2Token = login2.body.data.accessToken;
  user2Id = login2.body.data.user.id;
});

afterAll(async () => {
  await User.deleteMany({});
  await Review.deleteMany({});
  await Follow.deleteMany({});
  await Activity.deleteMany({});
  await Token.deleteMany({});
  await mongoose.connection.close();
});

describe('Social, Reviews & Activity Feed API', () => {
  let reviewId;

  describe('POST /api/v1/reviews', () => {
    it('should allow user1 to rate and review a movie', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          tmdbId: 550, // Fight Club
          rating: 9,
          reviewText: 'Incredible film, rule number one is...',
          isSpoiler: false,
          movieTitle: 'Fight Club',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.review.rating).toBe(9);
      expect(res.body.data.review.reviewText).toBe('Incredible film, rule number one is...');

      reviewId = res.body.data.review._id;
    });

    it('should prevent writing duplicate reviews for same movie', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          tmdbId: 550,
          rating: 5,
        });

      expect(res.status).toBe(409); // Conflict
    });
  });

  describe('GET /api/v1/reviews/movie/:tmdbId', () => {
    it('should return movie reviews publicly', async () => {
      const res = await request(app).get('/api/v1/reviews/movie/550');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.reviews).toHaveLength(1);
      expect(res.body.data.reviews[0].reviewText).toBe('Incredible film, rule number one is...');
      expect(res.body.data.reviews[0].user.username).toBe(mockUser1.username);
    });
  });

  describe('POST /api/v1/reviews/:id/like', () => {
    it('should allow user2 to like user1 review', async () => {
      const res = await request(app)
        .post(`/api/v1/reviews/${reviewId}/like`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.review.likes).toHaveLength(1);
      expect(res.body.data.review.likes[0]).toBe(user2Id);
    });
  });

  describe('POST /api/v1/reviews/:id/comments', () => {
    it('should allow user2 to comment on review', async () => {
      const res = await request(app)
        .post(`/api/v1/reviews/${reviewId}/comments`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          text: 'Completely agree with this!',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.review.comments).toHaveLength(1);
      expect(res.body.data.review.comments[0].text).toBe('Completely agree with this!');
    });
  });

  describe('POST /api/v1/social/follow/:userId', () => {
    it('should allow user2 to follow user1', async () => {
      const res = await request(app)
        .post(`/api/v1/social/follow/${user1Id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });

    it('should prevent self following', async () => {
      const res = await request(app)
        .post(`/api/v1/social/follow/${user2Id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/social/timeline', () => {
    it('should return activities of followed users in user2 timeline', async () => {
      const res = await request(app)
        .get('/api/v1/social/timeline')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.feed.length).toBeGreaterThan(0);
      
      // Look for user1's rate_movie action in user2's timeline feed
      const rateActivity = res.body.data.feed.find(
        (act) => act.activityType === 'rate_movie' && act.userId._id === user1Id
      );
      expect(rateActivity).toBeDefined();
      expect(rateActivity.metadata.movieTitle).toBe('Fight Club');
    });
  });
});
