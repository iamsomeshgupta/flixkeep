const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');
const tokenRepository = require('../repositories/tokenRepository');
const { BadRequestError, UnauthorizedError } = require('../utils/errors');
const logger = require('../utils/logger');

// Helper to set cookie if requested, but we'll return tokens in body for client flexibility
const sendResponseWithTokens = (res, statusCode, data) => {
  res.status(statusCode).json({
    status: 'success',
    data,
  });
};

class AuthController {
  // Register
  async register(req, res, next) {
    try {
      const { username, email, password } = req.body;
      const user = await authService.register({ username, email, password });
      
      res.status(201).json({
        status: 'success',
        message: 'Registration successful! Please check your email to verify your account.',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  // Login
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const data = await authService.login(email, password);
      
      sendResponseWithTokens(res, 200, data);
    } catch (error) {
      next(error);
    }
  }

  // Google Login
  async googleLogin(req, res, next) {
    try {
      const { idToken } = req.body;
      const data = await authService.googleLogin(idToken);
      
      sendResponseWithTokens(res, 200, data);
    } catch (error) {
      next(error);
    }
  }

  // Refresh Token
  async refreshToken(req, res, next) {
    try {
      const token = req.body.refreshToken || req.headers['x-refresh-token'];
      if (!token) {
        throw new BadRequestError('Refresh token is required');
      }
      
      const data = await authService.refreshSession(token);
      sendResponseWithTokens(res, 200, data);
    } catch (error) {
      next(error);
    }
  }

  // Logout
  async logout(req, res, next) {
    try {
      const token = req.body.refreshToken || req.headers['x-refresh-token'];
      await authService.logout(token);
      
      res.status(200).json({
        status: 'success',
        message: 'Successfully logged out.',
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify Email
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      if (!token) {
        throw new BadRequestError('Verification token query parameter is missing');
      }

      await authService.verifyEmail(token);
      res.status(200).json({
        status: 'success',
        message: 'Email verified successfully! You can now log in.',
      });
    } catch (error) {
      next(error);
    }
  }

  // Forgot Password
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);
      
      res.status(200).json({
        status: 'success',
        message: 'If that email address exists, a password reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }

  // Reset Password
  async resetPassword(req, res, next) {
    try {
      const { token } = req.query;
      const { password } = req.body;

      if (!token) {
        throw new BadRequestError('Password reset token query parameter is missing');
      }

      await authService.resetPassword(token, password);
      res.status(200).json({
        status: 'success',
        message: 'Password reset successful! You can now log in with your new password.',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get Current User Profile
  async getMe(req, res, next) {
    try {
      // req.user is already populated by protect middleware
      res.status(200).json({
        status: 'success',
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Update User Profile
  async updateMe(req, res, next) {
    try {
      const allowedFields = [
        'username',
        'email',
        'bio',
        'favoriteGenres',
        'favoriteActors',
        'favoriteDirectors',
      ];
      
      const updateData = {};
      Object.keys(req.body).forEach((key) => {
        if (allowedFields.includes(key)) {
          updateData[key] = req.body[key];
        }
      });

      // Email and username change validations
      if (updateData.email && updateData.email !== req.user.email) {
        const emailExists = await userRepository.findByEmail(updateData.email);
        if (emailExists) throw new BadRequestError('This email is already in use');
      }

      if (updateData.username && updateData.username !== req.user.username) {
        const usernameExists = await userRepository.findByUsername(updateData.username);
        if (usernameExists) throw new BadRequestError('This username is already in use');
      }

      const updatedUser = await userRepository.update(req.user._id, updateData);

      res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully.',
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Change Password (Logged in)
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        throw new BadRequestError('Both current password and new password are required');
      }

      // Fetch user with password field
      const user = await userRepository.findById(req.user._id, '+password');
      
      const isMatch = await user.comparePassword(currentPassword, user.password);
      if (!isMatch) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      user.password = newPassword;
      await user.save();

      // Revoke all sessions since password changed
      await tokenRepository.deleteByUserId(user._id);

      res.status(200).json({
        status: 'success',
        message: 'Password changed successfully. Please log in again on all devices.',
      });
    } catch (error) {
      next(error);
    }
  }

  // Upload Avatar Profile Picture
  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        throw new BadRequestError('Please upload an image file');
      }

      const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

      // If user already has an avatar that is not the default, delete it from Cloudinary
      if (req.user.avatarPublicId) {
        await deleteFromCloudinary(req.user.avatarPublicId);
      }

      // Upload new image
      const result = await uploadToCloudinary(req.file.buffer);

      // Save user updates
      const updatedUser = await userRepository.update(req.user._id, {
        avatarUrl: result.secure_url,
        avatarPublicId: result.public_id,
      });

      res.status(200).json({
        status: 'success',
        message: 'Profile picture uploaded successfully.',
        data: {
          avatarUrl: updatedUser.avatarUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete Account
  async deleteAccount(req, res, next) {
    try {
      // Clear refresh tokens
      await tokenRepository.deleteByUserId(req.user._id);
      
      // Delete user
      await userRepository.delete(req.user._id);

      res.status(200).json({
        status: 'success',
        message: 'Your account has been deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
