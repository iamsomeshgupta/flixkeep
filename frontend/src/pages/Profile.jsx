import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { User, Mail, ShieldAlert, Camera, Save, Key, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Profile() {
  const { user, updateProfile, uploadAvatar, changePassword, deleteAccount } = useAuth();
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef(null);

  const { register: regProfile, handleSubmit: handleProfileSubmit, formState: { errors: errorsProfile, isSubmitting: isSubmittingProfile } } = useForm({
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || '',
    }
  });

  const { register: regPassword, handleSubmit: handlePasswordSubmit, reset: resetPasswordForm, watch: watchPassword, formState: { errors: errorsPassword, isSubmitting: isSubmittingPassword } } = useForm();

  const onUpdateProfile = async (data) => {
    try {
      await updateProfile(data);
    } catch (err) {}
  };

  const onChangePassword = async (data) => {
    try {
      await changePassword(data.currentPassword, data.newPassword);
      resetPasswordForm();
    } catch (err) {}
  };

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setAvatarLoading(true);
    try {
      await uploadAvatar(file);
    } catch (err) {
    } finally {
      setAvatarLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const onDeleteAccount = () => {
    const confirmDelete = window.confirm(
      'WARNING: Are you absolutely sure you want to delete your FlixKeep account? This action is permanent and cannot be undone.'
    );
    if (confirmDelete) {
      deleteAccount();
    }
  };

  return (
    <div className="container py-5">
      <div className="row g-4">
        
        {/* Left Column: Avatar Card & Settings */}
        <div className="col-lg-4">
          <div className="glass-panel p-4 text-center mb-4">
            
            {/* Avatar Section */}
            <div className="position-relative d-inline-block mx-auto mb-3">
              <img
                src={user?.avatarUrl}
                alt={user?.username}
                className="rounded-circle border border-danger border-3 shadow-lg"
                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
              />
              <button
                type="button"
                className="btn btn-netflix rounded-circle p-2 position-absolute bottom-0 end-0"
                onClick={triggerFileInput}
                disabled={avatarLoading}
                style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Change Profile Picture"
              >
                {avatarLoading ? (
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  <Camera size={18} />
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                accept="image/*"
                className="d-none"
              />
            </div>

            <h3 className="font-display fw-bold mb-1">{user?.username}</h3>
            <p className="text-secondary small mb-3">{user?.email}</p>
            
            {user?.bio ? (
              <p className="small text-secondary-emphasis bg-black bg-opacity-25 p-3 rounded border border-secondary-subtle text-start italic">
                "{user.bio}"
              </p>
            ) : (
              <p className="small text-muted italic mb-3">No bio added yet.</p>
            )}

            <div className="text-start mt-3">
              <div className="small text-secondary mb-1">Account Role</div>
              <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1 uppercase small fw-bold">
                {user?.role}
              </span>
              <div className="small text-secondary mt-2 mb-1">Status</div>
              <span className={`badge ${user?.isVerified ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-warning bg-opacity-10 text-warning border border-warning'} border-opacity-25 px-2 py-1 small fw-bold`}>
                {user?.isVerified ? 'Verified' : 'Pending Verification'}
              </span>
            </div>

          </div>

          {/* Danger Zone */}
          <div className="glass-panel p-4 border-danger border-opacity-25">
            <h5 className="font-display fw-bold text-danger d-flex align-items-center gap-2 mb-3">
              <ShieldAlert size={20} />
              Danger Zone
            </h5>
            <p className="small text-secondary mb-3">
              Deleting your account is permanent. All your custom watchlists, ratings, reviews, and activity feed data will be wiped out.
            </p>
            <button
              onClick={onDeleteAccount}
              className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
            >
              <Trash2 size={16} />
              Delete Account
            </button>
          </div>
        </div>

        {/* Right Column: Edit Forms */}
        <div className="col-lg-8">
          
          {/* Edit Profile Info */}
          <div className="glass-panel p-4 mb-4">
            <h4 className="font-display fw-bold mb-4 d-flex align-items-center gap-2">
              <User className="text-danger" size={22} />
              Profile Details
            </h4>
            
            <form onSubmit={handleProfileSubmit(onUpdateProfile)}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label text-secondary small fw-medium">Username</label>
                  <input
                    type="text"
                    className={`form-control form-dark-control ${errorsProfile.username ? 'is-invalid' : ''}`}
                    {...regProfile('username', { 
                      required: 'Username is required',
                      minLength: { value: 3, message: 'Username must be at least 3 characters' }
                    })}
                  />
                  {errorsProfile.username && (
                    <div className="invalid-feedback">{errorsProfile.username.message}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label text-secondary small fw-medium">Email Address</label>
                  <input
                    type="email"
                    className={`form-control form-dark-control ${errorsProfile.email ? 'is-invalid' : ''}`}
                    {...regProfile('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Invalid email address',
                      }
                    })}
                  />
                  {errorsProfile.email && (
                    <div className="invalid-feedback">{errorsProfile.email.message}</div>
                  )}
                </div>

                <div className="col-12">
                  <label className="form-label text-secondary small fw-medium">Bio</label>
                  <textarea
                    rows="3"
                    className={`form-control form-dark-control ${errorsProfile.bio ? 'is-invalid' : ''}`}
                    placeholder="Tell us about your movie tastes..."
                    {...regProfile('bio', {
                      maxLength: { value: 160, message: 'Bio cannot exceed 160 characters' }
                    })}
                  ></textarea>
                  {errorsProfile.bio && (
                    <div className="invalid-feedback">{errorsProfile.bio.message}</div>
                  )}
                  <div className="form-text text-muted text-end small">Max 160 characters</div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingProfile}
                className="btn btn-netflix mt-4 d-flex align-items-center gap-2"
              >
                <Save size={18} />
                Save Updates
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="glass-panel p-4">
            <h4 className="font-display fw-bold mb-4 d-flex align-items-center gap-2">
              <Key className="text-danger" size={22} />
              Security Settings
            </h4>

            <form onSubmit={handlePasswordSubmit(onChangePassword)}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label text-secondary small fw-medium">Current Password</label>
                  <input
                    type="password"
                    className={`form-control form-dark-control ${errorsPassword.currentPassword ? 'is-invalid' : ''}`}
                    placeholder="••••••••"
                    {...regPassword('currentPassword', { required: 'Current password is required' })}
                  />
                  {errorsPassword.currentPassword && (
                    <div className="invalid-feedback">{errorsPassword.currentPassword.message}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label text-secondary small fw-medium">New Password</label>
                  <input
                    type="password"
                    className={`form-control form-dark-control ${errorsPassword.newPassword ? 'is-invalid' : ''}`}
                    placeholder="••••••••"
                    {...regPassword('newPassword', { 
                      required: 'New password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Must contain 1 uppercase, 1 lowercase, and 1 number',
                      }
                    })}
                  />
                  {errorsPassword.newPassword && (
                    <div className="invalid-feedback">{errorsPassword.newPassword.message}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label text-secondary small fw-medium">Confirm New Password</label>
                  <input
                    type="password"
                    className={`form-control form-dark-control ${errorsPassword.confirmNewPassword ? 'is-invalid' : ''}`}
                    placeholder="••••••••"
                    {...regPassword('confirmNewPassword', { 
                      required: 'Please confirm new password',
                      validate: (value) => value === watchPassword('newPassword') || 'Passwords do not match',
                    })}
                  />
                  {errorsPassword.confirmNewPassword && (
                    <div className="invalid-feedback">{errorsPassword.confirmNewPassword.message}</div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingPassword}
                className="btn btn-netflix mt-4 d-flex align-items-center gap-2"
              >
                <Key size={18} />
                Update Password
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}

