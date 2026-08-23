import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Clock, Calendar, Globe, Play, X, User, ChevronDown } from 'lucide-react';
import { 
  getMovieDetails, 
  getMovieCredits, 
  getMovieVideos, 
  getMovieRecommendations 
} from '../services/movie.service';
import { getMyWatchlists, addMovieToWatchlist } from '../services/watchlist.service';
import { useAuth } from '../context/AuthContext';
import MovieCard from '../components/MovieCard';
import MovieReviews from '../components/MovieReviews';
import { DetailsSkeleton } from '../components/SkeletalLoader';
import { toast } from 'react-toastify';

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const PROFILE_BASE = 'https://image.tmdb.org/t/p/w185';

export default function MovieDetail() {
  const { id } = useParams();
  const [showTrailer, setShowTrailer] = useState(false);

  // Queries using React Query
  const detailQuery = useQuery({ queryKey: ['movie', id], queryFn: () => getMovieDetails(id) });
  const creditsQuery = useQuery({ queryKey: ['movie', id, 'credits'], queryFn: () => getMovieCredits(id) });
  const videosQuery = useQuery({ queryKey: ['movie', id, 'videos'], queryFn: () => getMovieVideos(id) });
  const recsQuery = useQuery({ queryKey: ['movie', id, 'recs'], queryFn: () => getMovieRecommendations(id) });

  const isLoading = detailQuery.isLoading || creditsQuery.isLoading || videosQuery.isLoading || recsQuery.isLoading;

  if (isLoading) {
    return <DetailsSkeleton />;
  }

  if (detailQuery.error || !detailQuery.data) {
    return (
      <div className="container py-5 text-center text-secondary">
        <h3>Error Loading Movie Profile</h3>
        <p>This movie profile could not be found or TMDB connection failed.</p>
        <Link to="/" className="btn btn-netflix mt-3">Back to Home</Link>
      </div>
    );
  }

  const movie = detailQuery.data;
  const credits = creditsQuery.data || { cast: [], crew: [] };
  const videos = videosQuery.data?.results || [];
  const recommendations = recsQuery.data?.results || [];

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: watchlists = [] } = useQuery({
    queryKey: ['watchlists'],
    queryFn: getMyWatchlists,
    enabled: !!user,
  });

  const addMovieMutation = useMutation({
    mutationFn: ({ watchlistId, movieData }) => addMovieToWatchlist(watchlistId, movieData),
    onSuccess: (data, variables) => {
      const listName = watchlists.find((w) => w._id === variables.watchlistId)?.name || 'watchlist';
      toast.success(`Added "${movie.title}" to ${listName}!`);
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add movie to watchlist.');
    },
  });

  // Filter Director and Screenplay/Writer
  const director = credits.crew.find((p) => p.job === 'Director')?.name || 'Unknown';
  const writers = credits.crew
    .filter((p) => p.job === 'Writer' || p.job === 'Screenplay')
    .slice(0, 3)
    .map((p) => p.name)
    .join(', ') || 'N/A';

  // Find official YouTube trailer
  const trailer = videos.find(
    (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
  );

  const posterUrl = movie.poster_path 
    ? `${POSTER_BASE}${movie.poster_path}` 
    : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=500&h=750';

  const backdropUrl = movie.backdrop_path ? `${BACKDROP_BASE}${movie.backdrop_path}` : '';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'NR';
  const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
  const runtimeHours = Math.floor(movie.runtime / 60);
  const runtimeMins = movie.runtime % 60;

  React.useEffect(() => {
    if (movie && movie.id) {
      try {
        const historyJson = localStorage.getItem('flixkeep-watch-history');
        let history = historyJson ? JSON.parse(historyJson) : [];
        
        history = history.filter((m) => m.id !== movie.id);
        history.unshift({
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
        });
        
        history = history.slice(0, 8);
        localStorage.setItem('flixkeep-watch-history', JSON.stringify(history));
      } catch (err) {
        console.error('Failed to update watch history:', err);
      }
    }
  }, [movie]);

  return (
    <div className="pb-5">
      {/* 1. Blurred Backdrop Hero Banner */}
      <div 
        className="position-relative d-flex align-items-center text-start"
        style={{
          minHeight: '55vh',
          backgroundImage: `linear-gradient(to top, rgba(8, 9, 15, 1) 0%, rgba(8, 9, 15, 0.5) 60%, rgba(8, 9, 15, 0.2) 100%), url(${backdropUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      >
        <div className="container py-5 px-4">
          <div className="row g-4 align-items-center">
            
            {/* Poster column */}
            <div className="col-md-4 col-lg-3 text-center text-md-start">
              <img
                src={posterUrl}
                alt={movie.title}
                className="img-fluid rounded-3 shadow-lg border border-secondary border-opacity-25"
                style={{ maxHeight: '420px', width: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Description column */}
            <div className="col-md-8 col-lg-9 text-white">
              
              {/* Tags line */}
              <div className="d-flex flex-wrap align-items-center gap-3 mb-2 small text-secondary">
                <span className="rating-badge">
                  <Star size={12} fill="var(--accent-color)" stroke="none" />
                  {rating}
                </span>
                <span className="d-flex align-items-center gap-1">
                  <Clock size={12} />
                  {runtimeHours > 0 ? `${runtimeHours}h ` : ''}{runtimeMins}m
                </span>
                <span className="d-flex align-items-center gap-1">
                  <Calendar size={12} />
                  {releaseYear}
                </span>
              </div>

              {/* Title & Tagline */}
              <h1 className="display-4 font-display fw-bold mb-1 tracking-tight text-white">
                {movie.title}
              </h1>
              {movie.tagline && (
                <p className="lead italic text-secondary mb-4 fs-6" style={{ fontStyle: 'italic' }}>
                  "{movie.tagline}"
                </p>
              )}

              {/* Genres list */}
              <div className="d-flex flex-wrap gap-2 mb-4">
                {(movie.genres || []).map((genre) => (
                  <span
                    key={genre.id}
                    className="badge bg-secondary bg-opacity-25 text-secondary-emphasis border border-secondary border-opacity-25 px-3 py-2"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="d-flex flex-wrap gap-3">
                {trailer && (
                  <button 
                    onClick={() => setShowTrailer(true)} 
                    className="btn btn-netflix d-flex align-items-center gap-2 px-4 py-2"
                  >
                    <Play size={18} fill="white" />
                    <span>Watch Trailer</span>
                  </button>
                )}
                {/* Watchlist Actions Dropdown */}
                <div className="dropdown">
                  <button 
                    className="btn btn-glass dropdown-toggle d-flex align-items-center gap-2" 
                    type="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <ChevronDown size={16} />
                    <span>+ Add to Watchlist</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-dark glass-panel p-2 mt-2" style={{ border: '1px solid var(--border-color)', minWidth: '200px' }}>
                    {user ? (
                      watchlists.length === 0 ? (
                        <li>
                          <Link to="/watchlists" className="dropdown-item small text-secondary">
                            Create a Watchlist First
                          </Link>
                        </li>
                      ) : (
                        watchlists.map((list) => (
                          <li key={list._id}>
                            <button
                              className="dropdown-item small text-white py-2 rounded hover:bg-danger"
                              onClick={() => addMovieMutation.mutate({
                                watchlistId: list._id,
                                movieData: {
                                  tmdbId: movie.id,
                                  title: movie.title,
                                  posterPath: movie.poster_path,
                                }
                              })}
                            >
                              {list.name}
                            </button>
                          </li>
                        ))
                      )
                    ) : (
                      <li>
                        <Link to="/login" className="dropdown-item small text-danger fw-semibold">
                          Sign In to Add Movies
                        </Link>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* 2. Overview & Details Section */}
      <div className="container py-5 px-4 text-start">
        <div className="row g-5">
          
          {/* Main Info */}
          <div className="col-lg-8">
            <h3 className="font-display fw-bold mb-3 border-start border-danger border-3 ps-3">Storyline</h3>
            <p className="lead fs-6 text-secondary mb-5" style={{ lineHeight: '1.7' }}>
              {movie.overview || 'No storyline summary available.'}
            </p>

            {/* Cast row */}
            <h3 className="font-display fw-bold mb-3 border-start border-danger border-3 ps-3">Key Cast</h3>
            {credits.cast.length === 0 ? (
              <p className="text-secondary small mb-5">No cast details available.</p>
            ) : (
              <div className="d-flex gap-4 overflow-x-auto pb-4 mb-5" style={{ scrollbarWidth: 'thin' }}>
                {credits.cast.slice(0, 10).map((actor) => {
                  const avatarUrl = actor.profile_path
                    ? `${PROFILE_BASE}${actor.profile_path}`
                    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150'; // standard avatar fallback

                  return (
                    <div key={actor.id} className="text-center flex-shrink-0" style={{ width: '90px' }}>
                      <img
                        src={avatarUrl}
                        alt={actor.name}
                        className="rounded-circle mb-2 border border-secondary border-opacity-25"
                        style={{ width: '74px', height: '74px', objectFit: 'cover' }}
                      />
                      <div className="fw-bold text-white text-truncate small" title={actor.name}>
                        {actor.name}
                      </div>
                      <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }} title={actor.character}>
                        {actor.character}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recommendations / Similar */}
            {recommendations.length > 0 && (
              <div>
                <h3 className="font-display fw-bold mb-3 border-start border-danger border-3 ps-3">Recommended Movies</h3>
                <div className="d-flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'thin' }}>
                  {recommendations.slice(0, 10).map((recMovie) => (
                    <div key={recMovie.id} className="flex-shrink-0">
                      <MovieCard movie={recMovie} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Movie Reviews Widget */}
            <MovieReviews tmdbId={movie.id} movieTitle={movie.title} />

          </div>

          {/* Sidebar / Metadata details */}
          <div className="col-lg-4">
            <div className="glass-panel p-4">
              <h4 className="font-display fw-bold mb-4 border-bottom border-secondary-subtle border-opacity-10 pb-2">
                Movie Info
              </h4>

              <div className="mb-3">
                <div className="text-secondary small mb-1">Director</div>
                <div className="fw-bold text-white">{director}</div>
              </div>

              <div className="mb-3">
                <div className="text-secondary small mb-1">Writers</div>
                <div className="fw-bold text-white">{writers}</div>
              </div>

              <div className="mb-3">
                <div className="text-secondary small mb-1">Original Language</div>
                <div className="fw-bold text-white uppercase">{movie.original_language?.toUpperCase()}</div>
              </div>

              <div className="mb-3">
                <div className="text-secondary small mb-1">Release Date</div>
                <div className="fw-bold text-white">{movie.release_date || 'N/A'}</div>
              </div>

              {movie.budget > 0 && (
                <div className="mb-3">
                  <div className="text-secondary small mb-1">Budget</div>
                  <div className="fw-bold text-white">${movie.budget.toLocaleString()}</div>
                </div>
              )}

              {movie.revenue > 0 && (
                <div className="mb-3">
                  <div className="text-secondary small mb-1">Revenue</div>
                  <div className="fw-bold text-white">${movie.revenue.toLocaleString()}</div>
                </div>
              )}

              {movie.homepage && (
                <div className="mt-4">
                  <a
                    href={movie.homepage}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-glass btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                  >
                    <Globe size={14} />
                    Official Website
                  </a>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* 3. Trailer Iframe Modal Overlay */}
      {showTrailer && trailer && (
        <div 
          className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center bg-black bg-opacity-75"
          style={{ zIndex: 1050 }}
        >
          <div className="glass-panel p-2 position-relative w-100 mx-3 shadow-lg" style={{ maxWidth: '800px' }}>
            <button 
              onClick={() => setShowTrailer(false)}
              className="btn btn-link text-white position-absolute end-0 top-0 mt-3 me-3"
              style={{ zIndex: 10, padding: 0 }}
            >
              <X size={28} />
            </button>
            <div className="ratio ratio-16x9">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
                title="Movie Trailer"
                allowFullScreen
                allow="autoplay"
              ></iframe>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
