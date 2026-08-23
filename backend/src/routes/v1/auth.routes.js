const express = require('express');
const authController = require('../../controllers/authController');
const { protect } = require('../../middleware/authMiddleware');
const upload = require('../../middleware/uploadMiddleware');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateUpdateProfile,
} = require('../../middleware/validationMiddleware');

const router = express.Router();

// Public Routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/google-login', authController.googleLogin);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/verify-email', authController.verifyEmail);
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);

// Protected Routes (Access token required)
router.use(protect);

router.get('/me', authController.getMe);
router.put('/update-me', validateUpdateProfile, authController.updateMe);
router.post('/change-password', authController.changePassword);
router.delete('/delete-account', authController.deleteAccount);
router.post('/upload-avatar', upload.single('avatar'), authController.uploadAvatar);

module.exports = router;
