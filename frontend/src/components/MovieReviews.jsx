import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Star, ThumbsUp, MessageSquare, AlertCircle } from 'lucide-react';
import { getMovieReviews, createReview, toggleLikeReview, addCommentToReview } from '../services/review.service';
import { useAuth } from '../context/AuthContext';

export default function MovieReviews({ tmdbId, movieTitle }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt'); // 'createdAt' or 'likes'
  const [rating, setRating] = useState(10);
  const [reviewText, setReviewText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState({});

  // Comment input state per review ID
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({});

  // 1. Fetch Movie Reviews
  const { data, isLoading } = useQuery({
    queryKey: ['reviews', tmdbId, page, sortBy],
    queryFn: () => getMovieReviews(tmdbId, page, sortBy),
  });

  const reviewsList = data?.reviews || [];
  const totalReviews = data?.total || 0;
  const totalPages = data?.pages || 1;

  // 2. Submit Review Mutation
  const reviewMutation = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', tmdbId] });
      toast.success('Your review was posted successfully!');
      setReviewText('');
      setIsSpoiler(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    },
  });

  // 3. Like Review Mutation
  const likeMutation = useMutation({
    mutationFn: toggleLikeReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', tmdbId] });
    },
    onError: () => {
      toast.error('Failed to like review.');
    },
  });

  // 4. Add Comment Mutation
  const commentMutation = useMutation({
    mutationFn: ({ reviewId, text }) => addCommentToReview(reviewId, text),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', tmdbId] });
      setCommentInputs((prev) => ({ ...prev, [variables.reviewId]: '' }));
      toast.success('Comment added.');
    },
    onError: (err) => {
      toast.error('Failed to add comment.');
    },
  });

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      return toast.warning('Please enter review text');
    }
    reviewMutation.mutate({
      tmdbId,
      rating,
      reviewText,
      isSpoiler,
      movieTitle,
    });
  };

  const handleCommentSubmit = (e, reviewId) => {
    e.preventDefault();
    const commentText = commentInputs[reviewId];
    if (!commentText || !commentText.trim()) return;

    commentMutation.mutate({ reviewId, text: commentText });
  };

  const toggleComments = (reviewId) => {
    setExpandedComments((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };

  const toggleSpoiler = (reviewId) => {
    setRevealedSpoilers((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };

  return (
    <div className="mt-5 text-start">
      <div className="d-flex justify-content-between align-items-center mb-4 border-start border-danger border-3 ps-3">
        <h3 className="font-display fw-bold mb-0">Reviews</h3>
        
        {/* Sort Controls */}
        <div className="d-flex gap-2">
          <button
            onClick={() => setSortBy('createdAt')}
            className={`btn btn-sm ${sortBy === 'createdAt' ? 'btn-netflix' : 'btn-glass'} px-3`}
          >
            Latest
          </button>
          <button
            onClick={() => setSortBy('likes')}
            className={`btn btn-sm ${sortBy === 'likes' ? 'btn-netflix' : 'btn-glass'} px-3`}
          >
            Popular
          </button>
        </div>
      </div>

      {/* 1. Review Form */}
      {user ? (
        <form onSubmit={handleReviewSubmit} className="glass-panel p-4 mb-5">
          <h5 className="font-display fw-bold mb-3 text-white">Write a Review</h5>
          
          <div className="row g-3 align-items-center mb-3">
            {/* Rating Selector */}
            <div className="col-auto">
              <label className="text-secondary small fw-medium me-2">Your Rating</label>
              <select
                className="form-select form-dark-control form-select-sm d-inline-block"
                style={{ width: '80px' }}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                {Array.from({ length: 10 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}★
                  </option>
                ))}
              </select>
            </div>

            {/* Spoiler checkbox */}
            <div className="col-auto ms-sm-auto">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input bg-danger border-danger cursor-pointer"
                  id="spoilerCheck"
                  checked={isSpoiler}
                  onChange={(e) => setIsSpoiler(e.target.checked)}
                />
                <label className="form-check-label text-secondary small cursor-pointer" htmlFor="spoilerCheck">
                  Contains spoilers
                </label>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <textarea
              className="form-control form-dark-control"
              rows="3"
              placeholder="Tell others what you thought of the movie..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              maxLength={1000}
            ></textarea>
          </div>

          <button type="submit" className="btn btn-netflix btn-sm px-4">
            Submit Review
          </button>
        </form>
      ) : (
        <div className="glass-panel p-4 mb-5 text-center text-secondary small">
          Please <Link to="/login" className="text-danger fw-bold">Sign In</Link> to share your rating and review.
        </div>
      )}

      {/* 2. Reviews List */}
      {isLoading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-danger spinner-border-sm" role="status"></div>
        </div>
      ) : reviewsList.length === 0 ? (
        <div className="glass-panel p-4 text-center text-secondary small">
          No reviews written for this movie yet. Be the first to review!
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {reviewsList.map((review) => {
            const hasLiked = user && review.likes.includes(user.id);
            const isRevealed = revealedSpoilers[review._id];

            return (
              <div key={review._id} className="glass-panel p-4">
                
                {/* Header (User avatar, name, rating) */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Link to={`/user/${review.user._id}`} className="d-flex align-items-center gap-2 text-decoration-none text-light">
                    <img
                      src={review.user.avatarUrl}
                      alt={review.user.username}
                      className="rounded-circle border border-secondary border-opacity-25"
                      style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                    />
                    <div>
                      <div className="fw-semibold small text-white">{review.user.username}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                  
                  <span className="rating-badge font-display fw-bold">
                    <Star size={12} fill="var(--accent-color)" stroke="none" />
                    {review.rating}/10
                  </span>
                </div>

                {/* Body (Spoiler filter) */}
                {review.isSpoiler && !isRevealed ? (
                  <div 
                    onClick={() => toggleSpoiler(review._id)}
                    className="bg-danger bg-opacity-10 border border-danger border-opacity-25 text-danger rounded p-3 text-center cursor-pointer my-3 small fw-medium d-flex align-items-center justify-content-center gap-2"
                  >
                    <AlertCircle size={16} />
                    <span>Spoiler review. Click to reveal.</span>
                  </div>
                ) : (
                  <p 
                    className="text-secondary small mb-3 text-start" 
                    style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}
                  >
                    {review.reviewText}
                  </p>
                )}

                {/* Footer Toolbar (Like button, Comment button) */}
                <div className="d-flex align-items-center gap-4 text-secondary small border-top border-secondary-subtle border-opacity-10 pt-3">
                  <button 
                    onClick={() => user ? likeMutation.mutate(review._id) : toast.error('Sign in to like reviews')}
                    className={`btn btn-link p-0 text-decoration-none d-flex align-items-center gap-1 ${
                      hasLiked ? 'text-danger' : 'text-secondary hover:text-white'
                    }`}
                  >
                    <ThumbsUp size={14} fill={hasLiked ? 'red' : 'none'} />
                    <span>{review.likesCount || review.likes.length}</span>
                  </button>

                  <button 
                    onClick={() => toggleComments(review._id)}
                    className="btn btn-link p-0 text-decoration-none text-secondary hover:text-white d-flex align-items-center gap-1"
                  >
                    <MessageSquare size={14} />
                    <span>{review.comments?.length || 0} Comments</span>
                  </button>
                </div>

                {/* Nested Comments Drawer */}
                {expandedComments[review._id] && (
                  <div className="mt-3 bg-black bg-opacity-25 p-3 rounded border border-secondary-subtle border-opacity-10">
                    
                    {/* Add comment form */}
                    {user ? (
                      <form onSubmit={(e) => handleCommentSubmit(e, review._id)} className="d-flex gap-2 mb-3">
                        <input
                          type="text"
                          className="form-control form-dark-control form-control-sm flex-grow-1"
                          placeholder="Write a comment..."
                          value={commentInputs[review._id] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCommentInputs((prev) => ({ ...prev, [review._id]: val }));
                          }}
                        />
                        <button type="submit" className="btn btn-netflix btn-sm px-3">Reply</button>
                      </form>
                    ) : (
                      <p className="text-secondary small italic mb-3">Sign in to leave a reply comment.</p>
                    )}

                    {/* Comments list */}
                    {(review.comments || []).length === 0 ? (
                      <div className="text-muted small italic">No comments yet.</div>
                    ) : (
                      <div className="d-flex flex-column gap-2 text-start">
                        {review.comments.map((comment) => (
                          <div key={comment._id} className="small border-bottom border-secondary-subtle border-opacity-10 pb-2">
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <img
                                src={comment.userId.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'}
                                alt={comment.userId.username}
                                className="rounded-circle"
                                style={{ width: '20px', height: '20px', objectFit: 'cover' }}
                              />
                              <span className="fw-semibold text-white">{comment.userId.username}</span>
                              <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-secondary ps-4">{comment.text}</div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center gap-3 mt-4">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)} 
            className="btn btn-glass btn-sm"
          >
            Prev
          </button>
          <span className="small text-secondary align-self-center">Page {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)} 
            className="btn btn-glass btn-sm"
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
}
