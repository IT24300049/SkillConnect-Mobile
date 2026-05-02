/**
 * OpenAPI/Swagger Configuration
 * Provides interactive API documentation
 */

module.exports = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SkillConnect Mobile API',
            version: '1.0.0',
            description: 'Skill-sharing platform API for job posting, bookings, equipment rental, and reviews'
        },
        servers: [
            { url: 'http://localhost:5000/api/v1', description: 'Development' },
            { url: 'http://localhost:5000/api', description: 'Development (compat)' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        tags: [
            { name: 'Auth', description: 'Authentication' },
            { name: 'Jobs', description: 'Job management' },
            { name: 'Bookings', description: 'Booking management' },
            { name: 'Profile', description: 'User profiles' },
            { name: 'Reviews', description: 'Reviews' },
            { name: 'Equipment', description: 'Equipment rental' },
            { name: 'Complaints', description: 'Complaints' }
        ]
    },
    apis: []
};
