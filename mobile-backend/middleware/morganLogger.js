const morgan = require('morgan');
const logger = require('./logger');

// Custom Morgan format that logs to Winston
const morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

// Create custom stream for Morgan to write to Winston
const stream = {
    write: (message) => logger.http(message.trim())
};

// Create Morgan middleware
const morganMiddleware = morgan(morganFormat, { stream });

module.exports = morganMiddleware;
