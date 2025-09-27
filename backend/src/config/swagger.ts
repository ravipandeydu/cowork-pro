import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import { env } from '@/config/env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CoWork Pro API',
      version: env.API_VERSION,
      description: `
        A comprehensive REST API for the CoWork Pro platform - a modern collaboration and content management system.
        
        ## Features
        - User authentication with JWT tokens
        - Post management with CRUD operations
        - File upload and management
        - Advanced search and filtering
        - Rate limiting and security
        - Comprehensive error handling
        
        ## Authentication
        Most endpoints require authentication using Bearer tokens. Include the token in the Authorization header:
        \`Authorization: Bearer <your-jwt-token>\`
        
        ## Rate Limiting
        API endpoints are rate-limited to ensure fair usage:
        - General API: 100 requests per 15 minutes
        - Authentication: 5 requests per 15 minutes
        - File uploads: 10 requests per hour
        
        ## Error Responses
        All error responses follow a consistent format:
        \`\`\`json
        {
          "success": false,
          "message": "Error description",
          "error": {
            "code": "ERROR_CODE",
            "details": "Additional error details"
          }
        }
        \`\`\`
      `,
      contact: {
        name: 'CoWork Pro Support',
        email: 'support@coworkpro.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
      {
        url: `http://localhost:${env.PORT}/api/${env.API_VERSION}`,
        description: 'Development API',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
        refreshToken: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description: 'Refresh token stored in httpOnly cookie',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
            },
            firstName: {
              type: 'string',
              description: 'User first name',
              maxLength: 50,
            },
            lastName: {
              type: 'string',
              description: 'User last name',
              maxLength: 50,
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            avatar: {
              type: 'string',
              description: 'User avatar URL',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'moderator'],
              default: 'user',
              description: 'User role',
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'Whether the user account is active',
            },
            isEmailVerified: {
              type: 'boolean',
              default: false,
              description: 'Whether the user email is verified',
            },
            lastLoginAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last login timestamp',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
          required: ['firstName', 'lastName', 'email'],
        },
        Pagination: {
          type: 'object',
          properties: {
            currentPage: {
              type: 'integer',
              minimum: 1,
              description: 'Current page number',
            },
            totalPages: {
              type: 'integer',
              minimum: 0,
              description: 'Total number of pages',
            },
            totalItems: {
              type: 'integer',
              minimum: 0,
              description: 'Total number of items',
            },
            hasNext: {
              type: 'boolean',
              description: 'Whether there is a next page',
            },
            hasPrev: {
              type: 'boolean',
              description: 'Whether there is a previous page',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code',
                },
                details: {
                  type: 'string',
                  description: 'Additional error details',
                },
                stack: {
                  type: 'string',
                  description: 'Error stack trace (development only)',
                },
              },
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Validation failed',
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string',
                        description: 'Field name that failed validation',
                      },
                      message: {
                        type: 'string',
                        description: 'Validation error message',
                      },
                      value: {
                        description: 'The value that failed validation',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad Request - Invalid input data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Invalid request data',
                error: {
                  code: 'BAD_REQUEST',
                  details: 'The request contains invalid or missing data',
                },
              },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized - Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Authentication required',
                error: {
                  code: 'UNAUTHORIZED',
                  details: 'Please provide a valid authentication token',
                },
              },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Access denied',
                error: {
                  code: 'FORBIDDEN',
                  details: 'You do not have permission to access this resource',
                },
              },
            },
          },
        },
        NotFound: {
          description: 'Not Found - Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Resource not found',
                error: {
                  code: 'NOT_FOUND',
                  details: 'The requested resource could not be found',
                },
              },
            },
          },
        },
        Conflict: {
          description: 'Conflict - Resource already exists',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Resource already exists',
                error: {
                  code: 'CONFLICT',
                  details: 'A resource with the same identifier already exists',
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation Error - Input validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError',
              },
            },
          },
        },
        TooManyRequests: {
          description: 'Too Many Requests - Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Rate limit exceeded',
                error: {
                  code: 'TOO_MANY_REQUESTS',
                  details: 'You have exceeded the rate limit. Please try again later',
                },
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Internal server error',
                error: {
                  code: 'INTERNAL_SERVER_ERROR',
                  details: 'An unexpected error occurred on the server',
                },
              },
            },
          },
        },
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10,
          },
        },
        SortParam: {
          name: 'sort',
          in: 'query',
          description: 'Field to sort by',
          required: false,
          schema: {
            type: 'string',
            default: 'createdAt',
          },
        },
        OrderParam: {
          name: 'order',
          in: 'query',
          description: 'Sort order',
          required: false,
          schema: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'desc',
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints for monitoring application status',
      },
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints (coming soon)',
      },
      {
        name: 'Files',
        description: 'File upload and management endpoints (coming soon)',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/models/*.ts',
  ],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  // Swagger UI options
  const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      requestInterceptor: (req: any) => {
        // Add any request interceptors here
        return req;
      },
      responseInterceptor: (res: any) => {
        // Add any response interceptors here
        return res;
      },
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6 }
      .swagger-ui .scheme-container { background: #f8fafc; padding: 10px; border-radius: 4px; }
    `,
    customSiteTitle: 'CoWork Pro API Documentation',
    customfavIcon: '/favicon.ico',
  };

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

  // Serve raw OpenAPI spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log(`📚 Swagger documentation available at: http://localhost:${env.PORT}/api-docs`);
  console.log(`📄 OpenAPI spec available at: http://localhost:${env.PORT}/api-docs.json`);
};

export { specs as swaggerSpecs };