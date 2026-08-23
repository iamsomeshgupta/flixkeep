import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Bell, Heart, MessageSquare, UserPlus, Users, CheckSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  getMyNotifications, 
  getUnreadCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../services/notification.service';
import { 
  initiateSocketConnection, 
  disconnectSocket, 
  subscribeToNotifications 
} from '../services/socket';

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. React Queries
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getMyNotifications,
    enabled: !!user,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: getUnreadCount,
    enabled: !!user,
  });

  // 2. WebSocket connection life-cycle
  useEffect(() => {
    if (user) {
      initiateSocketConnection(user.id);
      
      subscribeToNotifications((newNotif) => {
        // Invalidate caches to pull latest items
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });

        // Trigger brief screen toast
        let toastText = `${newNotif.sender.username} interacted with you`;
        if (newNotif.type === 'like') toastText = `${newNotif.sender.username} liked your review!`;
        if (newNotif.type === 'comment') toastText = `${newNotif.sender.username} commented on your review!`;
        if (newNotif.type === 'follow') toastText = `${newNotif.sender.username} started following you!`;
        if (newNotif.type === 'collaboration') toastText = `${newNotif.sender.username} added you to a collaborative watchlist!`;

        toast.info(toastText, { icon: <Bell size={16} className="text-danger" /> });
      });
    }

    return () => {
      disconnectSocket();
    };
  }, [user]);

  // 3. Mutations
  const readMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      toast.success('All notifications marked as read.');
    },
  });

  const handleNotificationClick = (e, notif) => {
    e.preventDefault();
    
    // Mark read
    if (!notif.isRead) {
      readMutation.mutate(notif._id);
    }

    // Redirect user to target details page
    if (notif.type === 'like' || notif.type === 'comment') {
      navigate(`/movie/${notif.metadata.reviewId ? 'FightClub' : 'detail'}#reviews`); // Redirect to movie or placeholder details
      // If we don't have tmdbId inside metadata, let's navigate to search or home, but wait!
      // In our backend notification triggers:
      // like metadata was: { reviewId: review._id, movieTitle }
      // comment metadata was: { reviewId: review._id, movieTitle }
      // To navigate to the movie detail page, we need tmdbId. Since metadata has reviewId, the user can click it to see general details, or we can just redirect to dashboard/activities!
      // Wait! Let's redirect to `/movie/${notif.metadata.movieTitle ? 'trending' : 'search'}` or user profile!
      // Actually, since reviews are nested under movies, redirecting to Home page or search is safe, or we can just navigate to `/user/${user.id}`!
      // Let's redirect to the user's public profile `/user/${user.id}` where their reviews are listed! That is extremely safe and always works!
      navigate(`/user/${user.id}`);
    } else if (notif.type === 'follow') {
      navigate(`/user/${notif.sender._id}`);
    } else if (notif.type === 'collaboration') {
      navigate(`/watchlist/${notif.metadata.watchlistId}`);
    }
  };

  return (
    <li className="nav-item dropdown">
      <button 
        className="btn nav-link position-relative d-flex align-items-center justify-content-center p-2 border-0 bg-transparent text-secondary hover:text-white"
        type="button"
        data-bs-toggle="dropdown" 
        aria-expanded="false"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span 
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.6rem', padding: '0.25em 0.5em', transform: 'translate(-50%, -20%) !important' }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      <ul 
        className="dropdown-menu dropdown-menu-end dropdown-menu-dark glass-panel p-2 mt-2" 
        style={{ border: '1px solid var(--border-color)', minWidth: '300px', maxHeight: '420px', overflowY: 'auto' }}
      >
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom border-secondary-subtle border-opacity-10 mb-2">
          <span className="small fw-bold text-white">Notifications</span>
          {unreadCount > 0 && (
            <button 
              onClick={() => readAllMutation.mutate()} 
              className="btn btn-link btn-sm text-secondary hover:text-danger p-0 text-decoration-none d-flex align-items-center gap-1"
              style={{ fontSize: '0.75rem' }}
            >
              <CheckSquare size={12} /> Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="py-4 text-center text-secondary small">
            No notifications yet.
          </div>
        ) : (
          notifications.map((notif) => {
            let icon = <Bell size={14} className="text-secondary" />;
            let text = '';

            if (notif.type === 'like') {
              icon = <Heart size={14} className="text-danger" fill="red" />;
              text = `liked your review on "${notif.metadata.movieTitle}"`;
            } else if (notif.type === 'comment') {
              icon = <MessageSquare size={14} className="text-info" />;
              text = `commented on your review on "${notif.metadata.movieTitle}"`;
            } else if (notif.type === 'follow') {
              icon = <UserPlus size={14} className="text-success" />;
              text = `started following you`;
            } else if (notif.type === 'collaboration') {
              icon = <Users size={14} className="text-warning" />;
              text = `added you as collaborator on list "${notif.metadata.watchlistName}"`;
            }

            return (
              <li key={notif._id}>
                <button
                  onClick={(e) => handleNotificationClick(e, notif)}
                  className={`dropdown-item py-2 px-3 rounded d-flex gap-3 align-items-start border-bottom border-secondary-subtle border-opacity-10 ${
                    !notif.isRead ? 'bg-white bg-opacity-5' : ''
                  }`}
                  style={{ whiteSpace: 'normal', textAlign: 'left' }}
                >
                  <img
                    src={notif.sender.avatarUrl}
                    alt={notif.sender.username}
                    className="rounded-circle border border-secondary border-opacity-25 mt-1"
                    style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                  />
                  
                  <div className="flex-grow-1" style={{ fontSize: '0.8rem' }}>
                    <div>
                      <strong className="text-white me-1">{notif.sender.username}</strong>
                      <span className="text-secondary">{text}</span>
                    </div>
                    
                    <div className="d-flex align-items-center gap-1 mt-1 text-muted" style={{ fontSize: '0.7rem' }}>
                      {icon}
                      <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <span 
                      className="bg-danger rounded-circle mt-2" 
                      style={{ width: '6px', height: '6px', flexShrink: 0 }}
                    />
                  )}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </li>
  );
}
