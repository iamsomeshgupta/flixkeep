import api from './api';

export const createReview = async (data) => {
  const res = await api.post('/reviews', data);
  return res.data.data.review;
};

export const getMovieReviews = async (tmdbId, page = 1, sortBy = 'createdAt') => {
  const res = await api.get(`/reviews/movie/${tmdbId}`, {
    params: { page, sortBy },
  });
  return res.data.data;
};

export const toggleLikeReview = async (reviewId) => {
  const res = await api.post(`/reviews/${reviewId}/like`);
  return res.data.data.review;
};

export const addCommentToReview = async (reviewId, text) => {
  const res = await api.post(`/reviews/${reviewId}/comments`, { text });
  return res.data.data.review;
};

export const deleteCommentFromReview = async (reviewId, commentId) => {
  const res = await api.delete(`/reviews/${reviewId}/comments/${commentId}`);
  return res.data.data.review;
};
