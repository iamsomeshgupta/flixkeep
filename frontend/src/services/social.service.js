import api from './api';

export const getUserProfile = async (userId) => {
  const res = await api.get(`/social/profile/${userId}`);
  return res.data.data;
};

export const getUserActivities = async (userId) => {
  const res = await api.get(`/social/activities/${userId}`);
  return res.data.data;
};

export const followUser = async (userId) => {
  const res = await api.post(`/social/follow/${userId}`);
  return res.data;
};

export const unfollowUser = async (userId) => {
  const res = await api.post(`/social/unfollow/${userId}`);
  return res.data;
};

export const getTimelineFeed = async (page = 1) => {
  const res = await api.get('/social/timeline', { params: { page } });
  return res.data.data;
};

export const getFollowers = async (userId) => {
  const res = await api.get(`/social/followers/${userId}`);
  return res.data.data.followers;
};

export const getFollowing = async (userId) => {
  const res = await api.get(`/social/following/${userId}`);
  return res.data.data.following;
};
