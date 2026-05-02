const Sentry = require('@sentry/node');

/**
 * Initialize Sentry error tracking and monitoring
 * Captures exceptions, performance metrics, and releases
 */
const initSentry = (app) => {
    if (!process.env.SENTRY_DSN) {
        console.log('⚠️  SENTRY_DSN not configured - error monitoring disabled');
        return;
    }

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.OnUncaughtException(),
            new Sentry.Integrations.OnUnhandledRejection()
        ],
        beforeSend: (event, hint) => {
            if (event.exception) {
                const error = hint.originalException;
                console.error('🚨 Sentry: Capturing error', {
                    message: error.message,
                    url: event.request?.url
                });
            }
            return event;
        }
    });

    // Request handler - should be first middleware
    app.use(Sentry.Handlers.requestHandler());

    // Tracing middleware
    app.use(Sentry.Handlers.tracingHandler());

    console.log('✅ Sentry error monitoring initialized');
};

/**
 * Sentry error handler middleware - should be after all other handlers
 */
const sentryErrorHandler = Sentry.Handlers.errorHandler();

/**
 * Manually capture exception with context
 */
const captureException = (error, context = {}) => {
    if (!process.env.SENTRY_DSN) return;
    
    Sentry.captureException(error, {
        contexts: {
            custom: context
        }
    });
};

/**
 * Manually capture message for non-error events
 */
const captureMessage = (message, level = 'info', context = {}) => {
    if (!process.env.SENTRY_DSN) return;
    
    Sentry.captureMessage(message, {
        level,
        contexts: {
            custom: context
        }
    });
};

module.exports = {
    initSentry,
    sentryErrorHandler,
    captureException,
    captureMessage
};
