const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

// Define colors for console output
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white'
};

winston.addColors(colors);

// Define format
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// Define transports
const transports = [
    // Console transport
    new winston.transports.Console(),
    
    // Error log file (errors only)
    new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
            winston.format.printf(
                (info) => `${info.timestamp} ${info.level}: ${info.message}`
            )
        )
    }),
    
    // Combined log file (all levels)
    new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
            winston.format.printf(
                (info) => `${info.timestamp} ${info.level}: ${info.message}`
            )
        )
    })
];

// Create logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    levels,
    format,
    transports
});

module.exports = logger;
