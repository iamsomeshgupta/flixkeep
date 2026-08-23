import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'react-toastify';
import { 
  getWatchlistById, 
  removeMovieFromWatchlist, 
  reorderWatchlistMovies, 
  addCollaborator, 
  removeCollaborator, 
  duplicateWatchlist 
} from '../services/watchlist.service';
import { useAuth } from '../context/AuthContext';
import { 
  Globe, Lock, Users, Plus, Trash2, 
  Copy, GripVertical, ExternalLink, ArrowLeft, Download 
} from 'lucide-react';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w92';

export default function WatchlistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [collabUsername, setCollabUsername] = useState('');
  const [addingCollab, setAddingCollab] = useState(false);

  // 1. Fetch Watchlist details
  const { data: watchlist, isLoading, error } = useQuery({
    queryKey: ['watchlist', id],
    queryFn: () => getWatchlistById(id),
    retry: false,
  });

  const isOwner = watchlist && user && watchlist.owner._id.toString() === user.id.toString();
  const isCollaborator = watchlist && user && watchlist.collaborators.some(
    (c) => c._id.toString() === user.id.toString()
  );
  const canEdit = isOwner || isCollaborator;

  // 2. Mutations
  // Remove movie mutation
  const removeMovieMutation = useMutation({
    mutationFn: (tmdbId) => removeMovieFromWatchlist(id, tmdbId),
    onMutate: async (tmdbId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['watchlist', id] });
      const previousWatchlist = queryClient.getQueryData(['watchlist', id]);
      
      queryClient.setQueryData(['watchlist', id], (old) => {
        if (!old) return old;
        return {
          ...old,
          movies: old.movies.filter((m) => m.tmdbId !== tmdbId),
        };
      });
      return { previousWatchlist };
    },
    onError: (err, variables, context) => {
      if (context?.previousWatchlist) {
        queryClient.setQueryData(['watchlist', id], context.previousWatchlist);
      }
      toast.error('Failed to remove movie.');
    },
    onSuccess: () => {
      toast.success('Movie removed from watchlist.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', id] });
    },
  });

  // Reorder movies mutation
  const reorderMutation = useMutation({
    mutationFn: (tmdbIds) => reorderWatchlistMovies(id, tmdbIds),
    onMutate: async (tmdbIds) => {
      await queryClient.cancelQueries({ queryKey: ['watchlist', id] });
      const previousWatchlist = queryClient.getQueryData(['watchlist', id]);

      // Reorder cache optimistically
      queryClient.setQueryData(['watchlist', id], (old) => {
        if (!old) return old;
        const reorderedMovies = [...old.movies];
        reorderedMovies.sort((a, b) => {
          const aIndex = tmdbIds.indexOf(a.tmdbId);
          const bIndex = tmdbIds.indexOf(b.tmdbId);
          return aIndex - bIndex;
        });
        return {
          ...old,
          movies: reorderedMovies,
        };
      });
      return { previousWatchlist };
    },
    onError: (err, variables, context) => {
      if (context?.previousWatchlist) {
        queryClient.setQueryData(['watchlist', id], context.previousWatchlist);
      }
      toast.error('Failed to save reordered list.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', id] });
    },
  });

  // Add collaborator mutation
  const addCollabMutation = useMutation({
    mutationFn: (username) => addCollaborator(id, username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', id] });
      toast.success('Collaborator added successfully!');
      setCollabUsername('');
      setAddingCollab(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add collaborator.');
    },
  });

  // Remove collaborator mutation
  const removeCollabMutation = useMutation({
    mutationFn: (userId) => removeCollaborator(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', id] });
      toast.success('Collaborator removed.');
    },
    onError: (err) => {
      toast.error('Failed to remove collaborator.');
    },
  });

  // Duplicate watchlist mutation
  const duplicateMutation = useMutation({
    mutationFn: () => duplicateWatchlist(id),
    onSuccess: (data) => {
      toast.success('Watchlist duplicated successfully to your dashboard!');
      navigate(`/watchlist/${data._id}`);
    },
    onError: (err) => {
      toast.error('Failed to duplicate watchlist.');
    },
  });

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50 py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !watchlist) {
    return (
      <div className="container py-5 text-center text-secondary">
        <h3>Watchlist Not Found</h3>
        <p>This watchlist may be private, deleted, or incorrect.</p>
        <Link to="/watchlists" className="btn btn-netflix mt-3">Back to Watchlists</Link>
      </div>
    );
  }

  const handleDragEnd = (result) => {
    if (!result.destination || !canEdit) return;

    const items = Array.from(watchlist.movies);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const tmdbIds = items.map((m) => m.tmdbId);
    reorderMutation.mutate(tmdbIds);
  };

  const copyShareLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard!');
  };

  const exportToJson = () => {
    const cleanWatchlist = {
      name: watchlist.name,
      description: watchlist.description,
      movies: watchlist.movies.map((m) => ({
        title: m.title,
        tmdbId: m.tmdbId,
      })),
    };
    const dataStr = JSON.stringify(cleanWatchlist, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${watchlist.name.toLowerCase().replace(/\s+/g, '_')}_export.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('Watchlist JSON exported successfully!');
  };

  return (
    <div className="container py-5 px-4 text-start">
      
      {/* Back button */}
      <Link to="/watchlists" className="btn btn-glass btn-sm mb-4 d-inline-flex align-items-center gap-1">
        <ArrowLeft size={14} /> Back to Watchlists
      </Link>

      <div className="row g-5">
        {/* Left Column: Movies List */}
        <div className="col-lg-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="font-display fw-bold mb-0 border-start border-danger border-3 ps-3">
              Movies
            </h3>
            <span className="badge bg-secondary bg-opacity-25 text-secondary-emphasis px-3 py-1 fw-semibold">
              {watchlist.movies.length} items
            </span>
          </div>

          {watchlist.movies.length === 0 ? (
            <div className="glass-panel p-5 text-center text-secondary mb-4">
              <p>There are no movies in this watchlist yet.</p>
              <Link to="/search" className="btn btn-netflix btn-sm mt-2">
                Search & Add Movies
              </Link>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="watchlist-movies-droppable">
                {(provided) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef}
                    className="d-flex flex-column gap-3"
                  >
                    {watchlist.movies.map((movie, index) => {
                      const posterUrl = movie.posterPath
                        ? `${POSTER_BASE}${movie.posterPath}`
                        : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=92&h=138';

                      return (
                        <Draggable 
                          key={movie.tmdbId} 
                          draggableId={String(movie.tmdbId)} 
                          index={index}
                          isDragDisabled={!canEdit}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`glass-panel p-3 d-flex align-items-center justify-content-between ${
                                snapshot.isDragging ? 'border-danger border-opacity-50 shadow-lg' : ''
                              }`}
                            >
                              <div className="d-flex align-items-center gap-3 w-75">
                                {canEdit && (
                                  <div {...provided.dragHandleProps} className="text-secondary cursor-grab p-1">
                                    <GripVertical size={18} />
                                  </div>
                                )}
                                <Link to={`/movie/${movie.tmdbId}`} className="d-flex align-items-center gap-3 text-decoration-none text-light flex-grow-1 text-truncate">
                                  <img
                                    src={posterUrl}
                                    alt={movie.title}
                                    className="rounded"
                                    style={{ width: '40px', height: '60px', objectFit: 'cover' }}
                                  />
                                  <span className="fw-bold text-truncate" title={movie.title}>
                                    {movie.title}
                                  </span>
                                </Link>
                              </div>

                              <div className="d-flex gap-2">
                                <Link to={`/movie/${movie.tmdbId}`} className="btn btn-sm btn-glass p-2 d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px' }} title="View details">
                                  <ExternalLink size={14} />
                                </Link>
                                {canEdit && (
                                  <button
                                    onClick={() => removeMovieMutation.mutate(movie.tmdbId)}
                                    className="btn btn-sm btn-outline-danger p-2 d-flex align-items-center justify-content-center"
                                    style={{ width: '34px', height: '34px' }}
                                    title="Remove Movie"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

        {/* Right Column: Metadata & Collaborators */}
        <div className="col-lg-4">
          {/* Watchlist Info Card */}
          <div className="glass-panel p-4 mb-4">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <span className="small text-secondary">Visibility</span>
              <span className={`badge ${watchlist.isPublic ? 'bg-success' : 'bg-warning'} bg-opacity-10 text-${watchlist.isPublic ? 'success' : 'warning'} border border-${watchlist.isPublic ? 'success' : 'warning'} border-opacity-25 px-2 py-1 small fw-bold d-flex align-items-center gap-1`}>
                {watchlist.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                {watchlist.isPublic ? 'Public' : 'Private'}
              </span>
            </div>

            <h3 className="font-display fw-bold mb-1 text-white">{watchlist.name}</h3>
            <p className="small text-secondary mb-3">
              Created by <strong className="text-danger">{watchlist.owner.username}</strong>
            </p>
            <p className="text-secondary small mb-4" style={{ minHeight: '60px' }}>
              {watchlist.description || 'No description provided.'}
            </p>

            <div className="d-flex flex-column gap-2 mt-4">
              {/* Copy Share Link */}
              {watchlist.isPublic && (
                <button onClick={copyShareLink} className="btn btn-glass w-100 d-flex align-items-center justify-content-center gap-2">
                  <Copy size={14} />
                  Share Watchlist Link
                </button>
              )}
              {/* Duplicate Watchlist */}
              {user && (
                <button onClick={() => duplicateMutation.mutate()} className="btn btn-netflix w-100 d-flex align-items-center justify-content-center gap-2">
                  <Plus size={14} />
                  Duplicate Watchlist
                </button>
              )}
              {/* Export JSON */}
              <button onClick={exportToJson} className="btn btn-glass w-100 d-flex align-items-center justify-content-center gap-2">
                <Download size={14} />
                Export Watchlist JSON
              </button>
            </div>
          </div>

          {/* Collaborators Card */}
          <div className="glass-panel p-4">
            <h5 className="font-display fw-bold mb-3 d-flex align-items-center gap-2">
              <Users size={18} className="text-danger" />
              Collaborators
            </h5>
            
            {watchlist.collaborators.length === 0 ? (
              <p className="small text-muted italic mb-3">No collaborators added yet.</p>
            ) : (
              <div className="d-flex flex-column gap-2 mb-4">
                {watchlist.collaborators.map((collab) => (
                  <div key={collab._id} className="d-flex align-items-center justify-content-between p-2 rounded bg-black bg-opacity-25 border border-secondary-subtle border-opacity-10">
                    <div className="d-flex align-items-center gap-2 text-truncate">
                      <img
                        src={collab.avatarUrl}
                        alt={collab.username}
                        className="rounded-circle"
                        style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                      />
                      <span className="small text-white text-truncate">{collab.username}</span>
                    </div>
                    {isOwner && (
                      <button 
                        onClick={() => removeCollabMutation.mutate(collab._id)}
                        className="btn btn-link text-danger p-0 border-0 small text-decoration-none"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Invite Collaborator Form (Owners only) */}
            {isOwner && (
              <div>
                {!addingCollab ? (
                  <button onClick={() => setAddingCollab(true)} className="btn btn-outline-danger btn-sm w-100 py-2 d-flex align-items-center justify-content-center gap-2">
                    <Plus size={14} /> Add Collaborator
                  </button>
                ) : (
                  <div className="mt-2">
                    <input
                      type="text"
                      className="form-control form-dark-control form-control-sm mb-2"
                      placeholder="Collaborator username"
                      value={collabUsername}
                      onChange={(e) => setCollabUsername(e.target.value)}
                    />
                    <div className="d-flex gap-2">
                      <button onClick={() => setAddingCollab(false)} className="btn btn-glass btn-sm w-50">
                        Cancel
                      </button>
                      <button 
                        onClick={() => addCollabMutation.mutate(collabUsername)}
                        className="btn btn-netflix btn-sm w-50"
                        disabled={!collabUsername.trim()}
                      >
                        Invite
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
