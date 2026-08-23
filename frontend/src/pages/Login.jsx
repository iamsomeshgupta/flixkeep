import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { register: regForgot, handleSubmit: handleForgotSubmit, formState: { errors: errorsForgot } } = useForm();

  // Show session expired notification if redirected
  useEffect(() => {
    if (searchParams.get('expired')) {
      toast.warn('Your session has expired. Please sign in again.');
    }
  }, [searchParams]);

  // Google OAuth callback
  const handleGoogleResponse = async (response) => {
    try {
      await googleLogin(response.credential);
    } catch (err) {
      console.error('Google Auth Error:', err);
    }
  };

  // Dynamically load Google Sign-in script
  useEffect(() => {
    const googleId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy_client_id.apps.googleusercontent.com';
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: googleId,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { theme: 'filled_black', size: 'large', width: '380', text: 'signin_with' }
        );
      }
    };
    document.body.appendChild(script);

    return () => {
      // Clean script on unmount
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) document.body.removeChild(existingScript);
    };
  }, []);

  const onSubmit = async (data) => {
    try {
      await login(data.identity, data.password);
    } catch (err) {
      // Handled by AuthContext toasts
    }
  };

  const onForgotPassword = async (data) => {
    setSendingReset(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: data.forgotEmail });
      toast.success(res.data.message || 'Password reset link sent to your email.');
      setIsForgotMode(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request reset. Verify your email.');
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center min-vh-100">
      <div className="glass-panel p-5 w-100" style={{ maxWidth: '450px' }}>
        
        {/* Brand Header */}
        <div className="text-center mb-4">
          <Film size={40} className="text-danger mb-2" />
          <h2 className="font-display fw-bold mb-1">
            {isForgotMode ? 'Reset Password' : 'Sign In'}
          </h2>
          <p className="text-secondary small">
            {isForgotMode 
              ? 'Enter email to receive reset instructions' 
              : 'Welcome back to FlixKeep'}
          </p>
        </div>

        {!isForgotMode ? (
          /* Standard Login Form */
          <form onSubmit={handleSubmit(onSubmit)} className="mb-4">
            <div className="mb-3">
              <label className="form-label text-secondary small fw-medium">Email or Username</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0 border-secondary-subtle">
                  <Mail size={18} className="text-secondary" />
                </span>
                <input
                  type="text"
                  className={`form-control form-dark-control border-start-0 ${errors.identity ? 'is-invalid' : ''}`}
                  placeholder="name@example.com or username"
                  {...register('identity', { required: 'Username or Email is required' })}
                />
                {errors.identity && (
                  <div className="invalid-feedback">{errors.identity.message}</div>
                )}
              </div>
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label text-secondary small fw-medium mb-0">Password</label>
                <button
                  type="button"
                  className="btn btn-link text-danger p-0 small text-decoration-none"
                  onClick={() => setIsForgotMode(true)}
                  style={{ fontSize: '0.8rem' }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0 border-secondary-subtle">
                  <Lock size={18} className="text-secondary" />
                </span>
                <input
                  type="password"
                  className={`form-control form-dark-control border-start-0 ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required' })}
                />
                {errors.password && (
                  <div className="invalid-feedback">{errors.password.message}</div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-netflix w-100 py-2 mt-2"
            >
              {isSubmitting ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : null}
              Sign In
            </button>
          </form>
        ) : (
          /* Forgot Password Request Form */
          <form onSubmit={handleForgotSubmit(onForgotPassword)} className="mb-4">
            <div className="mb-3">
              <label className="form-label text-secondary small fw-medium">Email Address</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0 border-secondary-subtle">
                  <Mail size={18} className="text-secondary" />
                </span>
                <input
                  type="email"
                  className={`form-control form-dark-control border-start-0 ${errorsForgot.forgotEmail ? 'is-invalid' : ''}`}
                  placeholder="name@example.com"
                  {...regForgot('forgotEmail', { 
                    required: 'Email address is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address',
                    }
                  })}
                />
                {errorsForgot.forgotEmail && (
                  <div className="invalid-feedback">{errorsForgot.forgotEmail.message}</div>
                )}
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-glass w-50"
                onClick={() => setIsForgotMode(false)}
                disabled={sendingReset}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-netflix w-50"
                disabled={sendingReset}
              >
                {sendingReset ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                ) : null}
                Send Link
              </button>
            </div>
          </form>
        )}

        <hr className="border-secondary-subtle my-4" />

        {/* Google OAuth Block */}
        {!isForgotMode && (
          <div className="d-flex flex-column align-items-center mb-4">
            <div id="google-signin-btn" className="w-100"></div>
          </div>
        )}

        <div className="text-center">
          <p className="text-secondary small mb-0">
            Don't have an account?{' '}
            <Link to="/register" className="text-danger fw-semibold text-decoration-none">
              Sign Up Now
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
