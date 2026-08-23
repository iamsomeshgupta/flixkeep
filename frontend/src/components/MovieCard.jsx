import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Calendar } from 'lucide-react';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342'; // TMDB poster sizes: w92, w154, w185, w342, w500, w780, original

export default function MovieCard({ movie }) {
  const { id, title, poster_path, vote_average, release_date } = movie;

  const posterUrl = poster_path 
    ? `${POSTER_BASE}${poster_path}` 
    : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=300&h=450'; // Premium Unsplash fallback image

  const rating = vote_average ? vote_average.toFixed(1) : 'NR';
  const releaseYear = release_date ? release_date.split('-')[0] : 'N/A';

  return (
    <Link to={`/movie/${id}`} className="text-decoration-none">
      <div className="movie-card" style={{ width: '180px' }}>
        
        {/* Poster Image */}
        <img
          src={posterUrl}
          alt={title}
          loading="lazy"
          className="movie-card-img"
        />

        {/* Rating Badge (top-left absolute overlay) */}
        <div className="position-absolute top-2 start-2" style={{ zIndex: 3, top: '8px', left: '8px' }}>
          <span className="rating-badge">
            <Star size={12} fill="var(--accent-color)" stroke="none" />
            {rating}
          </span>
        </div>

        {/* Hover Overlay */}
        <div className="movie-card-overlay text-start">
          <h6 className="text-white fw-bold mb-1 text-truncate" title={title}>
            {title}
          </h6>
          <div className="d-flex align-items-center gap-1 small text-secondary">
            <Calendar size={12} />
            <span>{releaseYear}</span>
          </div>
        </div>

      </div>
    </Link>
  );
}
