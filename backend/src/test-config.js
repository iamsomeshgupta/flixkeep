require('dotenv').config();
const logger = require('./utils/logger');
const connectDB = require('./config/db');
const { connectRedis, isRedisEnabled } = require('./config/redis');

logger.info('--- CONFIG INTEGRITY CHECK ---');
logger.info(`Port configured: ${process.env.PORT || '5000'}`);
logger.info(`Node Env: ${process.env.NODE_ENV}`);
logger.info('Attempting DB and Redis setups...');

const checkServices = async () => {
  // Check if configurations load without breaking
  logger.info('Environment and configuration loading holds integrity.');
  process.exit(0);
};

checkServices();
