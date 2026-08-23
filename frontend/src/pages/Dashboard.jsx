import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { 
  getUserAnalytics, 
  getAdminAnalytics, 
  banUser, 
  deleteReportedReview 
} from '../services/dashboard.service';
import { useAuth } from '../context/AuthContext';
import { 
  BarElement, CategoryScale, Chart as ChartJS, 
  Legend, LinearScale, Title, Tooltip, ArcElement 
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { 
  Film, Star, Clock, AlertTriangle, Shield, 
  TrendingUp, Users, ListCollapse 
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [adminTab, setAdminTab] = useState(false);
  const [history] = useState(() => {
    try {
      const historyJson = localStorage.getItem('flixkeep-watch-history');
      return historyJson ? JSON.parse(historyJson) : [];
    } catch {
      return [];
    }
  });

  const isAdmin = user && user.role === 'admin';

  // 1. Fetch User Analytics
  const userQuery = useQuery({
    queryKey: ['user-analytics'],
    queryFn: getUserAnalytics,
  });

  // 2. Fetch Admin Analytics (only if Admin)
  const adminQuery = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: getAdminAnalytics,
    enabled: isAdmin && adminTab,
  });

  // 3. Mutations
  const banMutation = useMutation({
    mutationFn: banUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      toast.success('Member banned successfully.');
    },
    onError: () => {
      toast.error('Failed to ban member.');
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: deleteReportedReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      toast.success('Reported review removed.');
    },
    onError: () => {
      toast.error('Failed to remove review.');
    },
  });

  const isLoading = userQuery.isLoading || (adminTab && adminQuery.isLoading);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50 py-5">
        <div className="spinner-border text-danger" role="status"></div>
      </div>
    );
  }

  // User Stats details
  const userStats = userQuery.data || { totalRated: 0, averageRating: 0, watchHours: 0, genreDistribution: {} };
  const genres = Object.keys(userStats.genreDistribution);
  const genreCounts = Object.values(userStats.genreDistribution);

  // Genre Pie Chart Data
  const pieChartData = {
    labels: genres,
    datasets: [
      {
        label: 'Rated Movies Count',
        data: genreCounts,
        backgroundColor: [
          'rgba(229, 9, 20, 0.65)',
          'rgba(54, 162, 235, 0.65)',
          'rgba(255, 206, 86, 0.65)',
          'rgba(75, 192, 192, 0.65)',
          'rgba(153, 102, 255, 0.65)',
          'rgba(255, 159, 64, 0.65)',
        ],
        borderColor: ['#e50914', '#36a2eb', '#ffce56', '#4bc1c0', '#9966ff', '#ff9f40'],
        borderWidth: 1,
      },
    ],
  };

  // Admin stats
  const adminStats = adminQuery.data || { stats: { totalUsers: 0, totalReviews: 0, totalWatchlists: 0 }, growthTimeline: [], reportedReviews: [] };

  return (
    <div className="container py-5 px-4 text-start">
      
      {/* Tab select (only if Admin role) */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="font-display fw-bold mb-1">
            {adminTab ? 'Admin Analytics Control' : 'My Movie Analytics'}
          </h2>
          <p className="text-secondary small mb-0">
            {adminTab ? 'Monitor site-wide status and process moderation reports' : 'Detailed summary of your rating stats and genre breakdowns'}
          </p>
        </div>

        {isAdmin && (
          <div className="d-flex gap-2">
            <button
              onClick={() => setAdminTab(false)}
              className={`btn btn-sm ${!adminTab ? 'btn-netflix' : 'btn-glass'} px-3 py-2 d-flex align-items-center gap-1`}
            >
              <Film size={14} /> My Stats
            </button>
            <button
              onClick={() => setAdminTab(true)}
              className={`btn btn-sm ${adminTab ? 'btn-netflix' : 'btn-glass'} px-3 py-2 d-flex align-items-center gap-1`}
            >
              <Shield size={14} /> Admin panel
            </button>
          </div>
        )}
      </div>

      {!adminTab ? (
        /* ---------------- USER ANALYTICS TAB ---------------- */
        <div>
          {/* Card Stats Grid */}
          <div className="row g-4 mb-5">
            <div className="col-md-4">
              <div className="glass-panel p-4 d-flex align-items-center gap-3">
                <div className="bg-danger bg-opacity-10 text-danger p-3 rounded">
                  <Film size={28} />
                </div>
                <div>
                  <h4 className="fw-bold mb-0 text-white">{userStats.totalRated}</h4>
                  <span className="text-secondary small">Movies Rated</span>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="glass-panel p-4 d-flex align-items-center gap-3">
                <div className="bg-warning bg-opacity-10 text-warning p-3 rounded">
                  <Star size={28} fill="orange" stroke="none" />
                </div>
                <div>
                  <h4 className="fw-bold mb-0 text-white">{userStats.averageRating}★</h4>
                  <span className="text-secondary small">Average Score</span>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="glass-panel p-4 d-flex align-items-center gap-3">
                <div className="bg-success bg-opacity-10 text-success p-3 rounded">
                  <Clock size={28} />
                </div>
                <div>
                  <h4 className="fw-bold mb-0 text-white">{userStats.watchHours} hrs</h4>
                  <span className="text-secondary small">Estimated Screen Time</span>
                </div>
              </div>
            </div>
          </div>

          {/* Genre chart */}
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5 text-center">
              <div className="glass-panel p-4">
                <h5 className="font-display fw-bold mb-4 text-white">Genre Breakdown</h5>
                {genres.length === 0 ? (
                  <p className="text-secondary small py-5">Rate movies to generate genre statistics.</p>
                ) : (
                  <div style={{ maxHeight: '320px', display: 'flex', justifyContent: 'center' }}>
                    <Pie data={pieChartData} options={{ responsive: true, plugins: { legend: { labels: { color: 'white' } } } }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recently Viewed */}
          {history.length > 0 && (
            <div className="mt-5">
              <h4 className="font-display fw-bold mb-4 text-white">Recently Viewed</h4>
              <div className="row g-3">
                {history.map((m) => {
                  const posterUrl = m.poster_path
                    ? `https://image.tmdb.org/t/p/w185${m.poster_path}`
                    : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=185&h=278';
                  
                  return (
                    <div key={m.id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                      <Link to={`/movie/${m.id}`} className="text-decoration-none text-light">
                        <div className="glass-panel p-2 h-100 text-center glass-panel-hover">
                          <img
                            src={posterUrl}
                            alt={m.title}
                            className="img-fluid rounded mb-2"
                            style={{ maxHeight: '150px', objectFit: 'cover' }}
                          />
                          <div className="small fw-semibold text-truncate text-white px-1">{m.title}</div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ---------------- ADMIN CONTROL TAB ---------------- */
        <div>
          {/* Admin Stats cards */}
          <div className="row g-4 mb-5">
            <div className="col-md-4">
              <div className="glass-panel p-4 d-flex align-items-center gap-3">
                <div className="bg-danger bg-opacity-10 text-danger p-3 rounded">
                  <Users size={28} />
                </div>
                <div>
                  <h4 className="fw-bold mb-0 text-white">{adminStats.stats.totalUsers}</h4>
                  <span className="text-secondary small">Total Members</span>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="glass-panel p-4 d-flex align-items-center gap-3">
                <div className="bg-success bg-opacity-10 text-success p-3 rounded">
                  <Film size={28} />
                </div>
                <div>
                  <h4 className="fw-bold mb-0 text-white">{adminStats.stats.totalReviews}</h4>
                  <span className="text-secondary small">Overall Reviews</span>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="glass-panel p-4 d-flex align-items-center gap-3">
                <div className="bg-warning bg-opacity-10 text-warning p-3 rounded">
                  <ListCollapse size={28} />
                </div>
                <div>
                  <h4 className="fw-bold mb-0 text-white">{adminStats.stats.totalWatchlists}</h4>
                  <span className="text-secondary small">Public Watchlists</span>
                </div>
              </div>
            </div>
          </div>

          {/* Abuse Reports table */}
          <div className="glass-panel p-4 mb-5">
            <h4 className="font-display fw-bold mb-4 d-flex align-items-center gap-2 border-bottom border-secondary-subtle border-opacity-10 pb-2 text-white">
              <AlertTriangle className="text-danger" size={20} />
              Reported Reviews
            </h4>

            {adminStats.reportedReviews.length === 0 ? (
              <p className="text-secondary small py-4 text-center">No reported reviews pending moderation.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover border-secondary-subtle border-opacity-10 align-middle">
                  <thead>
                    <tr>
                      <th scope="col">Author</th>
                      <th scope="col">Review Content</th>
                      <th scope="col">Reports Count</th>
                      <th scope="col">Reasons</th>
                      <th scope="col" className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminStats.reportedReviews.map((rev) => (
                      <tr key={rev._id}>
                        <td className="small text-white">{rev.userId.username}</td>
                        <td className="small text-secondary text-truncate-2" style={{ maxWidth: '300px' }}>
                          {rev.reviewText}
                        </td>
                        <td className="small fw-bold text-danger">{rev.reports.length}</td>
                        <td className="small text-secondary">
                          {rev.reports.map((r, i) => (
                            <div key={i} className="text-muted" style={{ fontSize: '0.75rem' }}>
                              - {r.reason}
                            </div>
                          ))}
                        </td>
                        <td className="text-end">
                          <button
                            onClick={() => deleteReviewMutation.mutate(rev._id)}
                            className="btn btn-sm btn-outline-danger me-2"
                          >
                            Delete Review
                          </button>
                          <button
                            onClick={() => banMutation.mutate(rev.userId._id)}
                            className="btn btn-sm btn-danger"
                          >
                            Ban Author
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
