const notificationService = require('../services/notificationService');

class NotificationController {
  // Get User Notifications
  async getMyNotifications(req, res, next) {
    try {
      const notifications = await notificationService.getUserNotifications(req.user._id);
      res.status(200).json({
        status: 'success',
        data: { notifications },
      });
    } catch (error) {
      next(error);
    }
  }

  // Mark single notification as read
  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await notificationService.markAsRead(id, req.user._id);
      res.status(200).json({
        status: 'success',
        data: { notification },
      });
    } catch (error) {
      next(error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(req, res, next) {
    try {
      await notificationService.markAllAsRead(req.user._id);
      res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read.',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get count of unread notifications
  async getUnreadCount(req, res, next) {
    try {
      const data = await notificationService.getUnreadCount(req.user._id);
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
