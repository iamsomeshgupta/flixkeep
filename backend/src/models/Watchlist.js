const mongoose = require('mongoose');

const movieItemSchema = new mongoose.Schema({
  tmdbId: {
    type: Number,
    required: [true, 'TMDB Movie ID is required'],
  },
  title: {
    type: String,
    required: [true, 'Movie title is required'],
    trim: true,
  },
  posterPath: {
    type: String,
    default: '',
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
  order: {
    type: Number,
    required: true,
  },
});

const watchlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Watchlist name is required'],
      trim: true,
      maxlength: [50, 'Watchlist name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Watchlist must have an owner'],
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    movies: [movieItemSchema],
    copiedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Watchlist',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common lookups
watchlistSchema.index({ owner: 1, isPublic: 1 });
watchlistSchema.index({ collaborators: 1 });

const Watchlist = mongoose.model('Watchlist', watchlistSchema);
module.exports = Watchlist;
