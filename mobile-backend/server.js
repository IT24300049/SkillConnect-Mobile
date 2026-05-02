require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const logger = require('./middleware/logger');
const morganMiddleware = require('./middleware/morganLogger');
const sanitizeInput = require('./middleware/sanitize');
const swaggerConfig = require('./config/swagger');
const { initSentry, sentryErrorHandler } = require('./middleware/sentry');
const { initRedis, closeRedis } = require('./utils/cache');

const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const bookingRoutes = require('./routes/bookings');
const equipmentRoutes = require('./routes/equipment');
const reviewRoutes = require('./routes/reviews');
const complaintRoutes = require('./routes/complaints');
const profileRoutes = require('./routes/profile');
const rentalRoutes = require('./routes/rentals');
const adminRoutes = require('./routes/admin');

const app = express();

// Initialize Sentry error monitoring (must be before other middleware)
initSentry(app);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb' }));

// Logging middleware
app.use(morganMiddleware);

// Security: CORS with whitelist
const corsOptions = {
    origin: function (origin, callback) {
        // Temporarily allow all origins to ensure the emulator isn't blocked
        callback(null, true); 
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Security: Data sanitization (XSS prevention)
app.use(sanitizeInput);

// Swagger/OpenAPI documentation
const swaggerSpec = swaggerJsdoc(swaggerConfig);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Security: Rate limiting on auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

// API v1 Routes
const apiV1 = express.Router();

app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);
apiV1.use('/auth', authRoutes);
apiV1.use('/jobs', jobRoutes);
apiV1.use('/bookings', bookingRoutes);
apiV1.use('/equipment', equipmentRoutes);
apiV1.use('/reviews', reviewRoutes);
apiV1.use('/complaints', complaintRoutes);
apiV1.use('/profile', profileRoutes);
apiV1.use('/rentals', rentalRoutes);
apiV1.use('/admin', adminRoutes);

// Mount API v1
app.use('/api/v1', apiV1);

// Backward compatibility
app.use('/api', apiV1);

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        logger.info('Health check requested');
        res.json({
            status: 'ok',
            message: 'SkillConnect Mobile API running',
            timestamp: new Date().toISOString(),
            database: {
                status: mongoStatus,
                message: mongoStatus === 'connected' ? 'MongoDB connection active' : 'MongoDB connection inactive'
            }
        });
    } catch (error) {
        logger.error(`Health check error: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            timestamp: new Date().toISOString()
        });
    }
});

// 404 handler
app.use((req, res) => {
    logger.warn(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({
        status: 'error',
        message: 'Endpoint not found'
    });
});

// Sentry error handler (before global error handler)
app.use(sentryErrorHandler);

// Global error handler
app.use((err, req, res, next) => {
    logger.error(`Unhandled Error: ${err.message}\nStack: ${err.stack}`);
    res.status(err.status || 500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
    });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        logger.info('Connected to MongoDB');
        
        // Initialize Redis caching
        await initRedis();
        
        const server = app.listen(PORT, () => {
            logger.info(`Mobile backend running on http://localhost:${PORT}`);
            logger.info(`API v1 available at http://localhost:${PORT}/api/v1`);
            logger.info(`API documentation at http://localhost:${PORT}/api/docs`);
            logger.info(`Health check: http://localhost:${PORT}/api/health`);
        });

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            logger.info('SIGTERM received, shutting down gracefully...');
            server.close(async () => {
                await closeRedis();
                logger.info('Server closed');
                process.exit(0);
            });
        });
    })
    .catch(err => {
        logger.error(`MongoDB connection error: ${err.message}`);
        process.exit(1);
    });
