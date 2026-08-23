const notificationRepository = require('../repositories/notificationRepository');
const socketService = require('./socketService');

class NotificationService {
  // Create and Dispatch Notification
  async triggerNotification(recipientId, senderId, type, metadata) {
    // 1. Prevent self-notifications
    if (recipientId.toString() === senderId.toString()) {
      return null;
    }

    // 2. Save to database
    const notification = await notificationRepository.create({
      recipient: recipientId,
      sender: senderId,
      type,
      metadata,
    });

    // 3. Populate sender details for UI binding
    const populated = await notification.populate('sender', 'username avatarUrl');

    // 4. Send over active WebSockets room
    socketService.sendNotification(recipientId, populated);

    return populated;
  }

  // Fetch user notifications
  async getUserNotifications(userId) {
    return await notificationRepository.findByUser(userId);
  }

  // Mark single notification read
  async markAsRead(id, userId) {
    return await notificationRepository.markAsRead(id, userId);
  }

  // Mark all notifications read
  async markAllAsRead(userId) {
    await notificationRepository.markAllAsRead(userId);
    return true;
  }

  // Get count of unread notifications
  async getUnreadCount(userId) {
    const count = await notificationRepository.countUnread(userId);
    return { unreadCount: count };
  }
}

module.exports = new NotificationService();
