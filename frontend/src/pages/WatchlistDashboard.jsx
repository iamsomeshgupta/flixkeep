import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Plus, ListCollapse, Users, Lock, Globe, Trash2, ExternalLink, X, FileSpreadsheet } from 'lucide-react';
import { getMyWatchlists, createWatchlist, deleteWatchlist } from '../services/watchlist.service';

export default function WatchlistDashboard() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [importedMovies, setImportedMovies] = useState([]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Fetch watchlists
  const { data: watchlists = [], isLoading } = useQuery({
    queryKey: ['watchlists'],
    queryFn: getMyWatchlists,
  });

  // Create Watchlist Mutation
  const createMutation = useMutation({
    mutationFn: createWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
      toast.success('Watchlist created successfully!');
      setShowCreateModal(false);
      setImportedMovies([]);
      reset();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create watchlist');
    },
  });

  // Delete Watchlist Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
      toast.success('Watchlist deleted successfully.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete watchlist');
    },
  });

  const onSubmit = (data) => {
    createMutation.mutate({
      ...data,
      movies: importedMovies,
    });
  };

  const handleDelete = (e, id, name) => {
    e.preventDefault();
    const confirm = window.confirm(`Are you sure you want to delete "${name}"?`);
    if (confirm) {
      deleteMutation.mutate(id);
    }
  };

  // IMDb CSV Parser
  const handleCsvImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split('\n');
        const moviesList = [];
        
        // Find title column index in header row
        const headers = lines[0].split(',');
        const titleIdx = headers.findIndex((h) => h.trim().toLowerCase() === 'title');

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const cols = lines[i].split(',');
          // If title header is not resolved, fallback to index 5 (standard IMDb lists title column)
          const title = cols[titleIdx !== -1 ? titleIdx : 5]?.replace(/"/g, '');
          if (title) {
            moviesList.push({
              tmdbId: Math.floor(Math.random() * 900000) + 100000, // random unique identifier
              title: title.trim(),
              posterPath: '',
              order: i - 1,
            });
          }
        }

        if (moviesList.length > 0) {
          setImportedMovies(moviesList);
          toast.success(`Parsed ${moviesList.length} movies from IMDb CSV!`);
        } else {
          toast.error('No movie titles found in the CSV.');
        }
      } catch (err) {
        toast.error('Failed to parse CSV file. Ensure it matches IMDb list export format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="container py-5 px-4 text-start">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="font-display fw-bold mb-1">My Watchlists</h2>
          <p className="text-secondary small mb-0">Create, customize, and collaborate on movie selections</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-netflix d-flex align-items-center gap-2">
          <Plus size={18} />
          Create Watchlist
        </button>
      </div>

      {isLoading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : watchlists.length === 0 ? (
        <div className="glass-panel p-5 text-center text-secondary">
          <ListCollapse size={48} className="text-danger mb-3" />
          <h5>No Watchlists Found</h5>
          <p className="small mb-4">Get started by creating your first custom movie list!</p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-netflix">
            Create Watchlist
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {watchlists.map((list) => (
            <div key={list._id} className="col-md-6 col-lg-4">
              <Link to={`/watchlist/${list._id}`} className="text-decoration-none text-light">
                <div className="glass-panel p-4 h-100 glass-panel-hover d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h4 className="font-display fw-bold mb-0 text-white text-truncate" style={{ maxWidth: '80%' }}>
                        {list.name}
                      </h4>
                      <span className="small text-secondary">
                        {list.isPublic ? (
                          <Globe size={16} className="text-success" title="Public" />
                        ) : (
                          <Lock size={16} className="text-warning" title="Private" />
                        )}
                      </span>
                    </div>

                    <p className="text-secondary small mb-3 text-truncate-2" style={{ minHeight: '40px', fontSize: '0.85rem' }}>
                      {list.description || 'No description added.'}
                    </p>
                  </div>

                  <div>
                    <hr className="border-secondary-subtle border-opacity-20 my-3" />
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex gap-3 small text-secondary">
                        <span><strong>{list.movies.length}</strong> Movies</span>
                        {list.collaborators.length > 0 && (
                          <span className="d-flex align-items-center gap-1">
                            <Users size={14} />
                            <strong>{list.collaborators.length}</strong>
                          </span>
                        )}
                      </div>
                      
                      <div className="d-flex gap-2">
                        <button
                          onClick={(e) => handleDelete(e, list._id, list.name)}
                          className="btn btn-sm btn-outline-danger p-1 d-flex align-items-center justify-content-center"
                          style={{ width: '28px', height: '28px', borderRadius: '4px' }}
                          title="Delete Watchlist"
                        >
                          <Trash2 size={14} />
                        </button>
                        <span className="btn btn-sm btn-glass p-1 d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', borderRadius: '4px' }}>
                          <ExternalLink size={14} />
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Create Watchlist Modal */}
      {showCreateModal && (
        <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center bg-black bg-opacity-75" style={{ zIndex: 1050 }}>
          <div className="glass-panel p-4 w-100 mx-3 shadow-lg" style={{ maxWidth: '450px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="font-display fw-bold mb-0">Create Watchlist</h4>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setImportedMovies([]);
                }} 
                className="btn btn-link text-white p-0"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Name */}
              <div className="mb-3">
                <label className="form-label text-secondary small fw-medium">Watchlist Name</label>
                <input
                  type="text"
                  className={`form-control form-dark-control ${errors.name ? 'is-invalid' : ''}`}
                  placeholder="e.g. Marvel Movies"
                  {...register('name', { required: 'Watchlist name is required', maxLength: 50 })}
                />
                {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
              </div>

              {/* Description */}
              <div className="mb-3">
                <label className="form-label text-secondary small fw-medium">Description (Optional)</label>
                <textarea
                  rows="2"
                  className={`form-control form-dark-control ${errors.description ? 'is-invalid' : ''}`}
                  placeholder="e.g. Collection of Marvel Cinematic Universe films"
                  {...register('description', { maxLength: 200 })}
                ></textarea>
                {errors.description && <div className="invalid-feedback">Cannot exceed 200 characters</div>}
              </div>

              {/* IMDb CSV Import */}
              <div className="mb-3">
                <label className="form-label text-secondary small fw-medium d-flex align-items-center gap-1">
                  <FileSpreadsheet size={14} className="text-success" />
                  Import IMDb CSV List (Optional)
                </label>
                <input
                  type="file"
                  accept=".csv"
                  className="form-control form-dark-control form-control-sm"
                  onChange={handleCsvImport}
                />
              </div>

              {/* Public toggle */}
              <div className="mb-4 d-flex justify-content-between align-items-center bg-black bg-opacity-25 p-3 rounded border border-secondary-subtle">
                <div>
                  <div className="small fw-semibold text-white">Public Visibility</div>
                  <div className="text-secondary" style={{ fontSize: '0.75rem' }}>Anyone can search and copy this watchlist</div>
                </div>
                <div className="form-check form-switch mb-0">
                  <input
                    type="checkbox"
                    className="form-check-input bg-danger border-danger cursor-pointer"
                    id="isPublic"
                    defaultChecked
                    {...register('isPublic')}
                  />
                </div>
              </div>

              <div className="d-flex gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setImportedMovies([]);
                  }} 
                  className="btn btn-glass w-50"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-netflix w-50">
                  Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
