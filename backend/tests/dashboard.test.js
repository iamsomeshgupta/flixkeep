const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Review = require('../src/models/Review');
const Token = require('../src/models/Token');

const testDbUri = 'mongodb://localhost:27017/flixkeep-test';

let userToken, userId;
let adminToken, adminId;

const mockUser = {
  username: 'regularuser',
  email: 'regularuser@example.com',
  password: 'Password123!',
};

const mockAdmin = {
  username: 'siteadmin',
  email: 'siteadmin@example.com',
  password: 'Password123!',
};

// Mock TMDB details
jest.mock('../src/services/tmdbService', () => {
  return {
    getMovieDetails: jest.fn().mockResolvedValue({
      id: 550,
      title: 'Fight Club',
      genres: [{ id: 18, name: 'Drama' }],
    }),
  };
});

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(testDbUri);

  await User.deleteMany({});
  await Review.deleteMany({});
  await Token.deleteMany({});

  // 1. Setup regular user
  await request(app).post('/api/v1/auth/register').send(mockUser);
  const loginUser = await request(app).post('/api/v1/auth/login').send({
    email: mockUser.email,
    password: mockUser.password,
  });
  userToken = loginUser.body.data.accessToken;
  userId = loginUser.body.data.user.id;

  // 2. Setup admin user
  const adminDoc = new User({
    username: mockAdmin.username,
    email: mockAdmin.email,
    password: mockAdmin.password,
    role: 'admin',
    isVerified: true,
  });
  await adminDoc.save();
  const loginAdmin = await request(app).post('/api/v1/auth/login').send({
    email: mockAdmin.email,
    password: mockAdmin.password,
  });
  adminToken = loginAdmin.body.data.accessToken;
  adminId = loginAdmin.body.data.user.id;
});

afterAll(async () => {
  await User.deleteMany({});
  await Review.deleteMany({});
  await Token.deleteMany({});
  await mongoose.connection.close();
});

describe('Dashboard & Admin controls API', () => {
  let reviewId;

  beforeAll(async () => {
    // Write a movie review for statistics seeding
    const rev = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        tmdbId: 550,
        rating: 9,
        reviewText: 'Outstanding!',
        movieTitle: 'Fight Club',
      });
    reviewId = rev.body.data.review._id;
  });

  describe('GET /api/v1/dashboard/user', () => {
    it('should aggregate user stats correctly', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/user')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.totalRated).toBe(1);
      expect(res.body.data.averageRating).toBe(9);
      expect(res.body.data.watchHours).toBe(2);
      expect(res.body.data.genreDistribution.Drama).toBe(1);
    });
  });

  describe('GET /api/v1/dashboard/admin', () => {
    it('should deny access to regular users', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/admin')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403); // Forbidden
    });

    it('should grant access to admin users', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.stats.totalUsers).toBe(2);
      expect(res.body.data.stats.totalReviews).toBe(1);
    });
  });

  describe('POST /api/v1/dashboard/admin/ban/:userId', () => {
    it('should ban the regular user and prevent subsequent logins', async () => {
      // 1. Admin bans regular user
      const banRes = await request(app)
        .post(`/api/v1/dashboard/admin/ban/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(banRes.status).toBe(200);
      expect(banRes.body.status).toBe('success');

      // 2. Regular user tries to access their profile (should be blocked)
      const authCheck = await request(app)
        .get('/api/v1/dashboard/user')
        .set('Authorization', `Bearer ${userToken}`);

      expect(authCheck.status).toBe(403); // suspended account
    });
  });
});
