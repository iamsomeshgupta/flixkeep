import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Film, ChevronRight } from 'lucide-react';
import { getUpcoming } from '../services/movie.service';
import SkeletalLoader from '../components/SkeletalLoader';

export default function MovieCalendar() {
  const { data, isLoading } = useQuery({
    queryKey: ['upcoming-calendar'],
    queryFn: () => getUpcoming(1),
  });

  const upcomingMovies = data?.results || [];

  // Group movies by release date
  const groupedMovies = upcomingMovies.reduce((groups, movie) => {
    const dateStr = movie.release_date || 'TBD';
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(movie);
    return groups;
  }, {});

  // Sort dates chronologically
  const sortedDates = Object.keys(groupedMovies).sort((a, b) => new Date(a) - new Date(b));

  const formatReleaseDate = (dateStr) => {
    if (dateStr === 'TBD') return 'Release Date TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const POSTER_BASE = 'https://image.tmdb.org/t/p/w185';

  return (
    <div className="container py-5 px-4 text-start">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="font-display fw-bold mb-1 d-flex align-items-center gap-2">
            <CalendarIcon className="text-danger" size={28} />
            Cinematic Release Calendar
          </h2>
          <p className="text-secondary small mb-0">Track upcoming movie releases and plan your watch schedule</p>
        </div>
      </div>

      {isLoading ? (
        <div className="row g-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="col-12 mb-4">
              <SkeletalLoader variant="card" />
            </div>
          ))}
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="glass-panel p-5 text-center text-secondary">
          <Film size={48} className="text-danger mb-3" />
          <h5>No Upcoming Releases Found</h5>
          <p className="small mb-0">Check back later for newly announced release dates.</p>
        </div>
      ) : (
        <div className="position-relative ps-4 border-start border-secondary-subtle border-opacity-25" style={{ marginLeft: '10px' }}>
          {sortedDates.map((dateStr) => (
            <div key={dateStr} className="mb-5 position-relative">
              {/* Timeline marker */}
              <div 
                className="position-absolute bg-danger rounded-circle" 
                style={{ 
                  width: '12px', 
                  height: '12px', 
                  left: '-31px', 
                  top: '8px', 
                  border: '2px solid var(--dark-bg)' 
                }}
              />
              
              {/* Release Date Header */}
              <h5 className="font-display fw-bold text-white mb-3 bg-black bg-opacity-25 p-2 rounded d-inline-block">
                {formatReleaseDate(dateStr)}
              </h5>

              {/* Movies released on this date */}
              <div className="row g-4">
                {groupedMovies[dateStr].map((movie) => {
                  const posterUrl = movie.poster_path
                    ? `${POSTER_BASE}${movie.poster_path}`
                    : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=185&h=278';

                  return (
                    <div key={movie.id} className="col-md-6">
                      <div className="glass-panel p-3 h-100 glass-panel-hover d-flex gap-3">
                        <img
                          src={posterUrl}
                          alt={movie.title}
                          className="rounded"
                          style={{ width: '80px', height: '120px', objectFit: 'cover' }}
                        />
                        <div className="d-flex flex-column justify-content-between flex-grow-1 text-truncate">
                          <div>
                            <h5 className="fw-bold mb-1 text-white text-truncate">{movie.title}</h5>
                            <p className="text-secondary small mb-2 text-wrap text-truncate-2" style={{ fontSize: '0.8rem' }}>
                              {movie.overview || 'No description available.'}
                            </p>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="small text-muted d-flex align-items-center gap-1">
                              <Clock size={12} />
                              Upcoming
                            </span>
                            <Link 
                              to={`/movie/${movie.id}`} 
                              className="btn btn-sm btn-glass py-1 px-3 d-flex align-items-center gap-1"
                              style={{ fontSize: '0.75rem' }}
                            >
                              Details <ChevronRight size={12} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
