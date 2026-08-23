import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Lock, Film } from 'lucide-react';
import api from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const passwordValue = watch('password');

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Reset token is missing. Please check your email link.');
      return;
    }

    try {
      const res = await api.post(`/auth/reset-password?token=${token}`, {
        password: data.password,
      });
      toast.success(res.data.message || 'Password reset successful! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed. Link may be expired.');
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center min-vh-100">
      <div className="glass-panel p-5 w-100" style={{ maxWidth: '450px' }}>
        <div className="text-center mb-4">
          <Film size={40} className="text-danger mb-2" />
          <h2 className="font-display fw-bold mb-1">New Password</h2>
          <p className="text-secondary small">Set your new password to regain access to FlixKeep</p>
        </div>

        {!token ? (
          <div className="text-center py-3">
            <p className="text-danger">Invalid reset link. Reset token is missing from the URL.</p>
            <Link to="/login" className="btn btn-glass w-100 mt-2">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Password */}
            <div className="mb-3">
              <label className="form-label text-secondary small fw-medium">New Password</label>
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
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
