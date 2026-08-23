import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register: registerAction, googleLogin } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  
  const passwordValue = watch('password');

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
          document.getElementById('google-signup-btn'),
          { theme: 'filled_black', size: 'large', width: '380', text: 'signup_with' }
        );
      }
    };
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) document.body.removeChild(existingScript);
    };
  }, []);

  const onSubmit = async (data) => {
    try {
      await registerAction(data.username, data.email, data.password);
    } catch (err) {
      // Handled by AuthContext toasts
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center min-vh-100">
      <div className="glass-panel p-5 w-100" style={{ maxWidth: '460px' }}>
        
        {/* Header */}
        <div className="text-center mb-4">
          <Film size={40} className="text-danger mb-2" />
          <h2 className="font-display fw-bold mb-1">Create Account</h2>
          <p className="text-secondary small">Join FlixKeep to track, share, and discover films</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mb-4">
          {/* Username */}
          <div className="mb-3">
            <label className="form-label text-secondary small fw-medium">Username</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 border-secondary-subtle">
                <User size={18} className="text-secondary" />
              </span>
              <input
                type="text"
                className={`form-control form-dark-control border-start-0 ${errors.username ? 'is-invalid' : ''}`}
                placeholder="cinemalover"
                {...register('username', { 
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Username must be at least 3 characters' },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: 'Only letters, numbers, and underscores are allowed',
                  }
                })}
              />
              {errors.username && (
                <div className="invalid-feedback">{errors.username.message}</div>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="form-label text-secondary small fw-medium">Email Address</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 border-secondary-subtle">
                <Mail size={18} className="text-secondary" />
              </span>
              <input
                type="email"
                className={`form-control form-dark-control border-start-0 ${errors.email ? 'is-invalid' : ''}`}
                placeholder="name@example.com"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address',
                  }
                })}
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email.message}</div>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="form-label text-secondary small fw-medium">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 border-secondary-subtle">
                <Lock size={18} className="text-secondary" />
              </span>
              <input
                type="password"
                className={`form-control form-dark-control border-start-0 ${errors.password ? 'is-invalid' : ''}`}
                placeholder="••••••••"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number',
                  }
                })}
              />
              {errors.password && (
                <div className="invalid-feedback">{errors.password.message}</div>
              )}
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label className="form-label text-secondary small fw-medium">Confirm Password</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 border-secondary-subtle">
                <Lock size={18} className="text-secondary" />
              </span>
              <input
                type="password"
                className={`form-control form-dark-control border-start-0 ${errors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="••••••••"
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: (value) => value === passwordValue || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && (
                <div className="invalid-feedback">{errors.confirmPassword.message}</div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-netflix w-100 py-2"
          >
            {isSubmitting ? (
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
            ) : null}
            Sign Up
          </button>
        </form>

        <hr className="border-secondary-subtle my-4" />

        {/* Google OAuth Button */}
        <div className="d-flex flex-column align-items-center mb-4">
          <div id="google-signup-btn" className="w-100"></div>
        </div>

        <div className="text-center">
          <p className="text-secondary small mb-0">
            Already have an account?{' '}
            <Link to="/login" className="text-danger fw-semibold text-decoration-none">
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
