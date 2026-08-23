const Notification = require('../models/Notification');

class NotificationRepository {
  async create(notificationData) {
    const notification = new Notification(notificationData);
    return await notification.save();
  }

  async findByUser(userId, { limit = 20 } = {}) {
    return await Notification.find({ recipient: userId })
      .populate('sender', 'username avatarUrl')
      .limit(limit)
      .sort({ createdAt: -1 });
  }

  async markAsRead(id, recipientId) {
    return await Notification.findOneAndUpdate(
      { _id: id, recipient: recipientId },
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(recipientId) {
    return await Notification.updateMany(
      { recipient: recipientId, isRead: false },
      { isRead: true }
    );
  }

  async countUnread(recipientId) {
    return await Notification.countDocuments({ recipient: recipientId, isRead: false });
  }
}

module.exports = new NotificationRepository();
