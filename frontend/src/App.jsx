import { useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { Film, Search as SearchIcon, List as ListIcon, Sparkles, User, Settings, Shield, LogOut, Calendar as CalendarIcon } from 'lucide-react';

import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Search from './pages/Search';
import MovieDetail from './pages/MovieDetail';
import WatchlistDashboard from './pages/WatchlistDashboard';
import WatchlistDetail from './pages/WatchlistDetail';
import UserProfile from './pages/UserProfile';
import Recommendations from './pages/Recommendations';
import Dashboard from './pages/Dashboard';
import MovieCalendar from './pages/MovieCalendar';
import NotificationBell from './components/NotificationBell';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function Home() {
  const { user } = useAuth();
  
  return (
    <div className="container py-5 text-center">
      <div className="glass-panel p-5 mx-auto my-5" style={{ maxWidth: '700px' }}>
        <Film size={64} className="text-danger mb-4" />
        <h1 className="display-4 mb-3 font-display fw-bold">Welcome to FlixKeep</h1>
        <p className="lead text-secondary mb-4">
          The premium cinematic watchlist and social hub for movie lovers.
        </p>
        
        {user ? (
          <div>
            <p className="mb-4">Logged in as <strong className="text-danger">{user.username}</strong></p>
            <div className="d-flex justify-content-center gap-3">
              <Link to="/watchlists" className="btn btn-netflix d-flex align-items-center gap-2">
                <ListIcon size={18} />
                My Watchlists
              </Link>
              <Link to="/dashboard" className="btn btn-glass d-flex align-items-center gap-2">
                <Shield size={18} />
                My Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="d-flex justify-content-center gap-3">
            <Link to="/register" className="btn btn-netflix">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-glass">
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        navigate('/search');
      }
      if (e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        navigate('/');
      }
      if (e.altKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        navigate('/watchlists');
      }
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        navigate('/dashboard');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="d-flex flex-column min-vh-100 bg-dark text-light">
      
      {/* Global Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-transparent border-bottom border-secondary-subtle py-3 px-4 glass-panel" style={{ borderRadius: 0, boxShadow: 'none' }}>
        <div className="container-fluid">
          <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
            <Film className="text-danger" />
            <span className="font-display fw-bold fs-4 tracking-tight" style={{ color: 'var(--text-primary)' }}>FlixKeep</span>
          </Link>
          
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto gap-3 align-items-center">
              <li className="nav-item">
                <Link className="nav-link text-secondary hover:text-white d-flex align-items-center gap-2" to="/search">
                  <SearchIcon size={16} />
                  <span>Search</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-secondary hover:text-white d-flex align-items-center gap-2" to="/calendar">
                  <CalendarIcon size={16} />
                  <span>Releases</span>
                </Link>
              </li>
              {user ? (
                <>
                  <li className="nav-item">
                    <Link className="nav-link text-secondary hover:text-white d-flex align-items-center gap-2" to="/recommendations">
                      <Sparkles size={16} className="text-danger" />
                      <span>For You</span>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link text-secondary hover:text-white d-flex align-items-center gap-2" to="/watchlists">
                      <ListIcon size={16} />
                      <span>Watchlists</span>
                    </Link>
                  </li>
                  
                  {/* Real-time Notification Bell */}
                  <NotificationBell />
                  
                  {/* User Dropdown */}
                  <li className="nav-item dropdown">
                    <button 
                      className="btn nav-link dropdown-toggle d-flex align-items-center gap-2 text-secondary hover:text-white border-0" 
                      type="button"
                      data-bs-toggle="dropdown" 
                      aria-expanded="false"
                      style={{ background: 'transparent' }}
                    >
                      <img
                        src={user.avatarUrl}
                        alt={user.username}
                        className="rounded-circle border border-danger border-1"
                        style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                      />
                      <span>{user.username}</span>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end dropdown-menu-dark glass-panel p-2 mt-2" style={{ border: '1px solid var(--border-color)', minWidth: '180px' }}>
                      <li>
                        <Link className="dropdown-item small text-white py-2 rounded d-flex align-items-center gap-2" to={`/user/${user.id}`}>
                          <User size={14} /> My Profile
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item small text-white py-2 rounded d-flex align-items-center gap-2" to="/dashboard">
                          <Shield size={14} /> My Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item small text-white py-2 rounded d-flex align-items-center gap-2" to="/profile">
                          <Settings size={14} /> Settings
                        </Link>
                      </li>
                      <li><hr className="dropdown-divider border-secondary border-opacity-10 my-2" /></li>
                      <li>
                        <button 
                          onClick={logout}
                          className="dropdown-item small text-danger py-2 rounded d-flex align-items-center gap-2"
                        >
                          <LogOut size={14} /> Logout
                        </button>
                      </li>
                    </ul>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link text-secondary hover:text-white" to="/login">Sign In</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="btn btn-netflix btn-sm px-3" to="/register">Register</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/search" element={<Search />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="/calendar" element={<MovieCalendar />} />
          
          {/* Protected Recommendations Route */}
          <Route 
            path="/recommendations" 
            element={
              <ProtectedRoute>
                <Recommendations />
              </ProtectedRoute>
            } 
          />

          {/* Protected Dashboard Route */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Protected Watchlist Routes */}
          <Route 
            path="/watchlists" 
            element={
              <ProtectedRoute>
                <WatchlistDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/watchlist/:id" 
            element={
              <ProtectedRoute>
                <WatchlistDetail />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Settings Profile Route */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center border-top border-secondary-subtle bg-black text-secondary">
        <p className="mb-0">&copy; {new Date().getFullYear()} FlixKeep. Engineered for movie enthusiasts.</p>
      </footer>

      {/* Toast Notifications */}
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}

export default App;
