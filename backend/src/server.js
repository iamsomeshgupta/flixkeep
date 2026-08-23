require('dotenv').config();

const logger = require('./utils/logger');

process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION! 💥 Shutting down...
Error Name: ${err.name}
Error Message: ${err.message}
Stack: ${err.stack}`);

  process.exit(1);
});

const app = require('./app');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');

connectDB();
connectRedis();

const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
  logger.info(
    `Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`
  );
});

const socketService = require('./services/socketService');
socketService.initialize(server);

process.on('unhandledRejection', (err) => {
  logger.error(`UNHANDLED REJECTION! 💥 Shutting down gracefully...
Error Name: ${err.name}
Error Message: ${err.message}
Stack: ${err.stack}`);

  server.close(() => {
    process.exit(1);
  });
});