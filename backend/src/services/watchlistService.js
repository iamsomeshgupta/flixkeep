const watchlistRepository = require('../repositories/watchlistRepository');
const userRepository = require('../repositories/userRepository');
const notificationService = require('./notificationService');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');

class WatchlistService {
  // Helper to retrieve watchlist and verify user has access (owner or collaborator)
  async getWatchlistAndVerifyAccess(watchlistId, userId, requireOwner = false) {
    const watchlist = await watchlistRepository.findById(watchlistId);
    if (!watchlist) {
      throw new NotFoundError('Watchlist not found');
    }

    const isOwner = watchlist.owner._id.toString() === userId.toString();
    const isCollaborator = watchlist.collaborators.some(
      (c) => c._id.toString() === userId.toString()
    );

    if (requireOwner && !isOwner) {
      throw new ForbiddenError('Only the watchlist owner can perform this action');
    }

    if (!isOwner && !isCollaborator && !watchlist.isPublic) {
      throw new ForbiddenError('You do not have access to this private watchlist');
    }

    return { watchlist, isOwner, isCollaborator };
  }

  // Create Watchlist
  async createWatchlist(userId, data) {
    return await watchlistRepository.create({
      ...data,
      owner: userId,
    });
  }

  // Get Watchlist by ID
  async getWatchlistById(watchlistId, userId) {
    const { watchlist } = await this.getWatchlistAndVerifyAccess(watchlistId, userId);
    return watchlist;
  }

  // Get User Watchlists
  async getUserWatchlists(userId) {
    return await watchlistRepository.findByUser(userId);
  }

  // Get Public Watchlists for another User
  async getPublicWatchlists(userId) {
    return await watchlistRepository.findPublicByUser(userId);
  }

  // Update Watchlist Settings (name, description, isPublic)
  async updateWatchlist(watchlistId, userId, updateData) {
    // Only owner or collaborator can edit details
    await this.getWatchlistAndVerifyAccess(watchlistId, userId);
    
    // Prevent owner swap or movies override here
    delete updateData.owner;
    delete updateData.movies;
    delete updateData.collaborators;

    return await watchlistRepository.update(watchlistId, updateData);
  }

  // Delete Watchlist
  async deleteWatchlist(watchlistId, userId) {
    // Only owner can delete
    await this.getWatchlistAndVerifyAccess(watchlistId, userId, true);
    await watchlistRepository.delete(watchlistId);
    return true;
  }

  // Add Movie to Watchlist
  async addMovie(watchlistId, userId, movieData) {
    const { watchlist } = await this.getWatchlistAndVerifyAccess(watchlistId, userId);

    const movieExists = watchlist.movies.some((m) => m.tmdbId === movieData.tmdbId);
    if (movieExists) {
      throw new BadRequestError('This movie is already in the watchlist');
    }

    // Compute order (append to end)
    const maxOrder = watchlist.movies.reduce((max, m) => (m.order > max ? m.order : max), -1);
    
    watchlist.movies.push({
      tmdbId: movieData.tmdbId,
      title: movieData.title,
      posterPath: movieData.posterPath,
      order: maxOrder + 1,
    });

    return await watchlist.save();
  }

  // Remove Movie from Watchlist
  async removeMovie(watchlistId, userId, tmdbId) {
    const { watchlist } = await this.getWatchlistAndVerifyAccess(watchlistId, userId);

    const initialLength = watchlist.movies.length;
    watchlist.movies = watchlist.movies.filter((m) => m.tmdbId !== Number(tmdbId));

    if (watchlist.movies.length === initialLength) {
      throw new NotFoundError('Movie not found in this watchlist');
    }

    // Normalize orders after removal to keep consecutive index bounds
    watchlist.movies.forEach((movie, index) => {
      movie.order = index;
    });

    return await watchlist.save();
  }

  // Reorder Movies
  async reorderMovies(watchlistId, userId, tmdbIdsOrder) {
    const { watchlist } = await this.getWatchlistAndVerifyAccess(watchlistId, userId);

    // Map tmdbId to its new index
    const orderMap = {};
    tmdbIdsOrder.forEach((id, index) => {
      orderMap[Number(id)] = index;
    });

    // Update order values
    watchlist.movies.forEach((movie) => {
      if (orderMap[movie.tmdbId] !== undefined) {
        movie.order = orderMap[movie.tmdbId];
      }
    });

    // Sort sub-documents array in place
    watchlist.movies.sort((a, b) => a.order - b.order);

    return await watchlist.save();
  }

  // Add Collaborator (by Username)
  async addCollaborator(watchlistId, ownerId, collaboratorUsername) {
    // Requires owner verification
    const { watchlist } = await this.getWatchlistAndVerifyAccess(watchlistId, ownerId, true);

    const collaborator = await userRepository.findByUsername(collaboratorUsername);
    if (!collaborator) {
      throw new NotFoundError('User not found');
    }

    if (collaborator._id.toString() === ownerId.toString()) {
      throw new BadRequestError('You cannot add yourself as a collaborator');
    }

    const alreadyCollaborator = watchlist.collaborators.some(
      (c) => c._id.toString() === collaborator._id.toString()
    );

    if (alreadyCollaborator) {
      throw new BadRequestError('User is already a collaborator');
    }

    watchlist.collaborators.push(collaborator._id);
    await watchlist.save();

    // Trigger Notification
    try {
      await notificationService.triggerNotification(collaborator._id, ownerId, 'collaboration', {
        watchlistId: watchlist._id,
        watchlistName: watchlist.name,
      });
    } catch (err) {
      console.error('Failed to trigger collaborator notification:', err);
    }

    return watchlist;
  }

  // Remove Collaborator
  async removeCollaborator(watchlistId, ownerId, collaboratorId) {
    const { watchlist } = await this.getWatchlistAndVerifyAccess(watchlistId, ownerId, true);

    const initialLength = watchlist.collaborators.length;
    watchlist.collaborators = watchlist.collaborators.filter(
      (c) => c.toString() !== collaboratorId.toString() && c._id?.toString() !== collaboratorId.toString()
    );

    if (watchlist.collaborators.length === initialLength) {
      throw new NotFoundError('Collaborator not found on this watchlist');
    }

    return await watchlist.save();
  }

  // Duplicate Watchlist
  async duplicateWatchlist(watchlistId, userId) {
    const target = await watchlistRepository.findById(watchlistId);
    if (!target) {
      throw new NotFoundError('Watchlist not found');
    }

    // Only allow copying if public, or if owner/collaborator
    const isOwner = target.owner._id.toString() === userId.toString();
    const isCollaborator = target.collaborators.some(
      (c) => c._id.toString() === userId.toString()
    );

    if (!target.isPublic && !isOwner && !isCollaborator) {
      throw new ForbiddenError('You cannot copy a private watchlist');
    }

    // Create duplicate copies of the movies list
    const copiedMovies = target.movies.map((m) => ({
      tmdbId: m.tmdbId,
      title: m.title,
      posterPath: m.posterPath,
      order: m.order,
    }));

    return await watchlistRepository.create({
      name: `Copy of ${target.name}`,
      description: target.description,
      owner: userId,
      movies: copiedMovies,
      copiedFrom: target._id,
      isPublic: true, // Default duplicate to public for user profile display
    });
  }
}

module.exports = new WatchlistService();
