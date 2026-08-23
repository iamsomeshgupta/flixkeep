import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, Film, ArrowRight } from 'lucide-react';
import { getPersonalizedRecommendations } from '../services/movie.service';
import MovieCard from '../components/MovieCard';
import { CardSkeleton } from '../components/SkeletalLoader';

export default function Recommendations() {
  const { data: recommendations = [], isLoading, error } = useQuery({
    queryKey: ['personalized-recommendations'],
    queryFn: getPersonalizedRecommendations,
  });

  return (
    <div className="container py-5 px-4 text-start">
      
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="font-display fw-bold mb-1 d-flex align-items-center gap-2">
            <Sparkles className="text-danger" />
            Personalized For You
          </h2>
          <p className="text-secondary small mb-0">
            Cinematic suggestions based on your taste, watchlist activity, and friend ratings
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="row g-4 row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="col d-flex justify-content-center">
              <CardSkeleton />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-panel p-5 text-center text-secondary small">
          <h5>Could Not Load Recommendations</h5>
          <p>Rate movies and follow other members to build your custom cinematic feed.</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="glass-panel p-5 text-center text-secondary">
          <Film size={48} className="text-danger mb-3" />
          <h5>Your Recommendation Feed is Empty</h5>
          <p className="small mb-4">
            FlixKeep learns what you like when you rate movies and follow other film lovers!
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/search" className="btn btn-netflix">
              Search & Rate Movies
            </Link>
            <Link to="/" className="btn btn-glass">
              Browse Discover
            </Link>
          </div>
        </div>
      ) : (
        <div className="row g-4 row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 justify-content-start">
          {recommendations.map((item, index) => {
            // Re-map movie list items for Card rendering
            const movieItem = {
              id: item.movie.id,
              title: item.movie.title,
              poster_path: item.movie.poster_path,
              vote_average: item.movie.vote_average,
              release_date: item.movie.release_date,
            };

            return (
              <div key={index} className="col d-flex flex-column align-items-center mb-4">
                <MovieCard movie={movieItem} />
                
                {/* Visual Explanation Badge */}
                <div 
                  className="mt-2 text-center p-2 rounded bg-black bg-opacity-25 border border-secondary-subtle border-opacity-10 w-100"
                  style={{ minHeight: '52px', maxWidth: '180px' }}
                >
                  <span className="text-secondary" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
                    {item.reason}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
