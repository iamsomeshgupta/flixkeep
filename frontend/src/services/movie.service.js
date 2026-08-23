import api from './api';

export const getTrending = async (page = 1) => {
  const res = await api.get('/movies/trending', { params: { page } });
  return res.data.data;
};

export const getPopular = async (page = 1) => {
  const res = await api.get('/movies/popular', { params: { page } });
  return res.data.data;
};

export const getTopRated = async (page = 1) => {
  const res = await api.get('/movies/top-rated', { params: { page } });
  return res.data.data;
};

export const getUpcoming = async (page = 1) => {
  const res = await api.get('/movies/upcoming', { params: { page } });
  return res.data.data;
};

export const searchMovies = async (query, page = 1) => {
  const res = await api.get('/movies/search', { params: { query, page } });
  return res.data.data;
};

export const getSuggestions = async (query) => {
  const res = await api.get('/movies/suggestions', { params: { query } });
  return res.data.data;
};

export const getMovieDetails = async (movieId) => {
  const res = await api.get(`/movies/${movieId}`);
  return res.data.data;
};

export const getMovieCredits = async (movieId) => {
  const res = await api.get(`/movies/${movieId}/credits`);
  return res.data.data;
};

export const getMovieVideos = async (movieId) => {
  const res = await api.get(`/movies/${movieId}/videos`);
  return res.data.data;
};

export const getMovieRecommendations = async (movieId, page = 1) => {
  const res = await api.get(`/movies/${movieId}/recommendations`, { params: { page } });
  return res.data.data;
};

export const getMovieSimilar = async (movieId, page = 1) => {
  const res = await api.get(`/movies/${movieId}/similar`, { params: { page } });
  return res.data.data;
};

export const getGenres = async () => {
  const res = await api.get('/movies/genres');
  return res.data.data;
};

export const getPersonalizedRecommendations = async () => {
  const res = await api.get('/movies/recommendations/personalized');
  return res.data.data;
};
