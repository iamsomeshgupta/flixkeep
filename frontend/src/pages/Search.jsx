import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, X, Clock, TrendingUp, RotateCcw } from 'lucide-react';
import { searchMovies, getSuggestions } from '../services/movie.service';
import MovieCard from '../components/MovieCard';
import { CardSkeleton } from '../components/SkeletalLoader';
import { toast } from 'react-toastify';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w92';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [inputVal, setInputVal] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const suggestionsRef = useRef(null);

  const trendingSearches = ['Interstellar', 'Oppenheimer', 'Dune', 'Spider-Man', 'The Dark Knight', 'Batman'];

  // Load recent searches on boot
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(history);
  }, []);

  // Sync state if URL query changes
  useEffect(() => {
    if (initialQuery) {
      setInputVal(initialQuery);
      performSearch(initialQuery, 1);
    } else {
      setResults([]);
    }
  }, [searchParams]);

  // Close suggestions if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Auto-suggestions
  useEffect(() => {
    if (inputVal.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await getSuggestions(inputVal);
        setSuggestions(data);
      } catch (err) {
        console.error(err);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [inputVal]);

  const saveSearchToHistory = (query) => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;
    
    let history = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    history = history.filter((item) => item.toLowerCase() !== cleanQuery.toLowerCase());
    history.unshift(cleanQuery);
    history = history.slice(0, 5); // Keep top 5 latest searches
    
    localStorage.setItem('recentSearches', JSON.stringify(history));
    setRecentSearches(history);
  };

  const performSearch = async (query, searchPage = 1) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await searchMovies(query, searchPage);
      if (searchPage === 1) {
        setResults(data.results || []);
      } else {
        setResults((prev) => [...prev, ...(data.results || [])]);
      }
      setPage(data.page || 1);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      toast.error('Failed to retrieve search results.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;
    
    setSearchParams({ q: inputVal });
    saveSearchToHistory(inputVal);
    setShowSuggestions(false);
  };

  const selectSuggestion = (movie) => {
    setInputVal(movie.title);
    setSearchParams({ q: movie.title });
    saveSearchToHistory(movie.title);
    setShowSuggestions(false);
  };

  const selectTag = (query) => {
    setInputVal(query);
    setSearchParams({ q: query });
    saveSearchToHistory(query);
    setShowSuggestions(false);
  };

  const clearHistory = () => {
    localStorage.removeItem('recentSearches');
    setRecentSearches([]);
  };

  const loadMore = () => {
    if (page < totalPages) {
      performSearch(inputVal, page + 1);
    }
  };

  return (
    <div className="container py-5 px-4 text-start">
      <div className="row justify-content-center">
        <div className="col-lg-8 position-relative" ref={suggestionsRef}>
          
          {/* 1. Large Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mb-4">
            <div className="input-group input-group-lg position-relative shadow-lg rounded-3">
              <span className="input-group-text bg-transparent border-end-0 border-secondary-subtle">
                <SearchIcon size={24} className="text-secondary" />
              </span>
              <input
                type="text"
                className="form-control form-dark-control fs-5 border-start-0 py-3"
                placeholder="Search movies, watchlists..."
                value={inputVal}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  setShowSuggestions(true);
                }}
              />
              {inputVal && (
                <button
                  type="button"
                  className="btn bg-transparent border-0 border-secondary-subtle border-start-0 position-absolute end-0 top-0 bottom-0 py-0"
                  onClick={() => {
                    setInputVal('');
                    setSuggestions([]);
                  }}
                  style={{ zIndex: 10, marginRight: '1rem' }}
                >
                  <X size={20} className="text-secondary" />
                </button>
              )}
            </div>
          </form>

          {/* 2. Suggestions Dropdown (Glassmorphism overlay) */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="glass-panel position-absolute w-100 mt-1 shadow-lg py-2" style={{ zIndex: 100, border: '1px solid rgba(255,255,255,0.15)' }}>
              {suggestions.map((movie) => {
                const posterUrl = movie.posterPath
                  ? `${POSTER_BASE}${movie.posterPath}`
                  : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=92&h=138';
                
                return (
                  <div
                    key={movie.id}
                    className="d-flex align-items-center gap-3 px-3 py-2 cursor-pointer border-bottom border-secondary-subtle border-opacity-10 hover:bg-white hover:bg-opacity-5"
                    style={{ cursor: 'pointer' }}
                    onClick={() => selectSuggestion(movie)}
                  >
                    <img
                      src={posterUrl}
                      alt={movie.title}
                      className="rounded"
                      style={{ width: '40px', height: '60px', objectFit: 'cover' }}
                    />
                    <div>
                      <div className="fw-bold text-white small">{movie.title}</div>
                      <div className="small text-secondary">
                        {movie.releaseDate ? movie.releaseDate.split('-')[0] : 'N/A'} • {movie.voteAverage ? movie.voteAverage.toFixed(1) : '0.0'}★
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. History and Trending Chips */}
          <div className="mb-5 row g-4">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="col-md-6">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small text-secondary fw-semibold d-flex align-items-center gap-2">
                    <Clock size={14} />
                    RECENT SEARCHES
                  </span>
                  <button onClick={clearHistory} className="btn btn-link text-muted p-0 small text-decoration-none d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                    <RotateCcw size={12} /> Clear
                  </button>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {recentSearches.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => selectTag(term)}
                      className="btn btn-sm btn-glass text-secondary px-3 py-1"
                      style={{ fontSize: '0.85rem' }}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Tags */}
            <div className={recentSearches.length > 0 ? 'col-md-6' : 'col-12'}>
              <div className="small text-secondary fw-semibold d-flex align-items-center gap-2 mb-2">
                <TrendingUp size={14} />
                TRENDING SEARCHES
              </div>
              <div className="d-flex flex-wrap gap-2">
                {trendingSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => selectTag(term)}
                    className="btn btn-sm btn-glass text-secondary px-3 py-1"
                    style={{ fontSize: '0.85rem' }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Search Results Grid */}
      {initialQuery && (
        <div className="mt-4">
          <h4 className="font-display fw-bold mb-4 border-start border-danger border-3 ps-3">
            Search Results for "{initialQuery}"
          </h4>

          {results.length === 0 && !loading ? (
            <div className="glass-panel p-5 text-center text-secondary">
              No movies found matching your query. Please try searching something else.
            </div>
          ) : (
            <div className="row g-4 row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 justify-content-start">
              {results.map((movie) => (
                <div key={movie.id} className="col d-flex justify-content-center">
                  <MovieCard movie={movie} />
                </div>
              ))}
              
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="col d-flex justify-content-center">
                  <CardSkeleton />
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {page < totalPages && !loading && (
            <div className="text-center mt-5">
              <button onClick={loadMore} className="btn btn-glass px-5 py-2">
                Load More Results
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
