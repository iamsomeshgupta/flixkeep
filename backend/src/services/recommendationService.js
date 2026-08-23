const tmdbService = require('./tmdbService');
const Activity = require('../models/Activity');
const Follow = require('../models/Follow');
const Review = require('../models/Review');
const User = require('../models/User');

class RecommendationService {
  async getPersonalizedRecommendations(userId) {
    const recommendations = [];
    const seenMovieIds = new Set();

    try {
      // 1. Content-based: Recommendations based on highly rated movies (Rating >= 7)
      const highlyRatedActivities = await Activity.find({
        userId,
        activityType: 'rate_movie',
        'metadata.rating': { $gte: 7 },
      })
        .limit(3)
        .sort({ createdAt: -1 });

      for (const activity of highlyRatedActivities) {
        const { tmdbId, movieTitle } = activity.metadata;
        
        try {
          const tmdbRecs = await tmdbService.getMovieRecommendations(tmdbId);
          if (tmdbRecs && tmdbRecs.results) {
            // Take top 3 recommendations per highly rated movie
            tmdbRecs.results.slice(0, 3).forEach((movie) => {
              if (!seenMovieIds.has(movie.id)) {
                seenMovieIds.add(movie.id);
                recommendations.push({
                  movie,
                  reason: `Because you liked "${movieTitle}"`,
                });
              }
            });
          }
        } catch (e) {
          // Keep loop running if one TMDB fetch fails
          console.error(`Failed to fetch TMDB recommendations for movie ${tmdbId}`);
        }
      }

      // 2. Collaborative / Social: Movies highly rated by followed users (Rating >= 8)
      const following = await Follow.find({ followerId: userId }).select('followingId');
      const followingIds = following.map((f) => f.followingId);

      if (followingIds.length > 0) {
        const socialHighlyRated = await Activity.find({
          userId: { $in: followingIds },
          activityType: 'rate_movie',
          'metadata.rating': { $gte: 8 },
        })
          .populate('userId', 'username')
          .limit(5)
          .sort({ createdAt: -1 });

        socialHighlyRated.forEach((activity) => {
          const { tmdbId, movieTitle } = activity.metadata;
          const friendName = activity.userId?.username || 'a friend';
          
          // Mimic a TMDB movie object structure for list rendering
          const movieObj = {
            id: tmdbId,
            title: movieTitle,
            poster_path: activity.metadata.posterPath || '',
            vote_average: activity.metadata.rating,
            release_date: '',
          };

          if (!seenMovieIds.has(tmdbId)) {
            seenMovieIds.add(tmdbId);
            recommendations.push({
              movie: movieObj,
              reason: `Highly rated by your friend @${friendName}`,
            });
          }
        });
      }

      // 3. Preference-based: Genre matching
      const user = await User.findById(userId);
      if (user && user.favoriteGenres && user.favoriteGenres.length > 0) {
        // Fetch trending movies and filter/sort based on user's favorite genres
        const trending = await tmdbService.getTrending(1);
        if (trending && trending.results) {
          // Resolve genres map once
          const genresList = await tmdbService.getGenres();
          const genreIdMap = {};
          if (genresList && genresList.genres) {
            genresList.genres.forEach((g) => {
              genreIdMap[g.name.toLowerCase()] = g.id;
            });
          }

          // Convert user favorite genres to TMDB IDs
          const userGenreIds = user.favoriteGenres
            .map((name) => genreIdMap[name.toLowerCase()])
            .filter((id) => id !== undefined);

          if (userGenreIds.length > 0) {
            trending.results.forEach((movie) => {
              const hasMatchingGenre = movie.genre_ids?.some((id) => userGenreIds.includes(id));
              
              if (hasMatchingGenre && !seenMovieIds.has(movie.id)) {
                seenMovieIds.add(movie.id);
                recommendations.push({
                  movie,
                  reason: `Matches your favorite genres`,
                });
              }
            });
          }
        }
      }

      // If we still don't have enough recommendations, fill with popular trending items
      if (recommendations.length < 5) {
        const trending = await tmdbService.getTrending(1);
        if (trending && trending.results) {
          trending.results.slice(0, 10).forEach((movie) => {
            if (!seenMovieIds.has(movie.id)) {
              seenMovieIds.add(movie.id);
              recommendations.push({
                movie,
                reason: 'Trending Recommendation',
              });
            }
          });
        }
      }

    } catch (error) {
      console.error('Error constructing personalized recommendations:', error);
    }

    return recommendations;
  }
}

module.exports = new RecommendationService();
