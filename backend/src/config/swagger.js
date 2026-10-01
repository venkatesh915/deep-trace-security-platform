const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Deep Trace Cybernetics — Security Management Platform API',
      version: '1.0.0',
      description:
        'Production-style Multi-Tenant Security Platform API with JWT Authentication, RBAC, strict tenant isolation, Campaign Management, Security Events, and Audit Logging.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/app.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
