const Watchlist = require('../models/Watchlist');

class WatchlistRepository {
  async create(watchlistData) {
    const watchlist = new Watchlist(watchlistData);
    return await watchlist.save();
  }

  async findById(id) {
    return await Watchlist.findById(id)
      .populate('owner', 'username avatarUrl')
      .populate('collaborators', 'username avatarUrl');
  }

  async update(id, updateData) {
    return await Watchlist.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('owner', 'username avatarUrl')
      .populate('collaborators', 'username avatarUrl');
  }

  async delete(id) {
    return await Watchlist.findByIdAndDelete(id);
  }

  // Find all watchlists associated with user (owner or collaborator)
  async findByUser(userId) {
    return await Watchlist.find({
      $or: [
        { owner: userId },
        { collaborators: userId },
      ],
    })
      .populate('owner', 'username avatarUrl')
      .populate('collaborators', 'username avatarUrl')
      .sort({ updatedAt: -1 });
  }

  // Find only public watchlists belonging to a user
  async findPublicByUser(userId) {
    return await Watchlist.find({
      owner: userId,
      isPublic: true,
    })
      .populate('owner', 'username avatarUrl')
      .sort({ updatedAt: -1 });
  }

  // Find all public watchlists globally for discovery
  async findPublicAll({ limit = 10 } = {}) {
    return await Watchlist.find({ isPublic: true })
      .populate('owner', 'username avatarUrl')
      .limit(limit)
      .sort({ updatedAt: -1 });
  }
}

module.exports = new WatchlistRepository();
