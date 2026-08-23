const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userRepository = require('../repositories/userRepository');
const tokenRepository = require('../repositories/tokenRepository');
const emailService = require('./emailService');
const { 
  BadRequestError, 
  UnauthorizedError, 
  ConflictError, 
  NotFoundError 
} = require('../utils/errors');
const logger = require('../utils/logger');

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

class AuthService {
  // Generate Access Token (JWT)
  generateAccessToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
    });
  }

  // Generate Refresh Token (JWT)
  generateRefreshToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });
  }

  // Parse refresh token duration into expiration Date
  getRefreshTokenExpiryDate() {
    const durationStr = process.env.JWT_REFRESH_EXPIRATION || '7d';
    const num = parseInt(durationStr);
    const unit = durationStr.slice(-1);
    
    let ms = 0;
    if (unit === 'd') ms = num * 24 * 60 * 60 * 1000;
    else if (unit === 'h') ms = num * 60 * 60 * 1000;
    else ms = 7 * 24 * 60 * 60 * 1000; // default 7 days
    
    return new Date(Date.now() + ms);
  }

  // Register User
  async register(userData) {
    const existingEmail = await userRepository.findByEmail(userData.email);
    if (existingEmail) {
      throw new ConflictError('A user with this email address already exists');
    }

    const existingUsername = await userRepository.findByUsername(userData.username);
    if (existingUsername) {
      throw new ConflictError('This username is already taken');
    }

    // Generate email verification details
    const verificationToken = generateVerificationToken();
    const hashedVerificationToken = hashToken(verificationToken);
    
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hours to verify

    const newUser = await userRepository.create({
      ...userData,
      verificationToken: hashedVerificationToken,
      verificationTokenExpires: tokenExpiry,
    });

    // Send email asynchronously so request doesn't wait
    emailService.sendVerificationEmail(newUser.email, newUser.username, verificationToken)
      .catch((err) => logger.error(`Verification email send failed: ${err.message}`));

    return {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      isVerified: newUser.isVerified,
    };
  }

  // Login User
  async login(identity, password) {
    // Identity can be email or username
    let user;
    if (identity.includes('@')) {
      user = await userRepository.findByEmail(identity, '+password');
    } else {
      user = await userRepository.findByUsername(identity, '+password');
    }

    if (!user || user.googleId) {
      throw new UnauthorizedError('Invalid login credentials');
    }

    const isMatch = await user.comparePassword(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid login credentials');
    }

    if (user.isBanned) {
      throw new UnauthorizedError('Your account has been suspended by an administrator');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user._id);
    const rawRefreshToken = this.generateRefreshToken(user._id);
    const hashedRefreshToken = hashToken(rawRefreshToken);

    // Save refresh token to db
    await tokenRepository.create({
      userId: user._id,
      token: hashedRefreshToken,
      expiresAt: this.getRefreshTokenExpiryDate(),
    });

    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      },
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  // Google OAuth Login
  async googleLogin(idToken) {
    if (!idToken) {
      throw new BadRequestError('Google ID Token is required');
    }

    const axios = require('axios');
    let googleUser;
    
    try {
      const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      googleUser = response.data;
    } catch (err) {
      logger.error(`Google token verification failed: ${err.message}`);
      throw new UnauthorizedError('Invalid Google token');
    }

    const { sub: googleId, email, name, picture } = googleUser;
    if (!email) {
      throw new BadRequestError('Google account does not provide an email address');
    }

    let user = await userRepository.findByEmail(email);
    
    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.isVerified) user.isVerified = true;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      let username = name ? name.toLowerCase().replace(/[^a-z0-9_]/g, '') : email.split('@')[0];
      username = username.slice(0, 20);
      
      const usernameExists = await userRepository.findByUsername(username);
      if (usernameExists) {
        username = `${username}_${crypto.randomBytes(3).toString('hex')}`;
      }

      user = await userRepository.create({
        username,
        email,
        googleId,
        isVerified: true,
        avatarUrl: picture || undefined,
      });
    }

    if (user.isBanned) {
      throw new UnauthorizedError('Your account has been suspended by an administrator');
    }

    const accessToken = this.generateAccessToken(user._id);
    const rawRefreshToken = this.generateRefreshToken(user._id);
    const hashedRefreshToken = hashToken(rawRefreshToken);

    await tokenRepository.create({
      userId: user._id,
      token: hashedRefreshToken,
      expiresAt: this.getRefreshTokenExpiryDate(),
    });

    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      },
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  // Refresh Tokens
  async refreshSession(refreshToken) {
    if (!refreshToken) {
      throw new UnauthorizedError('Session refresh failed: No token provided');
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired refresh session. Please login again');
    }

    const hashedToken = hashToken(refreshToken);
    const storedToken = await tokenRepository.findByToken(hashedToken);
    
    if (!storedToken) {
      throw new UnauthorizedError('Session invalid or revoked. Please login again');
    }

    const user = await userRepository.findById(decoded.id);
    if (!user || user.isBanned) {
      throw new UnauthorizedError('User session is invalid');
    }

    // Revoke current token (Token rotation for security)
    await tokenRepository.deleteByToken(hashedToken);

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(user._id);
    const newRawRefreshToken = this.generateRefreshToken(user._id);
    const newHashedRefreshToken = hashToken(newRawRefreshToken);

    // Save new refresh token
    await tokenRepository.create({
      userId: user._id,
      token: newHashedRefreshToken,
      expiresAt: this.getRefreshTokenExpiryDate(),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      }
    };
  }

  // Logout User
  async logout(refreshToken) {
    if (refreshToken) {
      const hashedToken = hashToken(refreshToken);
      await tokenRepository.deleteByToken(hashedToken);
    }
  }

  // Verify Email
  async verifyEmail(token) {
    const hashed = hashToken(token);
    
    const user = await userRepository.findOne({
      verificationToken: hashed,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestError('Verification link is invalid or has expired');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return true;
  }

  // Forgot Password
  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return true;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = hashToken(resetToken);
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordTokenExpires = expires;
    await user.save({ validateBeforeSave: false });

    emailService.sendPasswordResetEmail(user.email, user.username, resetToken)
      .catch((err) => logger.error(`Reset email send failed: ${err.message}`));

    return true;
  }

  // Reset Password
  async resetPassword(token, newPassword) {
    const hashed = hashToken(token);
    
    const user = await userRepository.findOne({
      resetPasswordToken: hashed,
      resetPasswordTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestError('Password reset link is invalid or has expired');
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpires = undefined;
    await user.save();

    // Revoke all existing sessions since password changed
    await tokenRepository.deleteByUserId(user._id);

    return true;
  }
}

module.exports = new AuthService();
