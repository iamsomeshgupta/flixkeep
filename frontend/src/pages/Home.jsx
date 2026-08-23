import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Play, Info, Star, Calendar, Activity, Users, Film, Heart } from 'lucide-react';
import { getTrending, getPopular, getTopRated, getUpcoming } from '../services/movie.service';
import { getTimelineFeed } from '../services/social.service';
import { useAuth } from '../context/AuthContext';
import MovieCard from '../components/MovieCard';
import { CarouselSkeleton } from '../components/SkeletalLoader';

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

function MovieRow({ title, query }) {
  const { data, isLoading, error } = query;

  return (
    <div className="mb-5">
      <h3 className="font-display fw-bold mb-3 text-start border-start border-danger border-3 ps-3">{title}</h3>
      {isLoading ? (
        <CarouselSkeleton />
      ) : error ? (
        <div className="text-start text-secondary small py-4">Failed to load movie lists.</div>
      ) : (
        <div className="d-flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'thin' }}>
          {(data.results || []).map((movie) => (
            <div key={movie.id} className="flex-shrink-0">
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();

  // Queries
  const trendingQuery = useQuery({ queryKey: ['movies', 'trending'], queryFn: () => getTrending() });
  const popularQuery = useQuery({ queryKey: ['movies', 'popular'], queryFn: () => getPopular() });
  const topRatedQuery = useQuery({ queryKey: ['movies', 'topRated'], queryFn: () => getTopRated() });
  const upcomingQuery = useQuery({ queryKey: ['movies', 'upcoming'], queryFn: () => getUpcoming() });

  // Friend Timeline feed (only if logged in)
  const timelineQuery = useQuery({
    queryKey: ['timeline-feed'],
    queryFn: () => getTimelineFeed(1),
    enabled: !!user,
  });

  const trendingMovies = trendingQuery.data?.results || [];
  const heroMovie = trendingMovies[0];

  const heroBackdrop = heroMovie ? `${BACKDROP_BASE}${heroMovie.backdrop_path}` : '';
  const heroRating = heroMovie?.vote_average ? heroMovie.vote_average.toFixed(1) : '0.0';
  const heroYear = heroMovie?.release_date ? heroMovie.release_date.split('-')[0] : 'N/A';

  const feedList = timelineQuery.data?.feed || [];

  return (
    <div className="pb-5">
      {/* 1. Netflix-Style Hero Banner */}
      {heroMovie && (
        <div 
          className="position-relative d-flex align-items-end text-start mb-5"
          style={{
            minHeight: '75vh',
            backgroundImage: `linear-gradient(to top, rgba(8, 9, 15, 1) 0%, rgba(8, 9, 15, 0.4) 60%, rgba(8, 9, 15, 0.1) 100%), url(${heroBackdrop})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
          }}
        >
          <div className="container pb-5 px-4">
            <div className="row">
              <div className="col-lg-7 col-md-10">
                
                {/* Meta details */}
                <div className="d-flex align-items-center gap-3 mb-2 small text-secondary">
                  <span className="rating-badge">
                    <Star size={12} fill="var(--accent-color)" stroke="none" />
                    {heroRating}
                  </span>
                  <span className="d-flex align-items-center gap-1">
                    <Calendar size={12} />
                    {heroYear}
                  </span>
                  <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25 px-2">
                    TRENDING TODAY
                  </span>
                </div>

                {/* Movie Title */}
                <h1 className="display-3 font-display fw-bold mb-3 tracking-tight text-white">
                  {heroMovie.title}
                </h1>

                {/* Overview */}
                <p className="lead text-secondary mb-4 fs-6" style={{ maxHeight: '120px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebKitLineClamp: 3, WebKitBoxOrient: 'vertical' }}>
                  {heroMovie.overview}
                </p>

                {/* Actions */}
                <div className="d-flex gap-3">
                  <Link to={`/movie/${heroMovie.id}`} className="btn btn-netflix d-flex align-items-center gap-2 px-4 py-2">
                    <Play size={18} fill="white" />
                    <span>Watch Details</span>
                  </Link>
                  <Link to={`/movie/${heroMovie.id}#reviews`} className="btn btn-glass d-flex align-items-center gap-2 px-4 py-2">
                    <Info size={18} />
                    <span>Reviews</span>
                  </Link>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Content Grid (Split view if logged in) */}
      <div className="container px-4">
        {user ? (
          <div className="row g-5">
            {/* Left Movie Lists */}
            <div className="col-lg-8">
              <MovieRow title="Trending Movies" query={trendingQuery} />
              <MovieRow title="Popular Hits" query={popularQuery} />
              <MovieRow title="Top Rated Classics" query={topRatedQuery} />
              <MovieRow title="Anticipated Releases" query={upcomingQuery} />
            </div>

            {/* Right Friend Timeline Feed */}
            <div className="col-lg-4 text-start">
              <div className="glass-panel p-4 position-sticky" style={{ top: '100px' }}>
                <h4 className="font-display fw-bold mb-4 d-flex align-items-center gap-2 text-white">
                  <Activity size={20} className="text-danger" />
                  Friend Feed
                </h4>

                {timelineQuery.isLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-danger spinner-border-sm" role="status"></div>
                  </div>
                ) : feedList.length === 0 ? (
                  <div className="text-secondary small py-4 text-center">
                    No activity logs from friends yet. Try following other members!
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {feedList.slice(0, 10).map((act) => {
                      const { metadata, activityType, createdAt, userId, _id } = act;
                      
                      let text = '';
                      let link = null;

                      if (activityType === 'rate_movie') {
                        text = `rated ${metadata.movieTitle} ${metadata.rating}★`;
                        link = `/movie/${metadata.tmdbId}`;
                      } else if (activityType === 'create_watchlist') {
                        text = `created watchlist "${metadata.watchlistName}"`;
                        link = `/watchlist/${metadata.watchlistId}`;
                      } else if (activityType === 'follow_user') {
                        text = `followed ${metadata.targetUsername}`;
                        link = `/user/${metadata.targetUserId}`;
                      } else if (activityType === 'add_movie') {
                        text = `added ${metadata.movieTitle} to a watchlist`;
                        link = `/movie/${metadata.tmdbId}`;
                      }

                      return (
                        <div key={_id} className="d-flex align-items-start gap-2 pb-2 border-bottom border-secondary-subtle border-opacity-10">
                          <Link to={`/user/${userId._id}`}>
                            <img
                              src={userId.avatarUrl}
                              alt={userId.username}
                              className="rounded-circle border border-secondary border-opacity-25"
                              style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                            />
                          </Link>
                          
                          <div style={{ fontSize: '0.85rem' }}>
                            <div>
                              <Link to={`/user/${userId._id}`} className="fw-bold text-white text-decoration-none hover:text-danger me-1">
                                {userId.username}
                              </Link>
                              <span className="text-secondary">{text}</span>
                            </div>
                            
                            <div className="d-flex align-items-center gap-2 mt-1">
                              <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                                {new Date(createdAt).toLocaleDateString()}
                              </span>
                              {link && (
                                <Link to={link} className="text-danger text-decoration-none font-semibold hover:underline" style={{ fontSize: '0.75rem' }}>
                                  View
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Plain Discover Feed (Not Logged in) */
          <div>
            <MovieRow title="Trending Movies" query={trendingQuery} />
            <MovieRow title="Popular Hits" query={popularQuery} />
            <MovieRow title="Top Rated Classics" query={topRatedQuery} />
            <MovieRow title="Anticipated Releases" query={upcomingQuery} />
          </div>
        )}
      </div>

    </div>
  );
}
