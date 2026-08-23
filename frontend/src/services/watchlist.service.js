import api from './api';

export const createWatchlist = async (data) => {
  const res = await api.post('/watchlists', data);
  return res.data.data.watchlist;
};

export const getMyWatchlists = async () => {
  const res = await api.get('/watchlists');
  return res.data.data.watchlists;
};

export const getWatchlistById = async (id) => {
  const res = await api.get(`/watchlists/${id}`);
  return res.data.data.watchlist;
};

export const updateWatchlist = async (id, data) => {
  const res = await api.put(`/watchlists/${id}`, data);
  return res.data.data.watchlist;
};

export const deleteWatchlist = async (id) => {
  const res = await api.delete(`/watchlists/${id}`);
  return res.data;
};

export const addMovieToWatchlist = async (watchlistId, movieData) => {
  const res = await api.post(`/watchlists/${watchlistId}/movies`, movieData);
  return res.data.data.watchlist;
};

export const removeMovieFromWatchlist = async (watchlistId, tmdbId) => {
  const res = await api.delete(`/watchlists/${watchlistId}/movies/${tmdbId}`);
  return res.data.data.watchlist;
};

export const reorderWatchlistMovies = async (watchlistId, tmdbIds) => {
  const res = await api.put(`/watchlists/${watchlistId}/reorder`, { tmdbIds });
  return res.data.data.watchlist;
};

export const addCollaborator = async (watchlistId, username) => {
  const res = await api.post(`/watchlists/${watchlistId}/collaborators`, { username });
  return res.data.data.watchlist;
};

export const removeCollaborator = async (watchlistId, userId) => {
  const res = await api.delete(`/watchlists/${watchlistId}/collaborators/${userId}`);
  return res.data.data.watchlist;
};

export const duplicateWatchlist = async (watchlistId) => {
  const res = await api.post(`/watchlists/${watchlistId}/duplicate`);
  return res.data.data.watchlist;
};

export const getPublicWatchlistsOfUser = async (userId) => {
  const res = await api.get(`/watchlists/user/${userId}`);
  return res.data.data.watchlists;
};
