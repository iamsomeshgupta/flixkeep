require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const logger = require('./utils/logger');
const errorMiddleware = require('./middleware/errorMiddleware');
const { NotFoundError } = require('./utils/errors');

const app = express();

// Set HTTP Security headers
app.use(helmet());

// Enable CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// HTTP Request logging with Morgan streaming to Winston
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  })
);

// Compression middleware
app.use(compression());

// Parse incoming JSON and urlencoded payloads
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Sanitize MongoDB queries to prevent NoSQL injection
app.use(mongoSanitize());

// API Rate Limiting
const { apiLimiter } = require('./middleware/rateLimiter');
app.use('/api', apiLimiter);

// Basic API Healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'FlixKeep Server is healthy!',
    timestamp: new Date().toISOString(),
  });
});

const v1Router = require('./routes/v1');

// API Routes mounting point
app.use('/api/v1', v1Router);

// Catch-all for undefined routes
app.use((req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

// Global error handling middleware
app.use(errorMiddleware);

module.exports = app;
