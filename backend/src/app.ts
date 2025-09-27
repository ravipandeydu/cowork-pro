import express, { Application, Request, Response } from 'express';
import compression from 'compression';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';
import {
  helmetConfig,
  corsConfig,
  mongoSanitizeConfig,
  xssProtection,
  requestSizeLimiter,
  securityHeaders,
  requestLogger,
  generalLimiter,
  speedLimiter,
} from '@/middlewares/security';
import {
  errorHandler,
  notFoundHandler,
} from '@/middlewares/errorHandler';

// Import routes
import healthRoutes from '@/routes/health.routes';
import authRoutes from '@/routes/auth.routes';

// Import Swagger configuration
import { setupSwagger } from '@/config/swagger';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeGlobalErrorHandlers();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeGlobalErrorHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.logError('Uncaught Exception', error, {
        type: 'UNCAUGHT_EXCEPTION',
        fatal: true,
      });
      
      // Give the logger time to write the log
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.logError('Unhandled Rejection', new Error(reason), {
        type: 'UNHANDLED_REJECTION',
        promise: promise.toString(),
      });
      
      // Close server gracefully
      this.gracefulShutdown();
    });

    // Handle SIGTERM signal (graceful shutdown)
    process.on('SIGTERM', () => {
      logger.logInfo('SIGTERM received, shutting down gracefully');
      this.gracefulShutdown();
    });

    // Handle SIGINT signal (Ctrl+C)
    process.on('SIGINT', () => {
      logger.logInfo('SIGINT received, shutting down gracefully');
      this.gracefulShutdown();
    });
  }

  private initializeMiddlewares(): void {
    // Trust proxy (for accurate IP addresses behind reverse proxy)
    this.app.set('trust proxy', 1);

    // Request logging
    this.app.use(requestLogger);

    // Security headers
    this.app.use(securityHeaders);

    // Helmet for security headers
    this.app.use(helmetConfig);

    // CORS configuration
    this.app.use(corsConfig);

    // Rate limiting
    this.app.use(generalLimiter);
    this.app.use(speedLimiter);

    // Request size limiting
    this.app.use(requestSizeLimiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // MongoDB injection prevention
    this.app.use(mongoSanitizeConfig);

    // XSS protection
    this.app.use(xssProtection);

    // Compression middleware
    this.app.use(compression({
      level: 6,
      threshold: 1024,
      filter: (req: Request, res: Response) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
    }));

    // API response time header
    this.app.use((req: Request, res: Response, next) => {
      const startTime = Date.now();
      
      // Override the end method to set header before response is sent
      const originalEnd = res.end.bind(res);
      res.end = function(chunk?: any, encoding?: any, cb?: () => void): Response {
        const responseTime = Date.now() - startTime;
        if (!res.headersSent) {
          res.setHeader('X-Response-Time', `${responseTime}ms`);
        }
        return originalEnd(chunk, encoding, cb);
      } as any;
      
      next();
    });
  }

  private initializeRoutes(): void {
    // API version prefix
    const API_PREFIX = `/api/v1`;

    // Setup Swagger documentation
    setupSwagger(this.app);

    // Health check routes (no API prefix for easier monitoring)
    this.app.use('/health', healthRoutes);

    // API routes
    this.app.use(`${API_PREFIX}/auth`, authRoutes);
    // this.app.use(`${API_PREFIX}/users`, userRoutes); // Will be added later

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'CoWork Pro API',
        version: '1.0.0',
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
        documentation: env.NODE_ENV === 'development' ? '/api-docs' : undefined,
      });
    });

    // API info endpoint
    this.app.get(API_PREFIX, (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'CoWork Pro API',
        version: '1.0.0',
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          auth: `${API_PREFIX}/auth`,
          users: `${API_PREFIX}/users`,
        },
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler (must be after all routes)
    this.app.use(notFoundHandler);

    // Global error handler (must be last)
    this.app.use(errorHandler);
  }

  private gracefulShutdown(): void {
    // Close HTTP server
    const server = this.app.get('server');
    if (server) {
      server.close((err?: Error) => {
        if (err) {
          logger.logError('Error during server shutdown', err);
          process.exit(1);
        }
        
        logger.logInfo('HTTP server closed');
        
        // Close database connection
        import('@/config/database').then(({ database }) => {
          database.disconnect()
            .then(() => {
              logger.logInfo('Database connection closed');
              process.exit(0);
            })
            .catch((error: Error) => {
              logger.logError('Error closing database connection', error);
              process.exit(1);
            });
        });
      });
    } else {
      process.exit(0);
    }

    // Force close after 30 seconds
    setTimeout(() => {
      logger.logError('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  }

  public getApp(): Application {
    return this.app;
  }
}

export default App;