const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Load environment variables
dotenv.config();

const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const securityEventRoutes = require('./routes/securityEventRoutes');
const userRoutes = require('./routes/userRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-permissive while preserving headers
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing with sane size limits to prevent payload flood attacks
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Apply general API rate limiting to all /api routes
app.use('/api', apiLimiter);

// API Documentation via Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'deep-trace-security-platform-backend',
    version: '1.0.0',
  });
});

// Primary REST API routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/security-events', securityEventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Catch undefined routes (404)
app.use(notFoundHandler);

// Global Centralized Error Handler
app.use(errorHandler);

module.exports = app;
