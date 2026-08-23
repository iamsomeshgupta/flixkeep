const express = require('express');
const authRoutes = require('./auth.routes');
const movieRoutes = require('./movie.routes');
const watchlistRoutes = require('./watchlist.routes');
const reviewRoutes = require('./review.routes');
const socialRoutes = require('./social.routes');
const dashboardRoutes = require('./dashboard.routes');
const notificationRoutes = require('./notification.routes');

const router = express.Router();

// Mount Sub-routers
router.use('/auth', authRoutes);
router.use('/movies', movieRoutes);
router.use('/watchlists', watchlistRoutes);
router.use('/reviews', reviewRoutes);
router.use('/social', socialRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
