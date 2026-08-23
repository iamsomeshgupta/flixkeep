const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Notification = require('../src/models/Notification');
const Token = require('../src/models/Token');

const testDbUri = 'mongodb://localhost:27017/flixkeep-test';

let accessToken;
let userId;
let senderId;

const mockUser = {
  username: 'notificationuser',
  email: 'notificationuser@example.com',
  password: 'Password123!',
};

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(testDbUri);

  await User.deleteMany({});
  await Notification.deleteMany({});
  await Token.deleteMany({});

  // Setup user
  await request(app).post('/api/v1/auth/register').send(mockUser);
  const loginRes = await request(app).post('/api/v1/auth/login').send({
    email: mockUser.email,
    password: mockUser.password,
  });
  accessToken = loginRes.body.data.accessToken;
  userId = loginRes.body.data.user.id;

  // Create a mock sender user
  const sender = new User({
    username: 'mocksender',
    email: 'mocksender@example.com',
    password: 'Password123!',
    isVerified: true,
  });
  await sender.save();
  senderId = sender._id;
});

afterAll(async () => {
  await User.deleteMany({});
  await Notification.deleteMany({});
  await Token.deleteMany({});
  await mongoose.connection.close();
});

describe('Notification API Endpoints', () => {
  let notificationId;

  beforeEach(async () => {
    await Notification.deleteMany({});
    
    // Seed a mock unread notification
    const doc = new Notification({
      recipient: userId,
      sender: senderId,
      type: 'like',
      metadata: {
        reviewId: new mongoose.Types.ObjectId(),
        movieTitle: 'Inception',
      },
    });
    await doc.save();
    notificationId = doc._id;
  });

  describe('GET /api/v1/notifications', () => {
    it('should retrieve all notifications for the user', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.notifications).toHaveLength(1);
      expect(res.body.data.notifications[0].type).toBe('like');
      expect(res.body.data.notifications[0].sender.username).toBe('mocksender');
    });
  });

  describe('GET /api/v1/notifications/unread', () => {
    it('should return unread count correctly', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/unread')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.unreadCount).toBe(1);
    });
  });

  describe('PUT /api/v1/notifications/:id', () => {
    it('should mark a notification as read', async () => {
      const res = await request(app)
        .put(`/api/v1/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.notification.isRead).toBe(true);

      // Verify unread count is now 0
      const countRes = await request(app)
        .get('/api/v1/notifications/unread')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(countRes.body.data.unreadCount).toBe(0);
    });
  });

  describe('PUT /api/v1/notifications/mark-all', () => {
    it('should mark all notifications as read', async () => {
      // Add a second notification first
      const doc2 = new Notification({
        recipient: userId,
        sender: senderId,
        type: 'follow',
        metadata: {},
      });
      await doc2.save();

      const res = await request(app)
        .put('/api/v1/notifications/mark-all')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      // Verify unread count is 0
      const countRes = await request(app)
        .get('/api/v1/notifications/unread')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(countRes.body.data.unreadCount).toBe(0);
    });
  });
});
