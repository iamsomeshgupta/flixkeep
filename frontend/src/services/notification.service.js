import api from './api';

export const getMyNotifications = async () => {
  const res = await api.get('/notifications');
  return res.data.data.notifications;
};

export const getUnreadCount = async () => {
  const res = await api.get('/notifications/unread');
  return res.data.data.unreadCount;
};

export const markNotificationAsRead = async (id) => {
  const res = await api.put(`/notifications/${id}`);
  return res.data.data.notification;
};

export const markAllNotificationsAsRead = async () => {
  const res = await api.put('/notifications/mark-all');
  return res.data;
};
