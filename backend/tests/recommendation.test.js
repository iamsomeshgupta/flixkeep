const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Review = require('../src/models/Review');
const Activity = require('../src/models/Activity');
const Token = require('../src/models/Token');

const testDbUri = 'mongodb://localhost:27017/flixkeep-test';

let accessToken;
let userId;

const mockUser = {
  username: 'recommendationuser',
  email: 'recommendationuser@example.com',
  password: 'Password123!',
};

// Mock TMDB Service
jest.mock('../src/services/tmdbService', () => {
  return {
    getMovieRecommendations: jest.fn().mockResolvedValue({
      results: [
        { id: 991, title: 'Recommended Film 1', poster_path: '/rec1.jpg', vote_average: 8.0 },
        { id: 992, title: 'Recommended Film 2', poster_path: '/rec2.jpg', vote_average: 7.5 },
      ],
    }),
    getTrending: jest.fn().mockResolvedValue({
      results: [],
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
  await Activity.deleteMany({});
  await Token.deleteMany({});

  // Setup user
  await request(app).post('/api/v1/auth/register').send(mockUser);
  const loginRes = await request(app).post('/api/v1/auth/login').send({
    email: mockUser.email,
    password: mockUser.password,
  });
  accessToken = loginRes.body.data.accessToken;
  userId = loginRes.body.data.user.id;
});

afterAll(async () => {
  await User.deleteMany({});
  await Review.deleteMany({});
  await Activity.deleteMany({});
  await Token.deleteMany({});
  await mongoose.connection.close();
});

describe('Personalized Recommendations API Endpoints', () => {
  
  it('should return personalized recommendations after user rates a movie', async () => {
    // 1. User rates a movie highly (Fight Club, 10★)
    await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tmdbId: 550,
        rating: 10,
        reviewText: 'Masterpiece.',
        isSpoiler: false,
        movieTitle: 'Fight Club',
      });

    // 2. Fetch personalized recommendations
    const res = await request(app)
      .get('/api/v1/movies/recommendations/personalized')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.length).toBeGreaterThan(0);
    
    // Check if the movie recommendation reason lists Fight Club
    const recItem = res.body.data.find(
      (item) => item.reason === 'Because you liked "Fight Club"'
    );
    expect(recItem).toBeDefined();
    expect(recItem.movie.title).toBe('Recommended Film 1');
  });
});
