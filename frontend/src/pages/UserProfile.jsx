import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { User, Users, Globe, Plus, Film, Activity, ListCollapse } from 'lucide-react';
import { getUserProfile, getUserActivities, followUser, unfollowUser } from '../services/social.service';
import { getPublicWatchlistsOfUser } from '../services/watchlist.service';
import { useAuth } from '../context/AuthContext';

export default function UserProfile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('watchlists');

  const isSelf = currentUser && currentUser.id === userId;

  // 1. Queries
  const profileQuery = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => getUserProfile(userId),
    retry: false,
  });

  const watchlistsQuery = useQuery({
    queryKey: ['user-watchlists', userId],
    queryFn: () => getPublicWatchlistsOfUser(userId),
  });

  const activitiesQuery = useQuery({
    queryKey: ['user-activities', userId],
    queryFn: () => getUserActivities(userId),
  });

  // 2. Mutations
  const followMutation = useMutation({
    mutationFn: () => followUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
      toast.success(`You are now following ${profileQuery.data?.user.username}!`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to follow user.');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => unfollowUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
      toast.success(`You unfollowed ${profileQuery.data?.user.username}.`);
    },
    onError: (err) => {
      toast.error('Failed to unfollow user.');
    },
  });

  const isLoading = profileQuery.isLoading || watchlistsQuery.isLoading || activitiesQuery.isLoading;

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50 py-5">
        <div className="spinner-border text-danger" role="status"></div>
      </div>
    );
  }

  if (profileQuery.error || !profileQuery.data) {
    return (
      <div className="container py-5 text-center text-secondary">
        <h3>User Profile Not Found</h3>
        <p>The requested member profile could not be found or connection failed.</p>
        <Link to="/" className="btn btn-netflix mt-3">Back to Home</Link>
      </div>
    );
  }

  const { user, stats, isFollowing } = profileQuery.data;
  const watchlists = watchlistsQuery.data || [];
  const activities = activitiesQuery.data || [];

  const handleFollowToggle = () => {
    if (!currentUser) {
      return toast.warning('Please sign in to follow users');
    }
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return (
    <div className="container py-5 px-4 text-start">
      {/* 1. Glassmorphic User Profile Header Card */}
      <div className="glass-panel p-4 mb-5">
        <div className="row g-4 align-items-center">
          
          <div className="col-auto">
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="rounded-circle border border-danger border-3"
              style={{ width: '100px', height: '100px', objectFit: 'cover' }}
            />
          </div>

          <div className="col text-white">
            <div className="d-flex flex-wrap align-items-center gap-3">
              <h2 className="font-display fw-bold mb-0">{user.username}</h2>
              {currentUser && !isSelf && (
                <button
                  onClick={handleFollowToggle}
                  className={`btn btn-sm ${isFollowing ? 'btn-glass text-danger' : 'btn-netflix'} px-3 py-1`}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
            
            <p className="text-secondary small mt-1 mb-3">
              Joined FlixKeep on {new Date(user.createdAt).toLocaleDateString()}
            </p>

            <div className="d-flex gap-4 small text-secondary">
              <span className="d-flex align-items-center gap-1">
                <Users size={14} />
                <strong>{stats.followersCount}</strong> Followers
              </span>
              <span>
                <strong>{stats.followingCount}</strong> Following
              </span>
              <span>
                <strong>{watchlists.length}</strong> Watchlists
              </span>
            </div>
          </div>

        </div>

        {/* Bio Section */}
        {user.bio && (
          <div className="mt-4 border-top border-secondary-subtle border-opacity-10 pt-3 text-secondary small">
            <h6 className="text-white fw-semibold mb-1">About</h6>
            <p className="mb-0">{user.bio}</p>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs */}
      <div className="d-flex border-bottom border-secondary-subtle border-opacity-10 mb-4 gap-3">
        <button
          onClick={() => setActiveTab('watchlists')}
          className={`btn pb-2 px-1 rounded-0 border-0 ${
            activeTab === 'watchlists' ? 'border-bottom border-danger text-danger border-2 fw-semibold' : 'text-secondary'
          }`}
          style={{ background: 'transparent' }}
        >
          Public Watchlists ({watchlists.length})
        </button>
        
        <button
          onClick={() => setActiveTab('activity')}
          className={`btn pb-2 px-1 rounded-0 border-0 ${
            activeTab === 'activity' ? 'border-bottom border-danger text-danger border-2 fw-semibold' : 'text-secondary'
          }`}
          style={{ background: 'transparent' }}
        >
          Activity Log ({activities.length})
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'watchlists' ? (
        watchlists.length === 0 ? (
          <div className="glass-panel p-5 text-center text-secondary small">
            <ListCollapse size={40} className="text-danger mb-2" />
            <p className="mb-0">This user hasn't published any public watchlists yet.</p>
          </div>
        ) : (
          <div className="row g-4">
            {watchlists.map((list) => (
              <div key={list._id} className="col-md-6 col-lg-4">
                <Link to={`/watchlist/${list._id}`} className="text-decoration-none text-light">
                  <div className="glass-panel p-4 h-100 glass-panel-hover d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="font-display fw-bold mb-0 text-white text-truncate" style={{ maxWidth: '85%' }}>
                          {list.name}
                        </h5>
                        <Globe size={14} className="text-success" />
                      </div>
                      <p className="text-secondary small mb-3 text-truncate-2" style={{ fontSize: '0.85rem', minHeight: '38px' }}>
                        {list.description || 'No description added.'}
                      </p>
                    </div>
                    <div>
                      <hr className="border-secondary-subtle border-opacity-10 my-3" />
                      <div className="d-flex justify-content-between align-items-center text-secondary small">
                        <span><strong>{list.movies.length}</strong> Movies</span>
                        <span className="btn btn-sm btn-glass px-3 py-1">View List</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Activity Log */
        activities.length === 0 ? (
          <div className="glass-panel p-5 text-center text-secondary small">
            <Activity size={40} className="text-danger mb-2" />
            <p className="mb-0">No recent activities found for this user.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {activities.map((act) => {
              const { metadata, activityType, createdAt, _id } = act;
              
              let title = '';
              let desc = '';
              let link = null;

              if (activityType === 'rate_movie') {
                title = `Rated ${metadata.movieTitle}`;
                desc = `Gave it a score of ${metadata.rating}/10.`;
                link = `/movie/${metadata.tmdbId}`;
              } else if (activityType === 'create_watchlist') {
                title = `Created Watchlist "${metadata.watchlistName}"`;
                desc = `Started a new custom movie selection.`;
                link = `/watchlist/${metadata.watchlistId}`;
              } else if (activityType === 'follow_user') {
                title = `Followed ${metadata.targetUsername}`;
                desc = `Began tracking updates from this member.`;
                link = `/user/${metadata.targetUserId}`;
              } else if (activityType === 'add_movie') {
                title = `Added ${metadata.movieTitle} to a watchlist`;
                desc = `Saved to watch list selections.`;
                link = `/movie/${metadata.tmdbId}`;
              }

              return (
                <div key={_id} className="glass-panel p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-danger bg-opacity-10 text-danger p-2 rounded-circle" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {activityType === 'rate_movie' ? <Film size={18} /> : <Activity size={18} />}
                    </div>
                    <div>
                      <div className="fw-bold text-white small">{title}</div>
                      <div className="text-secondary" style={{ fontSize: '0.8rem' }}>{desc}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {new Date(createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {link && (
                    <Link to={link} className="btn btn-sm btn-glass">
                      View
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

    </div>
  );
}
