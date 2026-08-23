import api from './api';

export const getUserAnalytics = async () => {
  const res = await api.get('/dashboard/user');
  return res.data.data;
};

export const getAdminAnalytics = async () => {
  const res = await api.get('/dashboard/admin');
  return res.data.data;
};

export const banUser = async (userId) => {
  const res = await api.post(`/dashboard/admin/ban/${userId}`);
  return res.data;
};

export const deleteReportedReview = async (reviewId) => {
  const res = await api.delete(`/dashboard/admin/review/${reviewId}`);
  return res.data;
};
