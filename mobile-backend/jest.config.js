module.exports = {
    testEnvironment: 'node',
    coveragePathIgnorePatterns: ['/node_modules/'],
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    collectCoverageFrom: [
        'routes/**/*.js',
        'models/**/*.js',
        'middleware/**/*.js',
        '!middleware/logger.js',
        '!middleware/morganLogger.js'
    ],
    testTimeout: 10000,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};
