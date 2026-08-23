// Load Environment Variables at the absolute entry
require('dotenv').config();

const logger = require('./utils/logger');

// Catch uncaught exceptions globally before any execution
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message, err.stack);
  process.exit(1);
});

const app = require('./app');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');

// Database Initializations
connectDB();
connectRedis();

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  logger.info(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Initialize Socket.io connection server
const socketService = require('./services/socketService');
socketService.initialize(server);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down gracefully...');
  logger.error(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});
