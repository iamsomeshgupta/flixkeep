const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Token = require('../src/models/Token');

const testDbUri = 'mongodb://localhost:27017/flixkeep-test';

beforeAll(async () => {
  // Ensure we are working on the test DB
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(testDbUri);
});

afterAll(async () => {
  // Clean up database collections and close connection
  await User.deleteMany({});
  await Token.deleteMany({});
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Token.deleteMany({});
});

describe('Authentication API Endpoints', () => {
  const mockUser = {
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'Password123!',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(mockUser);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.username).toBe(mockUser.username);
      expect(res.body.data.user.email).toBe(mockUser.email);
      expect(res.body.data.user.isVerified).toBe(false);

      const dbUser = await User.findOne({ email: mockUser.email });
      expect(dbUser).toBeDefined();
      expect(dbUser.username).toBe(mockUser.username);
    });

    it('should fail registration if username is too short', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...mockUser, username: 'te' });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
    });

    it('should fail registration if email is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...mockUser, email: 'not-an-email' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create user directly in DB
      await User.create(mockUser);
    });

    it('should successfully login and return access & refresh tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: mockUser.email,
          password: mockUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.username).toBe(mockUser.username);
    });

    it('should fail login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: mockUser.email,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(411); // 401 Unauthorized
      expect(res.body.status).toBe('fail');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let accessToken;

    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(mockUser);

      // Login to get access token
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: mockUser.email,
          password: mockUser.password,
        });
      accessToken = res.body.data.accessToken;
    });

    it('should return the logged in user profile details', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.username).toBe(mockUser.username);
      expect(res.body.data.user.email).toBe(mockUser.email);
    });

    it('should fail to fetch profile if unauthorized', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer invalidtoken`);

      expect(res.status).toBe(411); // 401 Unauthorized
    });
  });
});
