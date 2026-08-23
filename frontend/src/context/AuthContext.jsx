import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { setAccessTokenInMemory } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Listen for the custom session expired event from our Axios interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setAccessTokenInMemory(null);
      toast.error('Session expired. Please log in again.');
      navigate('/login');
    };

    window.addEventListener('auth-session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth-session-expired', handleSessionExpired);
    };
  }, [navigate]);

  // Check persistent session on boot
  useEffect(() => {
    const initializeAuth = async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        setLoading(false);
        return;
      }

      try {
        // Silent token refresh
        const res = await api.post('/auth/refresh-token', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken, user: userData } = res.data.data;
        
        setAccessTokenInMemory(accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        setUser(userData);
      } catch (err) {
        console.error('Silent refresh failed:', err.message);
        localStorage.removeItem('refreshToken');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Register
  const register = async (username, email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { username, email, password });
      toast.success(res.data.message || 'Registration successful! Check your email to verify.');
      navigate('/login');
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user: userData } = res.data.data;

      setAccessTokenInMemory(accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(userData);
      
      toast.success(`Welcome back, ${userData.username}!`);
      navigate('/');
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed. Check your credentials.';
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Google Login
  const googleLogin = async (idToken) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/google-login', { idToken });
      const { accessToken, refreshToken, user: userData } = res.data.data;

      setAccessTokenInMemory(accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(userData);
      
      toast.success(`Signed in as ${userData.username}`);
      navigate('/');
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Google sign-in failed.';
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      console.error('Logout error:', err.message);
    } finally {
      setUser(null);
      setAccessTokenInMemory(null);
      localStorage.removeItem('refreshToken');
      toast.success('Successfully logged out.');
      navigate('/login');
    }
  };

  // Update Profile
  const updateProfile = async (updateData) => {
    try {
      const res = await api.put('/auth/update-me', updateData);
      setUser(res.data.data.user);
      toast.success('Profile updated successfully.');
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Profile update failed.';
      toast.error(errorMsg);
      throw err;
    }
  };

  // Upload Avatar Picture
  const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.post('/auth/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setUser((prev) => prev ? { ...prev, avatarUrl: res.data.data.avatarUrl } : null);
      toast.success('Avatar uploaded successfully.');
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Avatar upload failed.';
      toast.error(errorMsg);
      throw err;
    }
  };

  // Change Password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success(res.data.message || 'Password changed successfully. Please log in again.');
      
      // Clear session after password change
      setUser(null);
      setAccessTokenInMemory(null);
      localStorage.removeItem('refreshToken');
      navigate('/login');
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Password change failed.';
      toast.error(errorMsg);
      throw err;
    }
  };

  // Delete Account
  const deleteAccount = async () => {
    try {
      await api.delete('/auth/delete-account');
      setUser(null);
      setAccessTokenInMemory(null);
      localStorage.removeItem('refreshToken');
      toast.success('Your account has been deleted.');
      navigate('/register');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete account.';
      toast.error(errorMsg);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    googleLogin,
    logout,
    updateProfile,
    uploadAvatar,
    changePassword,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
